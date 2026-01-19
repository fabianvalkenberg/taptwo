import React, { useState, useEffect, useRef } from 'react';
import { GameState, PlayerId, Tile as TileType } from '../types/game';
import { generateInitialTiles, generateRandomTile, calculateScore } from '../utils/gameLogic';
import { playPickupSound, playCorrectSound, playWrongSound, playReturnSound, playGameStartSound, playGameOverSound } from '../utils/audio';
import Tile from './Tile';
import PlayerZone from './PlayerZone';

const GAME_DURATION = 20; // seconds
const FREEZE_DURATION = 3000; // 3 seconds in milliseconds

interface DragPosition {
  x: number;
  y: number;
}

const Game: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const player1ZoneRef = useRef<HTMLDivElement>(null);
  const player2ZoneRef = useRef<HTMLDivElement>(null);
  const player1TargetRef = useRef<HTMLDivElement>(null);
  const player2TargetRef = useRef<HTMLDivElement>(null);

  const [gameState, setGameState] = useState<GameState>(() => ({
    tiles: generateInitialTiles(20),
    player1: {
      id: 'player1',
      score: 0,
      targetTile: generateRandomTile(),
      isFrozen: false,
    },
    player2: {
      id: 'player2',
      score: 0,
      targetTile: generateRandomTile(),
      isFrozen: false,
    },
    draggedTile: null,
    draggedBy: null,
    timeRemaining: GAME_DURATION,
    gameStarted: false,
    gameEnded: false,
  }));

  const [dragPosition, setDragPosition] = useState<DragPosition | null>(null);
  const [dragRotation, setDragRotation] = useState<number>(0);
  const [targetRotation, setTargetRotation] = useState<number>(0);
  const [dragScale, setDragScale] = useState<number>(1.0);
  const [dragStartPosition, setDragStartPosition] = useState<DragPosition | null>(null);
  const [isReturning, setIsReturning] = useState(false);

  // Generate random delays for tile animations (shuffle order within 2 seconds)
  const [tileAnimationDelays] = useState<number[]>(() => {
    const delays = Array.from({ length: 20 }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = delays.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [delays[i], delays[j]] = [delays[j], delays[i]];
    }
    // Map to delays between 0 and 2000ms
    return delays.map(order => (order / 20) * 2000);
  });

  // Timer
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameEnded) return;

    const interval = setInterval(() => {
      setGameState((prev) => {
        const newTime = prev.timeRemaining - 1;
        if (newTime <= 0) {
          playGameOverSound();
          return { ...prev, timeRemaining: 0, gameEnded: true };
        }
        return { ...prev, timeRemaining: newTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.gameStarted, gameState.gameEnded]);

  // Unfreeze players
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setGameState((prev) => {
        let updated = false;
        const newState = { ...prev };

        if (prev.player1.isFrozen && prev.player1.frozenUntil && now >= prev.player1.frozenUntil) {
          newState.player1 = { ...prev.player1, isFrozen: false, frozenUntil: undefined };
          updated = true;
        }

        if (prev.player2.isFrozen && prev.player2.frozenUntil && now >= prev.player2.frozenUntil) {
          newState.player2 = { ...prev.player2, isFrozen: false, frozenUntil: undefined };
          updated = true;
        }

        return updated ? newState : prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const startGame = () => {
    playGameStartSound();
    setGameState((prev) => ({ ...prev, gameStarted: true }));
  };

  const determinePlayerByPosition = (clientY: number): PlayerId => {
    if (!gameContainerRef.current) return 'player1';
    const containerRect = gameContainerRef.current.getBoundingClientRect();
    const midpoint = containerRect.top + containerRect.height / 2;
    return clientY < midpoint ? 'player1' : 'player2';
  };

  const isInPlayerZone = (clientX: number, clientY: number, playerId: PlayerId): boolean => {
    const zoneRef = playerId === 'player1' ? player1ZoneRef : player2ZoneRef;
    if (!zoneRef.current) return false;

    const rect = zoneRef.current.getBoundingClientRect();
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  };

  const isOnTargetTile = (clientX: number, clientY: number, playerId: PlayerId): boolean => {
    const targetRef = playerId === 'player1' ? player1TargetRef : player2TargetRef;
    if (!targetRef.current) return false;

    const rect = targetRef.current.getBoundingClientRect();
    // Add some padding for easier drops (20px on each side)
    const padding = 20;
    return (
      clientX >= rect.left - padding &&
      clientX <= rect.right + padding &&
      clientY >= rect.top - padding &&
      clientY <= rect.bottom + padding
    );
  };

  const handleTilePress = (tile: TileType, clientX: number, clientY: number) => {
    if (gameState.gameEnded) return;
    if (gameState.draggedTile) return;

    const playerId = determinePlayerByPosition(clientY);
    const player = playerId === 'player1' ? gameState.player1 : gameState.player2;

    if (player.isFrozen) return;

    setGameState((prev) => ({
      ...prev,
      draggedTile: tile,
      draggedBy: playerId,
    }));

    const startPos = { x: clientX, y: clientY };
    setDragPosition(startPos);
    setDragStartPosition(startPos);
    setIsReturning(false);

    // Play pickup sound
    playPickupSound();

    // Random rotation between -18 and +18 degrees
    const rotation = Math.random() * 36 - 18;
    setTargetRotation(rotation);

    // Animate rotation and scale with easing
    const startTime = Date.now();
    const duration = 250; // 250ms for pickup animation
    const startRotation = 0;
    const startScale = 1.0;
    const targetScale = 1.3;

    const animatePickup = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth motion
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentRotation = startRotation + (rotation - startRotation) * easeProgress;
      const currentScale = startScale + (targetScale - startScale) * easeProgress;

      setDragRotation(currentRotation);
      setDragScale(currentScale);

      if (progress < 1) {
        requestAnimationFrame(animatePickup);
      }
    };

    requestAnimationFrame(animatePickup);
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (gameState.draggedTile && dragPosition && !isReturning) {
      setDragPosition({ x: clientX, y: clientY });
    }
  };

  const handleTileRelease = (clientX: number, clientY: number) => {
    if (!gameState.draggedTile || !gameState.draggedBy) {
      setDragPosition(null);
      setDragStartPosition(null);
      return;
    }

    // Check if released on the target tile
    if (!isOnTargetTile(clientX, clientY, gameState.draggedBy)) {
      // Not in zone, animate tile back to start position
      playReturnSound();

      if (dragStartPosition) {
        setIsReturning(true);

        // Animate back over 300ms
        const startTime = Date.now();
        const duration = 300;
        const startX = dragPosition?.x || clientX;
        const startY = dragPosition?.y || clientY;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease-out cubic for smooth deceleration
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          const currentX = startX + (dragStartPosition.x - startX) * easeProgress;
          const currentY = startY + (dragStartPosition.y - startY) * easeProgress;

          setDragPosition({ x: currentX, y: currentY });

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Animation complete, reset state
            setGameState((prev) => ({
              ...prev,
              draggedTile: null,
              draggedBy: null,
            }));
            setDragPosition(null);
            setDragStartPosition(null);
            setIsReturning(false);
          }
        };

        requestAnimationFrame(animate);
      } else {
        // Fallback if no start position
        setGameState((prev) => ({
          ...prev,
          draggedTile: null,
          draggedBy: null,
        }));
        setDragPosition(null);
        setDragStartPosition(null);
      }
      return;
    }

    const player = gameState.draggedBy === 'player1' ? gameState.player1 : gameState.player2;
    const score = calculateScore(gameState.draggedTile, player.targetTile);
    const tileIndex = gameState.tiles.findIndex((t) => t.id === gameState.draggedTile!.id);

    // Always replace the tile when dropped in zone
    const newTiles = [...gameState.tiles];
    newTiles[tileIndex] = generateRandomTile();

    if (score > 0) {
      // Correct match - add points
      playCorrectSound();

      setGameState((prev) => ({
        ...prev,
        tiles: newTiles,
        [gameState.draggedBy!]: {
          ...player,
          score: player.score + score,
        },
        draggedTile: null,
        draggedBy: null,
      }));
    } else {
      // Wrong match - freeze player but still replace tile
      playWrongSound();

      setGameState((prev) => ({
        ...prev,
        tiles: newTiles,
        [gameState.draggedBy!]: {
          ...player,
          isFrozen: true,
          frozenUntil: Date.now() + FREEZE_DURATION,
        },
        draggedTile: null,
        draggedBy: null,
      }));
    }

    setDragPosition(null);
    setDragStartPosition(null);
    setIsReturning(false);
  };

  const handleMouseDown = (tile: TileType, e: React.MouseEvent) => {
    e.preventDefault();
    handleTilePress(tile, e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    handleTileRelease(e.clientX, e.clientY);
  };

  const handleTouchStart = (tile: TileType, e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      handleTilePress(tile, e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length > 0) {
      handleTileRelease(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    }
  };

  return (
    <div
      ref={gameContainerRef}
      className="flex flex-col min-h-screen bg-white overflow-hidden touch-none"
      style={{ height: '100dvh' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Player 1 Zone - Top */}
      <div ref={player1ZoneRef}>
        <PlayerZone player={gameState.player1} position="top" targetRef={player1TargetRef} />
      </div>

      {/* Game Info & Grid */}
      <div className="flex-1 flex flex-col items-center justify-center py-2 px-2 sm:py-4 sm:px-4 relative">
        {!gameState.gameStarted ? (
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-500 text-white text-xl sm:text-2xl font-bold rounded-lg active:bg-blue-600 touch-manipulation min-h-[60px]"
          >
            Start Game
          </button>
        ) : (
          <>
            {/* Timer in top left corner */}
            <div className="absolute top-2 left-2 sm:top-4 sm:left-4 text-base sm:text-lg font-semibold bg-white/80 px-2 py-1 rounded">
              {gameState.timeRemaining}s
            </div>

            {gameState.gameEnded && (
              <div className="mb-2 sm:mb-4 text-xl sm:text-3xl font-bold text-green-600 text-center px-4">
                Game Over!
                {gameState.player1.score > gameState.player2.score
                  ? ' Player 1 Wins!'
                  : gameState.player2.score > gameState.player1.score
                  ? ' Player 2 Wins!'
                  : ' Tie!'}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 w-full max-w-[min(90vw,400px)]">
              {gameState.tiles.map((tile, index) => {
                const isDragged = gameState.draggedTile?.id === tile.id;
                const isDraggedAndNotReturning = isDragged && !isReturning;
                return (
                  <div
                    key={tile.id}
                    className="flex items-center justify-center touch-none select-none"
                    style={{
                      opacity: isDraggedAndNotReturning ? 0 : 1,
                      transition: 'opacity 0.1s',
                      cursor: 'pointer',
                    }}
                    onMouseDown={(e) => handleMouseDown(tile, e)}
                    onTouchStart={(e) => handleTouchStart(tile, e)}
                  >
                    <Tile
                      tile={tile}
                      animationDelay={tileAnimationDelays[index]}
                      shouldAnimate={gameState.gameStarted}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Player 2 Zone - Bottom */}
      <div ref={player2ZoneRef}>
        <PlayerZone player={gameState.player2} position="bottom" targetRef={player2TargetRef} />
      </div>

      {/* Floating dragged tile */}
      {gameState.draggedTile && dragPosition && !isReturning && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPosition.x,
            top: dragPosition.y,
            transform: `translate(-50%, -50%) scale(${dragScale}) rotate(${dragRotation}deg)`,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
            transition: 'filter 0.2s ease-out',
          }}
        >
          <Tile tile={gameState.draggedTile} />
        </div>
      )}
    </div>
  );
};

export default Game;
