# CS Studios — Spawn Bots V3

Bots Mineflayer para pruebas/ambientación de un servidor Minecraft.

## Área
X: 0 → 200
Z: 0 → 150

## V3
- Corre/esprinta durante los recorridos.
- Salta ocasionalmente.
- Cambia de destino.
- Anti-stuck.
- Mira a jugadores cercanos.
- Se acerca ocasionalmente a jugadores reales.
- Saluda y responde de forma ocasional.
- Hace sneak/agacharse como saludo.
- Hace animación de brazo.
- Tiene 5 tipos de personalidad para que no actúen todos igual.
- Chat con frases variadas y tiempos diferentes.
- Visitas a crates y tradeos mediante coordenadas configurables.
- Reconexión automática.

## Coordenadas de crates y tradeos
No se inventan coordenadas. Edita `config.js` y coloca:

points: {
  crates: { x: 0, y: 0, z: 0 },
  trades: { x: 0, y: 0, z: 0 }
}

Sustituye esos valores por las coordenadas reales de las dos zonas.

## GitHub Secrets
SERVER_HOST
SERVER_PORT
MC_VERSION

## Ejecutar
Actions → CS Studios - 10 Spawn Bots V3 → Run workflow → 10.

Nota: GitHub Actions es temporal y no está diseñado como servicio 24/7.
