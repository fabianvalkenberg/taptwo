import React from 'react';
import Tile from './Tile';
import { Tile as TileType, ColorType, ShapeType } from '../types/game';

const GameGrid: React.FC = () => {
  // Genereer random tiles voor het 4x5 grid (4 kolommen, 5 rijen = 20 tiles)
  const generateRandomTiles = (): TileType[] => {
    const colors: ColorType[] = ['red', 'orange', 'pink', 'green', 'blue'];
    const shapes: ShapeType[] = ['circle', 'rect', 'hex', 'diamond'];
    const tiles: TileType[] = [];

    for (let i = 0; i < 20; i++) {
      tiles.push({
        id: `tile-${i}`,
        color: colors[Math.floor(Math.random() * colors.length)],
        bigShape: shapes[Math.floor(Math.random() * shapes.length)],
        smallShape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    return tiles;
  };

  const tiles = generateRandomTiles();

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="grid grid-cols-4 gap-4">
        {tiles.map((tile) => (
          <div key={tile.id} className="flex items-center justify-center">
            <Tile tile={tile} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameGrid;
