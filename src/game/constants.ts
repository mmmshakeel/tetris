export const COLS = 10;
export const ROWS = 20;

export const COLORS = [
  'transparent',
  '#00FFFF', // I - Cyan
  '#0055FF', // J - Blue
  '#FF8800', // L - Orange
  '#FFDD00', // O - Yellow
  '#00FF00', // S - Green
  '#AA00FF', // T - Purple
  '#FF0000', // Z - Red
];

// Lighter colors for the 3D top/left edges
export const LIGHT_COLORS = [
  'transparent',
  '#88FFFF',
  '#6699FF',
  '#FFBB66',
  '#FFFF88',
  '#88FF88',
  '#D488FF',
  '#FF8888',
];

// Darker colors for the 3D bottom/right edges
export const DARK_COLORS = [
  'transparent',
  '#008888',
  '#002288',
  '#884400',
  '#887700',
  '#008800',
  '#550088',
  '#880000',
];

export const SHAPES = [
  [],
  // I
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // J
  [
    [2, 0, 0],
    [2, 2, 2],
    [0, 0, 0],
  ],
  // L
  [
    [0, 0, 3],
    [3, 3, 3],
    [0, 0, 0],
  ],
  // O
  [
    [4, 4],
    [4, 4],
  ],
  // S
  [
    [0, 5, 5],
    [5, 5, 0],
    [0, 0, 0],
  ],
  // T
  [
    [0, 6, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  // Z
  [
    [7, 7, 0],
    [0, 7, 7],
    [0, 0, 0],
  ]
];
