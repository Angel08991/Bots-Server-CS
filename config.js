module.exports = {
  // Área general que indicaste.
  area: { xMin: 0, xMax: 200, zMin: 0, zMax: 150 },

  // Pon aquí las coordenadas EXACTAS de crates/tradeos cuando las tengas.
  // Ejemplo: { x: 84, y: 47, z: 63 }
  // Mientras estén en null, los bots NO fingirán que un punto aleatorio es una crate.
  points: {
    crates: null,
    trades: null
  },

  playerInteraction: {
    detectionRadius: 10,
    approachRadius: 3.2,
    interactionChance: 0.55
  }
};
