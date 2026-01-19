import React from 'react';
import Tile from './Tile';
import { Tile as TileType, ColorType, ShapeType } from '../types/game';

const TileShowcase: React.FC = () => {
  // Voorbeeldtiles zoals in de afbeelding
  const exampleTiles: TileType[] = [
    { id: '1', color: 'pink', bigShape: 'hex', smallShape: 'circle' },
    { id: '2', color: 'blue', bigShape: 'rect', smallShape: 'hex' },
    { id: '3', color: 'red', bigShape: 'rect', smallShape: 'hex' },
    { id: '4', color: 'green', bigShape: 'hex', smallShape: 'diamond' },
    { id: '5', color: 'pink', bigShape: 'diamond', smallShape: 'hex' },
  ];

  // Alle mogelijke combinaties voor referentie
  const allShapes: ShapeType[] = ['circle', 'rect', 'hex', 'diamond'];
  const allColors: ColorType[] = ['red', 'orange', 'pink', 'green', 'blue'];

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Tile Showcase</h1>

      {/* Voorbeeld tiles zoals in de afbeelding */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Voorbeeld Tiles</h2>
        <div className="flex gap-4 flex-wrap">
          {exampleTiles.map((tile) => (
            <div key={tile.id} className="bg-white p-4 rounded shadow">
              <Tile tile={tile} />
              <p className="text-xs mt-2 text-center">
                {tile.color} {tile.bigShape} + {tile.smallShape}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Alle kleuren met verschillende vormen */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Alle Kleuren</h2>
        {allColors.map((color) => (
          <div key={color} className="mb-6">
            <h3 className="text-lg font-medium mb-3 capitalize">{color}</h3>
            <div className="flex gap-4 flex-wrap">
              {allShapes.map((bigShape) =>
                allShapes.map((smallShape) => (
                  <div
                    key={`${color}-${bigShape}-${smallShape}`}
                    className="bg-white p-2 rounded shadow"
                  >
                    <Tile
                      tile={{
                        id: `${color}-${bigShape}-${smallShape}`,
                        color,
                        bigShape,
                        smallShape,
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default TileShowcase;
