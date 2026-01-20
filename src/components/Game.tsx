import React, { useState, useEffect, useRef } from 'react';
import { GameState, PlayerId, Tile as TileType } from '../types/game';
import { generateInitialTiles, generateRandomTile, calculateScore } from '../utils/gameLogic';
import { playPickupSound, playCorrectSound, playWrongSound, playReturnSound, playGameStartSound, playGameOverSound } from '../utils/audio';
import Tile from './Tile';
import PlayerZone from './PlayerZone';

const GAME_DURATION = 30; // seconds
const FREEZE_DURATION = 3000; // 3 seconds in milliseconds
const TIMER_WARNING_PERCENTAGE = 0.17; // 17% - when timer turns red

interface DragPosition {
  x: number;
  y: number;
}

interface PlayerDragState {
  tile: TileType;
  position: DragPosition;
  startPosition: DragPosition;
  rotation: number;
  scale: number;
  isReturning: boolean;
}

const Game: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
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

  const [player1Drag, setPlayer1Drag] = useState<PlayerDragState | null>(null);
  const [player2Drag, setPlayer2Drag] = useState<PlayerDragState | null>(null);

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

  const restartGame = () => {
    setGameState({
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
      gameStarted: true,
      gameEnded: false,
    });
    playGameStartSound();
  };

  const determinePlayerByPosition = (clientY: number): PlayerId => {
    if (!gameContainerRef.current) return 'player1';
    const containerRect = gameContainerRef.current.getBoundingClientRect();
    const midpoint = containerRect.top + containerRect.height / 2;
    return clientY < midpoint ? 'player1' : 'player2';
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

    const playerId = determinePlayerByPosition(clientY);
    const player = playerId === 'player1' ? gameState.player1 : gameState.player2;

    if (player.isFrozen) return;

    // Check if this player is already dragging
    const playerDrag = playerId === 'player1' ? player1Drag : player2Drag;
    if (playerDrag) return;

    // Check if the other player is dragging this tile
    const otherPlayerDrag = playerId === 'player1' ? player2Drag : player1Drag;
    if (otherPlayerDrag && otherPlayerDrag.tile.id === tile.id) return;

    const startPos = { x: clientX, y: clientY };

    // Play pickup sound
    playPickupSound();

    // Random rotation between -18 and +18 degrees
    const rotation = Math.random() * 36 - 18;

    // Create initial drag state
    const dragState: PlayerDragState = {
      tile,
      position: startPos,
      startPosition: startPos,
      rotation: 0,
      scale: 1.0,
      isReturning: false,
    };

    if (playerId === 'player1') {
      setPlayer1Drag(dragState);
    } else {
      setPlayer2Drag(dragState);
    }

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

      if (playerId === 'player1') {
        setPlayer1Drag(prev => prev ? { ...prev, rotation: currentRotation, scale: currentScale } : null);
      } else {
        setPlayer2Drag(prev => prev ? { ...prev, rotation: currentRotation, scale: currentScale } : null);
      }

      if (progress < 1) {
        requestAnimationFrame(animatePickup);
      }
    };

    requestAnimationFrame(animatePickup);
  };

  const handleDragMove = (clientX: number, clientY: number, playerId: PlayerId) => {
    if (playerId === 'player1' && player1Drag && !player1Drag.isReturning) {
      setPlayer1Drag(prev => prev ? { ...prev, position: { x: clientX, y: clientY } } : null);
    } else if (playerId === 'player2' && player2Drag && !player2Drag.isReturning) {
      setPlayer2Drag(prev => prev ? { ...prev, position: { x: clientX, y: clientY } } : null);
    }
  };

  const handleTileRelease = (clientX: number, clientY: number, playerId: PlayerId) => {
    const playerDrag = playerId === 'player1' ? player1Drag : player2Drag;
    const setPlayerDrag = playerId === 'player1' ? setPlayer1Drag : setPlayer2Drag;

    if (!playerDrag) return;

    const player = playerId === 'player1' ? gameState.player1 : gameState.player2;

    // Check if released on the target tile
    if (!isOnTargetTile(clientX, clientY, playerId)) {
      // Not in zone, animate tile back to start position
      playReturnSound();

      setPlayerDrag(prev => prev ? { ...prev, isReturning: true } : null);

      // Animate back over 300ms
      const startTime = Date.now();
      const duration = 300;
      const startX = playerDrag.position.x;
      const startY = playerDrag.position.y;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic for smooth deceleration
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const currentX = startX + (playerDrag.startPosition.x - startX) * easeProgress;
        const currentY = startY + (playerDrag.startPosition.y - startY) * easeProgress;

        setPlayerDrag(prev => prev ? { ...prev, position: { x: currentX, y: currentY } } : null);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Animation complete, reset state
          setPlayerDrag(null);
        }
      };

      requestAnimationFrame(animate);
      return;
    }

    const score = calculateScore(playerDrag.tile, player.targetTile);
    const tileIndex = gameState.tiles.findIndex((t) => t.id === playerDrag.tile.id);

    // Always replace the tile when dropped in zone
    const newTiles = [...gameState.tiles];
    newTiles[tileIndex] = generateRandomTile();

    if (score > 0) {
      // Correct match - add points
      playCorrectSound();

      setGameState((prev) => ({
        ...prev,
        tiles: newTiles,
        [playerId]: {
          ...player,
          score: player.score + score,
        },
      }));
    } else {
      // Wrong match - freeze player but still replace tile
      playWrongSound();

      setGameState((prev) => ({
        ...prev,
        tiles: newTiles,
        [playerId]: {
          ...player,
          isFrozen: true,
          frozenUntil: Date.now() + FREEZE_DURATION,
        },
      }));
    }

    setPlayerDrag(null);
  };

  // Track which touch ID belongs to which player
  const touchTracker = useRef<Map<number, PlayerId>>(new Map());

  const handleMouseDown = (tile: TileType, e: React.MouseEvent) => {
    e.preventDefault();
    handleTilePress(tile, e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const playerId = determinePlayerByPosition(e.clientY);
    handleDragMove(e.clientX, e.clientY, playerId);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const playerId = determinePlayerByPosition(e.clientY);
    handleTileRelease(e.clientX, e.clientY, playerId);
  };

  const handleTouchStart = (tile: TileType, e: React.TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const playerId = determinePlayerByPosition(touch.clientY);

      // Store which touch belongs to which player
      touchTracker.current.set(touch.identifier, playerId);

      handleTilePress(tile, touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const playerId = touchTracker.current.get(touch.identifier);
      if (playerId) {
        handleDragMove(touch.clientX, touch.clientY, playerId);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const playerId = touchTracker.current.get(touch.identifier);
      if (playerId) {
        handleTileRelease(touch.clientX, touch.clientY, playerId);
        touchTracker.current.delete(touch.identifier);
      }
    }
  };

  // Calculate timer progress and color
  const timePercentage = gameState.timeRemaining / GAME_DURATION;
  const isTimerWarning = timePercentage <= TIMER_WARNING_PERCENTAGE;
  const timerColor = isTimerWarning ? '#EF4444' : '#EAB308'; // red : yellow

  return (
    <div
      ref={gameContainerRef}
      className="flex flex-col min-h-screen bg-white overflow-hidden touch-none relative"
      style={{ height: '100dvh' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Timer border visualization */}
      {gameState.gameStarted && !gameState.gameEnded && (
        <>
          {/* Top border - right to left (first, 0.75-1.0) */}
          <div
            className="absolute top-0 right-0 h-2 transition-all duration-1000 ease-linear"
            style={{
              width: timePercentage >= 0.75 ? `${((timePercentage - 0.75) / 0.25) * 100}%` : '0%',
              backgroundColor: timerColor,
            }}
          />
          {/* Left border - top to bottom (second, 0.5-0.75) */}
          <div
            className="absolute top-0 left-0 w-2 transition-all duration-1000 ease-linear"
            style={{
              height: timePercentage >= 0.5 && timePercentage < 0.75 ? `${((timePercentage - 0.5) / 0.25) * 100}%` : timePercentage >= 0.75 ? '100%' : '0%',
              backgroundColor: timerColor,
            }}
          />
          {/* Bottom border - left to right (third, 0.25-0.5) */}
          <div
            className="absolute bottom-0 left-0 h-2 transition-all duration-1000 ease-linear"
            style={{
              width: timePercentage >= 0.25 && timePercentage < 0.5 ? `${((timePercentage - 0.25) / 0.25) * 100}%` : timePercentage >= 0.5 ? '100%' : '0%',
              backgroundColor: timerColor,
            }}
          />
          {/* Right border - bottom to top (fourth, 0.0-0.25) */}
          <div
            className="absolute bottom-0 right-0 w-2 transition-all duration-1000 ease-linear"
            style={{
              height: timePercentage < 0.25 ? `${(timePercentage / 0.25) * 100}%` : timePercentage >= 0.25 ? '100%' : '0%',
              backgroundColor: timerColor,
            }}
          />
        </>
      )}
      {/* Player 1 Zone - Top */}
      <div className="flex-shrink-0">
        <PlayerZone player={gameState.player1} position="top" targetRef={player1TargetRef} />
      </div>

      {/* Game Info & Grid */}
      <div className="flex-1 flex flex-col items-center justify-center py-2 px-2 sm:py-4 sm:px-4 relative min-h-0">
        {!gameState.gameStarted ? (
          <button
            onClick={startGame}
            className="px-8 py-4 bg-blue-500 text-white text-xl sm:text-2xl font-bold rounded-lg active:bg-blue-600 touch-manipulation min-h-[60px]"
          >
            Start Game
          </button>
        ) : (
          <>
            {gameState.gameEnded && (
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="text-xl sm:text-3xl font-bold text-green-600 text-center px-4">
                  Game Over!
                  {gameState.player1.score > gameState.player2.score
                    ? ' Player 1 Wins!'
                    : gameState.player2.score > gameState.player1.score
                    ? ' Player 2 Wins!'
                    : ' Tie!'}
                </div>
                <button
                  onClick={restartGame}
                  className="px-6 py-3 bg-blue-500 text-white text-lg sm:text-xl font-bold rounded-lg active:bg-blue-600 touch-manipulation"
                >
                  Restart Game
                </button>
              </div>
            )}

            <div className="grid grid-cols-4 gap-[20px] w-full px-[36px]">
              {gameState.tiles.map((tile, index) => {
                const isDraggedByPlayer1 = player1Drag?.tile.id === tile.id && !player1Drag.isReturning;
                const isDraggedByPlayer2 = player2Drag?.tile.id === tile.id && !player2Drag.isReturning;
                const isDraggedAndNotReturning = isDraggedByPlayer1 || isDraggedByPlayer2;
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
      <div className="flex-shrink-0">
        <PlayerZone player={gameState.player2} position="bottom" targetRef={player2TargetRef} />
      </div>

      {/* Floating dragged tiles */}
      {player1Drag && !player1Drag.isReturning && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: player1Drag.position.x,
            top: player1Drag.position.y,
            transform: `translate(-50%, -50%) scale(${player1Drag.scale}) rotate(${player1Drag.rotation}deg)`,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
            transition: 'filter 0.2s ease-out',
          }}
        >
          <Tile tile={player1Drag.tile} />
        </div>
      )}
      {player2Drag && !player2Drag.isReturning && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: player2Drag.position.x,
            top: player2Drag.position.y,
            transform: `translate(-50%, -50%) scale(${player2Drag.scale}) rotate(${player2Drag.rotation}deg)`,
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
            transition: 'filter 0.2s ease-out',
          }}
        >
          <Tile tile={player2Drag.tile} />
        </div>
      )}
    </div>
  );
};

export default Game;
