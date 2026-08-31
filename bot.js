const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const minecraftData = require("minecraft-data");
const config = require("./config");

const HOST = process.env.SERVER_HOST;
const PORT = Number(process.env.SERVER_PORT || 25565);
const VERSION = process.env.MC_VERSION || "1.21";
const BOT_COUNT = Math.min(10, Math.max(1, Number(process.env.BOT_COUNT || 10)));

const NAMES = Array.from({length: BOT_COUNT}, (_, i) =>
  `CS_Bot_${String(i + 1).padStart(2, "0")}`
);

const CHAT = [
  "hola gente 👋", "buenas xd", "que tal?", "alguien va a la mina?",
  "voy a dar una vuelta por spawn", "alguien para dungeon?",
  "quien quiere tradear?", "alguien sabe donde estan las crates?",
  "este spawn esta brutal xd", "voy a explorar un rato",
  "yo estoy por spawn", "alguien quiere venir?", "que hacen?",
  "jajaja", "todo bien gente?", "me perdi xd", "ya vuelvo",
  "alguien esta haciendo rtp?", "voy a farmear un rato"
];

const REPLIES = [
  "si xd", "yo voy", "dale", "vamos", "ahora voy", "jajaja", "ni idea",
  "creo que esta por spawn", "estoy por aqui", "espera un segundo",
  "yo tambien", "de una", "ok", "ya llego", "vamos juntos"
];

const PERSONALITIES = [
  {name:"social", social:.85, zone:.30, chat:.95},
  {name:"social", social:.80, zone:.35, chat:.85},
  {name:"explorer", social:.35, zone:.85, chat:.45},
  {name:"explorer", social:.30, zone:.90, chat:.35},
  {name:"crates", social:.50, zone:.65, chat:.55},
  {name:"crates", social:.45, zone:.70, chat:.50},
  {name:"trader", social:.60, zone:.65, chat:.65},
  {name:"trader", social:.55, zone:.70, chat:.60},
  {name:"chill", social:.30, zone:.35, chat:.25},
  {name:"social", social:.90, zone:.40, chat:.90}
];

if (!HOST) {
  console.error("Falta SERVER_HOST en GitHub Secrets.");
  process.exit(1);
}

const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function insideArea(p) {
  return p.x >= config.area.xMin && p.x <= config.area.xMax &&
         p.z >= config.area.zMin && p.z <= config.area.zMax;
}

function randomPoint(bot) {
  return {
    x: rand(config.area.xMin + 5, config.area.xMax - 5),
    y: Math.floor(bot.entity.position.y),
    z: rand(config.area.zMin + 5, config.area.zMax - 5)
  };
}

function createBot(username, index) {
  const personality = PERSONALITIES[index % PERSONALITIES.length];

  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username,
    version: VERSION,
    auth: "offline"
  });

  bot.loadPlugin(pathfinder);

  let destinationTimer, chatTimer, lookTimer, jumpTimer;
  let socialTimer, routineTimer, stuckTimer;
  let lastPos = null, lastMove = Date.now();
  let interacting = false;
  let lastPlayer = null;

  bot.once("spawn", () => {
    console.log(`[${username}] conectado | personalidad=${personality.name}`);

    const data = minecraftData(bot.version);
    const movements = new Movements(bot, data);
    movements.canDig = false;
    movements.allow1by1towers = false;
    movements.allowParkour = true;
    movements.allowSprinting = true;
    movements.maxDropDown = 3;
    bot.pathfinder.setMovements(movements);

    bot.setControlState("sprint", true);

    setTimeout(() => routine(), 2500 + index * 1200);
    scheduleChat();

    // Mirar alrededor y mirar a jugadores cercanos.
    lookTimer = setInterval(() => {
      if (!bot.entity || interacting) return;

      const target = closestPlayer(12);
      if (target && Math.random() < .75) {
        bot.lookAt(target.entity.position.offset(0, 1.45, 0), true).catch(()=>{});
      } else {
        bot.look(
          Math.random() * Math.PI * 2 - Math.PI,
          (Math.random() - .5) * .22,
          true
        ).catch(()=>{});
      }
    }, rand(1800, 3500));

    // Saltos naturales.
    jumpTimer = setInterval(() => {
      if (!bot.entity || interacting || !bot.pathfinder.isMoving()) return;
      if (Math.random() < .32) {
        bot.setControlState("jump", true);
        setTimeout(() => {
          if (bot.entity) bot.setControlState("jump", false);
        }, rand(220, 520));
      }
    }, rand(4000, 7500));

    // Interacción social con jugadores reales.
    socialTimer = setInterval(() => {
      if (!bot.entity || interacting) return;
      const target = closestPlayer(config.playerInteraction.detectionRadius);
      if (target && Math.random() < personality.social * config.playerInteraction.interactionChance) {
        interactWithPlayer(target);
      }
    }, rand(5000, 9000));

    // Anti-stuck.
    stuckTimer = setInterval(() => {
      if (!bot.entity) return;
      const p = bot.entity.position;
      if (lastPos && p.distanceTo(lastPos) < .75 && Date.now() - lastMove > 9000) {
        console.log(`[${username}] atascado; cambiando ruta.`);
        bot.pathfinder.stop();
        interacting = false;
        goTo(randomPoint(bot));
        lastMove = Date.now();
      } else if (lastPos && p.distanceTo(lastPos) >= .75) {
        lastMove = Date.now();
      }
      lastPos = p.clone();
    }, 3000);
  });

  function closestPlayer(radius) {
    if (!bot.entity) return null;
    let best = null;
    let bestD = radius;
    for (const p of Object.values(bot.players)) {
      if (!p.entity || p.username === bot.username) continue;
      const d = bot.entity.position.distanceTo(p.entity.position);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }

  function goTo(point, pause = true) {
    if (!bot.entity) return;
    const y = Number.isFinite(point.y) ? point.y : Math.floor(bot.entity.position.y);
    bot.setControlState("sprint", true);
    bot.pathfinder.setGoal(new goals.GoalNear(point.x, y, point.z, 2));
    console.log(`[${username}] destino X=${point.x} Y=${y} Z=${point.z}`);

    clearTimeout(destinationTimer);
    destinationTimer = setTimeout(() => {
      if (!bot.entity || interacting) return;
      if (pause && Math.random() < .18) {
        bot.setControlState("sprint", false);
        setTimeout(() => {
          if (bot.entity && !interacting) {
            bot.setControlState("sprint", true);
            routine();
          }
        }, rand(1500, 4500));
      } else {
        routine();
      }
    }, rand(16000, 33000));
  }

  async function interactWithPlayer(player) {
    if (!player.entity || interacting) return;
    interacting = true;
    lastPlayer = player;

    bot.pathfinder.setGoal(new goals.GoalNear(
      player.entity.position.x,
      Math.floor(player.entity.position.y),
      player.entity.position.z,
      config.playerInteraction.approachRadius
    ));

    bot.setControlState("sprint", false);

    await sleep(rand(1200, 2800));
    if (!bot.entity || !player.entity) {
      interacting = false;
      return;
    }

    bot.lookAt(player.entity.position.offset(0, 1.45, 0), true).catch(()=>{});

    if (Math.random() < .8) {
      bot.chat(pick(["hola 👋", "buenas", "que tal?", "hola amigo", "hey xd"]));
    }

    // Agacharse/sneak como saludo.
    await sleep(rand(700, 1300));
    bot.setControlState("sneak", true);
    await sleep(rand(450, 900));
    bot.setControlState("sneak", false);

    // Animación de brazo.
    if (Math.random() < .8) {
      bot.swingArm("right");
    }

    // A veces responde una segunda frase.
    if (Math.random() < .45) {
      await sleep(rand(900, 1800));
      bot.chat(pick(["todo bien?", "que haces por aqui?", "voy a crates", "yo estoy dando una vuelta", "nos vemos xd"]));
    }

    await sleep(rand(1200, 3000));
    bot.setControlState("sprint", true);
    interacting = false;
    routine();
  }

  function routine() {
    if (!bot.entity || interacting) return;

    // Personalidades influyen en las visitas, sin inventar coordenadas.
    const r = Math.random();
    if (personality.name === "crates" && config.points.crates && r < .55) {
      visitPoint("crates", config.points.crates);
    } else if (personality.name === "trader" && config.points.trades && r < .55) {
      visitPoint("tradeos", config.points.trades);
    } else if (personality.zone > .65 && config.points.crates && r < .20) {
      visitPoint("crates", config.points.crates);
    } else if (personality.zone > .65 && config.points.trades && r < .35) {
      visitPoint("tradeos", config.points.trades);
    } else {
      goTo(randomPoint(bot));
    }
  }

  async function visitPoint(label, point) {
    if (!point) return;
    console.log(`[${username}] va a ${label}`);
    goTo(point, false);

    await sleep(rand(9000, 16000));
    if (!bot.entity || interacting) return;

    bot.pathfinder.stop();
    bot.setControlState("sprint", false);

    // Mirar alrededor y pequeños gestos mientras está en la zona.
    bot.look(Math.random()*Math.PI*2-Math.PI, 0, true).catch(()=>{});
    if (Math.random() < .55) bot.swingArm("right");

    if (Math.random() < personality.chat) {
      bot.chat(label === "crates" ? pick([
        "voy a ver las crates", "a ver que sale xd", "hay algo bueno en crates?"
      ]) : pick([
        "voy a ver los tradeos", "alguien quiere tradear?", "que estaran dando por aqui?"
      ]));
    }

    await sleep(rand(4000, 9000));
    bot.setControlState("sprint", true);
    routine();
  }

  function scheduleChat() {
    clearTimeout(chatTimer);
    chatTimer = setTimeout(() => {
      if (bot.entity && !interacting && Math.random() < personality.chat) {
        bot.chat(pick(CHAT));
      }
      scheduleChat();
    }, rand(11000, 30000));
  }

  bot.on("chat", (sender, message) => {
    if (!bot.entity || sender === bot.username || interacting) return;

    const lower = message.toLowerCase();
    if (!/hola|hey|buenas|mina|crates|dungeon|trade|encant|rtp|spawn|quien|alguien|vamos|que tal/.test(lower)) return;

    if (Math.random() < .20 * personality.chat) {
      setTimeout(() => {
        if (bot.entity && !interacting) bot.chat(pick(REPLIES));
      }, rand(1600, 5000));
    }
  });

  bot.on("physicTick", () => {
    if (bot.entity && bot.pathfinder.isMoving() && !interacting) {
      bot.setControlState("sprint", true);
    }
  });

  bot.on("error", e => console.log(`[${username}] ERROR: ${e.message}`));
  bot.on("kicked", r => console.log(`[${username}] KICK: ${r}`));

  bot.on("end", () => {
    clearTimeout(destinationTimer);
    clearTimeout(chatTimer);
    clearTimeout(routineTimer);
    clearInterval(lookTimer);
    clearInterval(jumpTimer);
    clearInterval(socialTimer);
    clearInterval(stuckTimer);
    bot.setControlState("sneak", false);

    const delay = 10000 + index * 2500;
    console.log(`[${username}] desconectado; reconecta en ${delay/1000}s.`);
    setTimeout(() => createBot(username, index), delay);
  });
}

NAMES.forEach((name,index) => setTimeout(() => createBot(name,index), index * 9000));
