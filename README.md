# CS Studios — 10 Spawn Bots

Sistema de bots Mineflayer para pruebas/ambientación del spawn.

## Zona
X: 0 → 200
Z: 0 → 150

## Incluye
- 10 bots predeterminados: CS_Bot_01 ... CS_Bot_10
- Entrada escalonada: 9 segundos entre bots
- Movimiento aleatorio dentro de X/Z
- Pausas aleatorias
- Mirar alrededor
- Saltos ocasionales
- Chat aleatorio con intervalos de 25–70 segundos
- Respuestas ocasionales a mensajes relacionados
- Reconexión automática

## GitHub Secrets
Crea en Settings → Secrets and variables → Actions:

SERVER_HOST = IP/dominio
SERVER_PORT = puerto
MC_VERSION = versión, por ejemplo 1.21.8 (opcional si Mineflayer la detecta)

## Uso
Actions → CS Studios - 10 Spawn Bots → Run workflow.
El valor por defecto es 10; puedes bajarlo entre 1 y 10.

## Nota
GitHub Actions es temporal y no sustituye un VPS para ejecución 24/7.
Usa los bots para pruebas o ambientación permitida por la administración del servidor.
