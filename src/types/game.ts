export type ShapeType = 'circle' | 'rect' | 'hex' | 'diamond';
export type ShapeSize = 'big' | 'small';
export type ColorType = 'red' | 'orange' | 'pink' | 'green' | 'blue' | 'white';

export const COLORS: Record<ColorType, string> = {
  red: '#FF3515',
  orange: '#FDAB23',
  pink: '#FFAEC4',
  green: '#00BF7E',
  blue: '#1816D8',
  white: '#FFFFFF'
};

export interface Shape {
  type: ShapeType;
  size: ShapeSize;
}

export interface Tile {
  id: string;
  color: ColorType;
  bigShape: ShapeType;
  smallShape: ShapeType;
}

export interface Position {
  row: number;
  col: number;
}

export type PlayerId = 'player1' | 'player2';

export interface PlayerState {
  id: PlayerId;
  score: number;
  targetTile: Tile;
  isFrozen: boolean;
  frozenUntil?: number;
}

export interface GameState {
  tiles: Tile[];
  player1: PlayerState;
  player2: PlayerState;
  draggedTile: Tile | null;
  draggedBy: PlayerId | null;
  timeRemaining: number;
  gameStarted: boolean;
  gameEnded: boolean;
}
