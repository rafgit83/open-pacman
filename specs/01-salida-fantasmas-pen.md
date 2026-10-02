# SPEC 01 — Salida de los fantasmas de la pen

> **Estado:** Aprobado
> **Depende de:** —
> **Fecha:** 2026-10-02
> **Objetivo:** Que los fantasmas salgan de la pen de forma escalonada y garantizada, al empezar la partida y tras cada vida perdida.

## Por qué existe esta spec

Los fantasmas nacen dentro de la pen (13,14) y (14,14). La IA actual permite que el `hunter` salga, pero el `random` puede quedar rebotando verticalmente en las columnas laterales de la pen (cols 11 y 16) sin encontrar nunca la puerta: es el bug reportado.

## Scope

**In:**

- Estados de pen por fantasma: `waiting` → `leaving` → `out`.
- Salida escalonada: hunter inmediato, random tras 4 segundos (240 frames).
- Mini-regla de navegación **solo dentro de la pen** para el estado `leaving`: caminar a la columna de puerta más cercana (13 o 14) y subir.
- Puerta direccional para fantasmas: abierta solo en `leaving`; en `waiting` y `out` es muro.
- Tras perder vida, `resetPositions` restaura el ciclo completo de salida.

**Out of scope (para futuras specs):**

- Los 4 fantasmas clásicos (Blinky, Pinky, Inkey, Clyde) con personalidades.
- Power pellets y fantasmas comibles.
- Movimiento por tiempo real (`dt`) en lugar de por frames.
- Oleadas Scatter/Chase del original.

## Data model

```js
// maze.js — constantes nuevas
const PEN_DOOR_COLS = [13, 14]; // columnas de la puerta (celdas '-', fila 12)
const PEN_OUT_ROW = 11;         // primera fila fuera de la pen

const GHOST_STARTS = [
  { x: 13, y: 14, kind: 'hunter', exitDelayFrames: 0 },
  { x: 14, y: 14, kind: 'random', exitDelayFrames: 240 }, // 4s a 60fps
];

// game.js — cada ghost gana dos campos:
//   waitFrames: frames restantes hasta su turno de salida
//   penState:   'waiting' (dentro, puerta cerrada)
//             | 'leaving' (dentro, puerta abierta, mini-regla)
//             | 'out'     (fuera, puerta cerrada, IA actual intacta)
```

## Implementation plan

1. `maze.js`: añadir `PEN_DOOR_COLS`, `PEN_OUT_ROW` y `exitDelayFrames` a `GHOST_STARTS`; exportarlos por `window`. Sin cambios de comportamiento.
2. `game.js` — `createGame`: añadir `waitFrames` y `penState` inicial a cada ghost (`'waiting'` si hay espera, `'leaving'` si no).
3. `game.js` — regla de puerta en `isWall`/`canMove`: la celda 3 es muro para pacman siempre y para ghost salvo `penState === 'leaving'`. Test manual: el hunter sale; el random rebota dentro sin cruzar.
4. `game.js` — `moveGhost`: decrementar `waitFrames` de los ghosts en `'waiting'` y pasar a `'leaving'` al llegar a 0.
5. `game.js` — mini-regla en decisiones alineadas con `penState === 'leaving'`: si la columna no es 13/14, paso horizontal hacia la más cercana; si lo es, `dir = 'up'`.
6. `game.js` — transición a `'out'` cuando un ghost alineado queda en fila ≤ `PEN_OUT_ROW`; desde entonces `decideGhost` intacto y puerta = muro.
7. `game.js` — `resetPositions`: restaurar `waitFrames` y `penState` desde `GHOST_STARTS`.

## Acceptance criteria

- [ ] Al pulsar Start, el hunter (rojo) está fuera de la pen (fila ≤ 11) en menos de 2 segundos.
- [ ] Al pulsar Start, el random (cian) se ve moverse dentro de la pen durante ~4s y no cruza la puerta antes de tiempo.
- [ ] Al vencer su espera, el random sale de la pen en menos de 2 segundos adicionales.
- [ ] Ningún fantasma vuelve a entrar en la pen una vez fuera.
- [ ] Tras perder una vida, el hunter sale de inmediato y el random espera otros 4s (patrón idéntico al inicio).
- [ ] Ningún fantasma rebota indefinidamente en la pen: todos están en el mapa en < 7s desde el inicio de su turno.
- [ ] Sin regresiones: dots, score, colisiones, túnel, victoria y derrota funcionan igual.

## Decisions

- **Sí:** `penState` por fantasma con 3 estados — mínimo para soportar escalonado + puerta direccional.
- **No:** BFS/A* para salir — sobreingeniería; la pen es pequeña y la mini-regla de 2 pasos basta.
- **Sí:** timer en frames (240), coherente con el modelo por-frames del juego. **No:** `setTimeout`/reloj real, desacoplaría la lógica del bucle.
- **Sí:** puerta con dirección (salir sí, re-entrar no) — fiel al original y elimina el re-atrapamiento.
- **Sí:** re-esperar 4s tras cada vida perdida — consistente con "la salida se aplica tras cada reset".
- **No:** 4 fantasmas y fantasmas comibles — cada uno en su propia spec.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El juego asume 60fps: 240 frames son 4s solo a 60Hz (en 120Hz serían ~2s) | Constante `exitDelayFrames` ajustable; migrar a tiempo real va en otra spec |
| Si se edita el laberinto, la pen podría ganar un callejón para el estado `'waiting'` | El fallback de reversa 180° ya existente en `decideGhost` lo cubre |

## What is **not** in this spec

- Los 4 fantasmas clásicos con personalidades.
- Fantasmas comibles (power pellets).
- Movimiento basado en tiempo real.
- Scatter/Chase por oleadas.

Cada uno, si aterriza, va en su propia spec.
