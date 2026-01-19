import React from 'react';
import Shape from './Shape';
import { Tile as TileType } from '../types/game';

interface TileProps {
  tile: TileType;
  onClick?: () => void;
  className?: string;
  animationDelay?: number;
  shouldAnimate?: boolean;
}

const Tile: React.FC<TileProps> = ({ tile, onClick, className = '', animationDelay = 0, shouldAnimate = false }) => {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer touch-manipulation ${className} ${shouldAnimate ? 'tile-appear' : ''}`}
      style={{
        width: '100%',
        paddingBottom: '100%',
        animationDelay: shouldAnimate ? `${animationDelay}ms` : undefined,
      }}
    >
      {/* Content container with absolute positioning */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Grote gekleurde vorm als achtergrond */}
        <div className="absolute">
          <Shape
            type={tile.bigShape}
            size="big"
            color={tile.color}
          />
        </div>

        {/* Kleine witte vorm bovenop gecentreerd */}
        <div className="absolute z-10">
          <Shape
            type={tile.smallShape}
            size="small"
            color="white"
          />
        </div>
      </div>
    </div>
  );
};

export default Tile;
