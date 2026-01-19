import { Tile, ColorType, ShapeType } from '../types/game';

const COLORS: ColorType[] = ['red', 'orange', 'pink', 'green', 'blue'];
const SHAPES: ShapeType[] = ['circle', 'rect', 'hex', 'diamond'];

let tileCounter = 0;

export const generateRandomTile = (): Tile => {
  return {
    id: `tile-${tileCounter++}`,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    bigShape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    smallShape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
  };
};

export const generateInitialTiles = (count: number): Tile[] => {
  const tiles: Tile[] = [];
  for (let i = 0; i < count; i++) {
    tiles.push(generateRandomTile());
  }
  return tiles;
};

export const calculateScore = (draggedTile: Tile, targetTile: Tile): number => {
  let matches = 0;

  if (draggedTile.color === targetTile.color) matches++;
  if (draggedTile.bigShape === targetTile.bigShape) matches++;
  if (draggedTile.smallShape === targetTile.smallShape) matches++;

  // Scoring: 1 match = 1pt, 2 matches = 3pts, 3 matches = 5pts
  if (matches === 0) return 0;
  if (matches === 1) return 1;
  if (matches === 2) return 3;
  return 5; // matches === 3
};

export const tilesMatch = (tile1: Tile, tile2: Tile): boolean => {
  return (
    tile1.color === tile2.color &&
    tile1.bigShape === tile2.bigShape &&
    tile1.smallShape === tile2.smallShape
  );
};
