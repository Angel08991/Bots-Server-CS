const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const minecraftData = require("minecraft-data");

const HOST = process.env.SERVER_HOST;
const PORT = Number(process.env.SERVER_PORT || 25565);
const VERSION = process.env.MC_VERSION || false;
const BOT_COUNT = Math.min(10, Math.max(1, Number(process.env.BOT_COUNT || 10)));

const X_MIN = 0, X_MAX = 200;
const Z_MIN = 0, Z_MAX = 150;

const BOT_NAMES = Array.from({length: BOT_COUNT}, (_, i) =>
  `CS_Bot_${String(i + 1).padStart(2, "0")}`
);

const phrases = [
  "hola 👋",
  "alguien sabe donde estan las crates?",
  "voy a la mina xd",
  "que buen spawn",
  "alguien para hacer dungeon?",
  "voy a explorar un rato",
  "jajaja",
  "que tal gente?",
  "alguien quiere tradear?",
  "me voy a hacer rtp",
  "estoy buscando recursos",
  "alguien sabe donde esta el encantamiento?",
  "voy a dejarme afk un rato",
  "ese spawn esta brutal",
  "alguien quiere venir conmigo?"
];

if (!HOST) {
  console.error("Falta SERVER_HOST.");
  process.exit(1);
}

function rand(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function choose(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createBot(username, index) {
  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username,
    version: VERSION || undefined,
    auth: "offline"
  });

  bot.loadPlugin(pathfinder);

  let walkTimer;
  let chatTimer;
  let lookTimer;
  let jumpTimer;

  bot.once("spawn", () => {
    console.log(`[${username}] conectado.`);

    const mcData = minecraftData(bot.version);
    const movements = new Movements(bot, mcData);
    movements.canDig = false;
    movements.allow1by1towers = false;
    movements.allowParkour = true;
    bot.pathfinder.setMovements(movements);

    scheduleWalk();
    scheduleChat();

    lookTimer = setInterval(() => {
      if (!bot.entity) return;
      const yaw = Math.random() * Math.PI * 2 - Math.PI;
      const pitch = (Math.random() - 0.5) * 0.3;
      bot.look(yaw, pitch, true).catch(() => {});
    }, rand(5000, 11000));

    jumpTimer = setInterval(() => {
      if (bot.entity && !bot.pathfinder.isMoving() && Math.random() < 0.35) {
        bot.setControlState("jump", true);
        setTimeout(() => bot.setControlState("jump", false), 300);
      }
    }, rand(7000, 15000));
  });

  function scheduleWalk() {
    if (!bot.entity) return;

    const x = rand(X_MIN + 4, X_MAX - 4);
    const z = rand(Z_MIN + 4, Z_MAX - 4);
    const y = Math.floor(bot.entity.position.y);

    bot.pathfinder.setGoal(new goals.GoalNear(x, y, z, 2));

    walkTimer = setTimeout(() => {
      // Pausa antes de escoger otro destino.
      setTimeout(scheduleWalk, rand(2500, 9000));
    }, rand(12000, 30000));
  }

  function scheduleChat() {
    // Cada bot tiene un intervalo distinto; nunca se mandan mensajes en masa.
    chatTimer = setTimeout(() => {
      if (bot.entity && Math.random() < 0.72) {
        bot.chat(choose(phrases));
      }
      scheduleChat();
    }, rand(25000, 70000));
  }

  bot.on("chat", (username2, message) => {
    if (username2 === bot.username) return;
    // Respuestas ocasionales, con baja probabilidad para evitar spam.
    if (Math.random() < 0.08 && /hola|hey|alguien|crates|mina|dungeon/i.test(message)) {
      setTimeout(() => {
        if (bot.entity) bot.chat(choose([
          "si xd",
          "yo voy",
          "ni idea jaja",
          "vamos",
          "ahora voy",
          "creo que esta por spawn"
        ]));
      }, rand(2500, 7000));
    }
  });

  bot.on("error", err => console.log(`[${username}] error: ${err.message}`));
  bot.on("kicked", reason => console.log(`[${username}] expulsado: ${reason}`));

  bot.on("end", () => {
    clearTimeout(walkTimer);
    clearTimeout(chatTimer);
    clearInterval(lookTimer);
    clearInterval(jumpTimer);

    const delay = 12000 + index * 2500;
    console.log(`[${username}] desconectado. Reconexión en ${delay / 1000}s.`);
    setTimeout(() => createBot(username, index), delay);
  });
}

BOT_NAMES.forEach((name, index) => {
  setTimeout(() => createBot(name, index), index * 9000);
});
