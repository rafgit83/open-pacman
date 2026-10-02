// maze.js
// Laberinto 28x31 fiel a la geometria del nivel 1 de Pac-Man.
// Se escribe como 31 strings de 28 chars (legible) y se parsea a numeros.
//   '#' pared(1) · '.' dot(2) · ' ' vacio transitable(0) · '-' puerta pen(3)
//   'o' power pellet(4)
// Coordenadas: celda (x,y), origen arriba-izquierda. x in [0,27], y in [0,30].
// Simetrico respecto al eje vertical central (entre cols 13 y 14).

const MAZE_STR = [
  '############################', // 0  borde
  '#............##............#', // 1
  '#.####.#####.##.#####.####.#', // 2
  '#o####.#####.##.#####.####o#', // 3  power pellets esquinas superiores
  '#.####.#####.##.#####.####.#', // 4
  '#..........................#', // 5
  '#.####.##.########.##.####.#', // 6
  '#.####.##.########.##.####.#', // 7
  '#......##....##....##......#', // 8
  '######.#####.##.#####.######', // 9
  '######.#####.##.#####.######', // 10
  '######.##..........##.######', // 11
  '######.##.###--###.##.######', // 12  puerta pen cols 13-14
  '######.##.#      #.##.######', // 13  interior pen
  '          #      #          ', // 14  tunel (extremos abiertos) + pen
  '######.##.#      #.##.######', // 15  interior pen
  '######.##.########.##.######', // 16  fondo pen
  '######.##..........##.######', // 17
  '######.#####.##.#####.######', // 18
  '######.#####.##.#####.######', // 19
  '#............##............#', // 20
  '#.####.#####.##.#####.####.#', // 21
  '#.####.#####.##.#####.####.#', // 22
  '#o..##................##..o#', // 23  fila inicio Pacman (13,23) + power pellets inferiores
  '###.##.##.########.##.##.###', // 24
  '###.##.##.########.##.##.###', // 25
  '#......##....##....##......#', // 26
  '#.##########.##.##########.#', // 27
  '#.##########.##.##########.#', // 28
  '#..........................#', // 29
  '############################', // 30  borde
];

function parseTile( ch ) {
  if ( ch === '#' ) return 1;
  if ( ch === '.' ) return 2;
  if ( ch === '-' ) return 3;
  if ( ch === 'o' ) return 4; // power pellet
  return 0; // espacio = vacio transitable
}

// Matriz numerica pristina (no se muta; cada partida copia esto).
const MAZE = MAZE_STR.map( ( row ) => row.split( '' ).map( parseTile ) );

const TUNNEL_ROW = 14;
const PACMAN_START = { x: 13, y: 23 };
const PEN_DOOR_COLS = [13, 14]; // columnas de la puerta (celdas '-', fila 12)
const PEN_OUT_ROW = 11;         // primera fila fuera de la pen
const GHOST_STARTS = [
  { x: 13, y: 14, kind: 'hunter', exitDelayFrames: 0 },   // dentro de la pen, sale al instante
  { x: 14, y: 14, kind: 'random', exitDelayFrames: 240 }, // dentro de la pen, espera 4s a 60fps
];

const POWER_PELLET_FRAMES    = 360; // 6s a 60fps
const POWER_FLASH_FRAMES     = 120; // ultimos 2s: parpadeo de aviso
const GHOST_FRIGHTENED_SPEED = 0.05; // la mitad de GHOST_SPEED (0.1)

window.MAZE = MAZE;
window.TUNNEL_ROW = TUNNEL_ROW;
window.PACMAN_START = PACMAN_START;
window.PEN_DOOR_COLS = PEN_DOOR_COLS;
window.PEN_OUT_ROW = PEN_OUT_ROW;
window.GHOST_STARTS = GHOST_STARTS;
window.POWER_PELLET_FRAMES = POWER_PELLET_FRAMES;
window.POWER_FLASH_FRAMES = POWER_FLASH_FRAMES;
window.GHOST_FRIGHTENED_SPEED = GHOST_FRIGHTENED_SPEED;
