# SPEC 02 — Power Pellets y fantasmas comibles

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-02
> **Objetivo:** Que Pacman coma 4 Power Pellets que vuelven comibles a los fantasmas durante 6 segundos, con puntuación en cadena y retorno del fantasma comido a la pen.

## Por qué existe esta spec

SPEC 01 dejó explícitamente fuera los power pellets. Hoy la única interacción con un fantasma es perder una vida, así que no hay mecánica de remontada. Esta spec añade el ciclo clásico de riesgo/recompensa: comer el pellet invierte temporalmente la amenaza.

## Scope

**In:**

- Tile nuevo `4` (power pellet) en las 4 esquinas clásicas del laberinto: (1,3), (26,3), (1,23) y (26,23).
- Comer un pellet: +50 puntos y modo poder de 360 frames (6s a 60fps).
- Fantasmas asustados mientras dura el poder: comibles y al 50% de su velocidad.
- Comer un fantasma asustado: 200 × 2^n puntos (200 → 400 → 800…); el fantasma vuelve a la pen y sale enseguida.
- La cadena y el timer se reinician con cada pellet nuevo.
- Los pellets cuentan para ganar, igual que los dots.
- Render: pellets grandes parpadeantes; fantasmas azules con parpadeo blanco los últimos 2s.

**Out of scope (para futuras specs):**

- Ojos que viajan hasta la pen (el fantasma comido se teleporta).
- Texto flotante con los puntos al comer un fantasma.
- Duración del poder variable por nivel.
- Los 4 fantasmas clásicos con personalidades (ya apuntado en SPEC 01).

## Data model

```js
// maze.js — constantes nuevas (exportadas por window)
const POWER_PELLET_FRAMES    = 360;  // 6s a 60fps
const POWER_FLASH_FRAMES     = 120;  // últimos 2s: parpadeo de aviso
const GHOST_FRIGHTENED_SPEED = 0.05; // la mitad de GHOST_SPEED (0.1)

// maze.js — MAZE_STR: '.' → 'o' en (1,3), (26,3), (1,23), (26,23)
// parseTile: 'o' → 4

// game.js — el objeto game gana dos campos:
{ powerFrames: 0, ghostChain: 0 }
// powerFrames: frames restantes de modo poder (0 = juego normal)
// ghostChain:  fantasmas comidos con el pellet actual

// game.js — cada ghost gana un campo:
{ frightened: false }

// Puntos por fantasma comido: 200 * 2^ghostChain
```

Convenciones heredadas de SPEC 01: timers en frames (no reloj real), colisión por distancia < 0.5 celda, coordenadas de celda con origen arriba-izquierda.

## Implementation plan

1. `maze.js`: `'o'` en las 4 esquinas de `MAZE_STR`, `parseTile('o') → 4`, constantes `POWER_PELLET_FRAMES`, `POWER_FLASH_FRAMES`, `GHOST_FRIGHTENED_SPEED` y export por `window`. El tile 4 aún no se dibuja ni se come: el juego queda igual.
2. `render.js`: `drawPowerPellets` para el tile 4 (círculo grande ~6px, parpadeo on/off con `frame`). Test manual: 4 pellets parpadean en las esquinas.
3. `game.js` — `createGame`: contar el tile 4 en `dotsRemaining`. `movePacman`: comer pellet → `score += 50`, `powerFrames = POWER_PELLET_FRAMES`, `frightened = true` en todos los ghosts, `ghostChain = 0`. Test: comer un pellet suma 50.
4. `game.js` — `update`: decrementar `powerFrames` al inicio; al llegar a 0, `frightened = false` en todos y `ghostChain = 0`.
5. `game.js` — `moveGhost`: usar `GHOST_FRIGHTENED_SPEED` cuando `frightened`. Test: los azules van visiblemente más lento.
6. `game.js` — colisión en `update`: ghost `frightened` → `score += 200 * 2^ghostChain`, `ghostChain++`, y reset del ghost a su celda de `GHOST_STARTS` con `penState = 'leaving'` y `frightened = false`. Ghost normal → resta vida (comportamiento actual intacto).
7. `game.js` — `resetPositions`: apagar el modo poder (`powerFrames = 0`, `ghostChain = 0`, `frightened = false` en todos).
8. `render.js`: ghost asustado en `#2121de`; si `powerFrames < POWER_FLASH_FRAMES`, alternar blanco/azul con `frame`. Test: parpadeo de aviso al final del poder.

## Acceptance criteria

- [ ] Se ven 4 pellets grandes parpadeando en (1,3), (26,3), (1,23) y (26,23).
- [ ] Comer un pellet suma exactamente 50 puntos.
- [ ] Al comer un pellet, todos los fantasmas se pintan azules de inmediato, incluidos los que están en la pen.
- [ ] Mientras dura el poder, los fantasmas azules van visiblemente más lento que Pacman.
- [ ] Chocar con un fantasma azul lo come: suma 200 el primero y 400 el segundo con el mismo pellet.
- [ ] El fantasma comido reaparece en la pen y está fuera de ella (fila ≤ 11) en menos de 2s.
- [ ] El fantasma comido reaparece sin estar asustado: no es comible hasta el siguiente pellet.
- [ ] Chocar con un fantasma no asustado resta una vida, igual que ahora.
- [ ] El poder dura ~6s y en los últimos ~2s los fantasmas parpadean entre azul y blanco.
- [ ] Comer un segundo pellet reinicia timer y cadena: el siguiente fantasma vuelve a valer 200.
- [ ] Perder una vida cancela el poder: fantasmas normales y cadena a 0 tras el reset.
- [ ] Un fantasma que sale de la pen durante el poder sale azul y comible.
- [ ] No se gana hasta comer también los 4 pellets.
- [ ] Sin regresiones: dots +10, salida escalonada de la pen (SPEC 01), túnel, vidas y overlays GANASTE/PERDISTE funcionan igual.

## Decisions

- **Sí:** tile numérico `4` en el grid — reutiliza la mecánica de comer del dot (2) sin estructuras nuevas. **No:** lista paralela de pellets — duplicaría el estado.
- **Sí:** timer global `powerFrames` + flag `frightened` por ghost. **No:** timer por fantasma — en el original el modo poder es global.
- **Sí:** fantasma comido vuelve a la pen con `penState 'leaving'` — reutiliza la puerta direccional y la mini-regla de salida de SPEC 01.
- **No:** estado 'eyes' con viaje de vuelta — su propia spec si aterriza.
- **Sí:** velocidad asustada 0.05 (mitad) — da ventana real de caza sin romper el ritmo del juego.
- **No:** inversión de dirección 180° al comer el pellet — descartada por el usuario; queda para una spec de fidelidad arcade.
- **Sí:** cadena 200 × 2^n reiniciada por pellet — fiel al original; con 2 fantasmas llega a 400 y la fórmula queda lista para 4.
- **Sí:** los fantasmas de la pen salen comibles si el poder está activo — flag marcado en todos al comer el pellet, como el original.
- **Sí:** pellets cuentan en `dotsRemaining` — ganar exige vaciar el nivel, como el original.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Colisión y fin de poder en el mismo frame | Orden fijado: `powerFrames` se decrementa al inicio de `update()`; las colisiones se comprueban después |
| `dotsRemaining` ahora incluye pellets: una regresión bloquearía la victoria | Criterio de aceptación dedicado: no se gana sin comer los 4 pellets |
| `ghostChain` sin reiniciar dispararía la puntuación | Se reinicia al comer pellet, al agotarse el timer y al perder vida |

## What is **not** in this spec

- Ojos viajando a la pen.
- Texto flotante de puntos.
- Duración por nivel y niveles múltiples.
- Los 4 fantasmas clásicos.

Cada uno, si aterriza, va en su propia spec.
