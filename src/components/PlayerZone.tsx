import React from 'react';
import { PlayerState } from '../types/game';
import Tile from './Tile';

interface PlayerZoneProps {
  player: PlayerState;
  position: 'top' | 'bottom';
  targetRef?: React.RefObject<HTMLDivElement>;
}

const PlayerZone: React.FC<PlayerZoneProps> = ({ player, position, targetRef }) => {
  return (
    <div
      className="w-full py-6 px-4 flex items-center justify-center"
      style={{
        paddingTop: position === 'top' ? 'max(1.5rem, env(safe-area-inset-top))' : undefined,
        paddingBottom: position === 'bottom' ? 'max(1.5rem, env(safe-area-inset-bottom))' : undefined,
      }}
    >
      {/* Target Tile - position based on player */}
      <div
        className="flex flex-col items-center gap-2"
        style={{ opacity: player.isFrozen ? 0.2 : 1 }}
      >
        <div ref={targetRef}>
          <Tile tile={player.targetTile} />
        </div>
      </div>
    </div>
  );
};

export default PlayerZone;
