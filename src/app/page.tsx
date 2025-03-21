'use client';

import { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { ArrowPathIcon, ArrowUturnLeftIcon, ArrowUturnRightIcon } from '@heroicons/react/24/outline';
import ChessAnalysis from '@/components/ChessAnalysis';
import ChessImageUpload from '@/components/ChessImageUpload';
import PgnUpload from '@/components/PgnUpload';
import { ChessboardProps } from 'react-chessboard/dist/chessboard/types';
import Link from 'next/link';

// Define Square type for chessboard
type Square = 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 'a8' |
              'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8' |
              'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8' |
              'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8' |
              'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6' | 'e7' | 'e8' |
              'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8' |
              'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6' | 'g7' | 'g8' |
              'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8';

// Define more specific Chess type with the methods we use
interface ChessInstance extends Chess {
  turn(): 'w' | 'b';
  fen(): string;
  move(move: any): { from: string; to: string; [key: string]: any } | null;
  load(fen: string): boolean;
}

// Type augmentation to include missing props
interface ExtendedChessboardProps extends ChessboardProps {
  customArrows?: [Square, Square, string?][];
}

export default function Home() {
  const [game, setGame] = useState<ChessInstance | null>(null);
  const [currentMove, setCurrentMove] = useState(0);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [arrows, setArrows] = useState<[Square, Square, string?][]>([]);
  const [initialPosition, setInitialPosition] = useState('');

  useEffect(() => {
    // Initialize chess instance on the client side only
    setGame(new Chess() as ChessInstance);
    setIsClient(true);
  }, []);

  function makeAMove(move: { from: string; to: string; promotion?: string }) {
    if (!game) return null;
    const gameCopy = new Chess(game.fen()) as ChessInstance;
    try {
      const result = gameCopy.move(move);
      if (result) {
        let newHistory;
        
        // Check if we're at the end of history or somewhere in the middle
        if (currentMove < moveHistory.length) {
          // We're in the middle of history, truncate and add the new move
          newHistory = [...moveHistory.slice(0, currentMove), result.san];
        } else {
          // We're at the end of history, just append
          newHistory = [...moveHistory, result.san];
        }
        
        setMoveHistory(newHistory);
        setCurrentMove(currentMove + 1);
        setGame(gameCopy);
      }
      return result;
    } catch (error) {
      return null;
    }
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    });

    if (move === null) return false;
    return true;
  }

  function goToMove(moveNumber: number) {
    if (!game || moveNumber < 0 || moveNumber > moveHistory.length) return;
    
    try {
      // Create a new game instance to avoid modifying the current one directly
      const newGame = new Chess() as ChessInstance;
      
      // If we have an initial position from PGN upload, start from there
      if (initialPosition) {
        newGame.load(initialPosition);
      }
      
      // Replay all moves up to the selected move
      for (let i = 0; i < moveNumber; i++) {
        try {
          const result = newGame.move(moveHistory[i]);
          if (!result) {
            console.error(`Invalid move at position ${i}: ${moveHistory[i]}`);
            // Continue with next moves rather than completely failing
          }
        } catch (error) {
          console.error(`Error replaying move ${i}: ${moveHistory[i]}`, error);
          // Continue with next moves rather than completely failing
        }
      }
      
      // Only update the state after all moves have been processed
      setGame(newGame);
      setCurrentMove(moveNumber);
    } catch (error) {
      console.error("Error navigating to move:", error);
      // If there's a critical error, we could reset to initial position
      // but we don't want to lose the move history
    }
  }

  function handlePositionRecognized(newGame: Chess) {
    setGame(newGame as ChessInstance);
    setMoveHistory([]);
    setCurrentMove(0);
    setInitialPosition(newGame.fen()); // Store the initial position from the PGN upload
  }

  function handlePgnLoaded(newGame: Chess) {
    // Store the initial position from the loaded PGN
    const initialFen = newGame.fen();
    setInitialPosition(initialFen);
    
    // Get the move history from the loaded PGN
    const history = newGame.history();
    
    // Set the game to the final position
    setGame(newGame as ChessInstance);
    
    // Update move history and current move
    setMoveHistory(history);
    setCurrentMove(history.length);
  }

  function handleArrowsUpdate(newArrows: [string, string, string?][]) {
    setArrows(newArrows as [Square, Square, string?][]);
  }

  // Return a loading state during server-side rendering
  if (!isClient) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Loading...</h1>
        </div>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Loading...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Chess Analysis & Review</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <ChessImageUpload onPositionRecognized={handlePositionRecognized} />
          <PgnUpload onPgnLoaded={handlePgnLoaded} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Chess Board */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <Chessboard 
              position={game.fen()}
              onPieceDrop={onDrop}
              boardOrientation="white"
              customArrows={arrows}
              customBoardStyle={{
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
              }}
              {...{} as any}
            />
            
            {/* Move Controls */}
            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={() => {
                  if (currentMove > 0) {
                    // Use requestAnimationFrame to improve performance
                    requestAnimationFrame(() => {
                      goToMove(Math.max(0, currentMove - 1));
                    });
                  }
                }}
                className={`p-2 rounded-full ${currentMove === 0 ? 'text-gray-400' : 'hover:bg-gray-100'}`}
                disabled={currentMove === 0}
                aria-label="Previous move"
              >
                <ArrowUturnLeftIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => {
                  if (currentMove < moveHistory.length) {
                    // Use requestAnimationFrame to improve performance
                    requestAnimationFrame(() => {
                      goToMove(Math.min(moveHistory.length, currentMove + 1));
                    });
                  }
                }}
                className={`p-2 rounded-full ${currentMove === moveHistory.length ? 'text-gray-400' : 'hover:bg-gray-100'}`}
                disabled={currentMove === moveHistory.length}
                aria-label="Next move"
              >
                <ArrowUturnRightIcon className="h-6 w-6" />
              </button>
              <button
                onClick={() => {
                  // Use requestAnimationFrame to improve performance
                  requestAnimationFrame(() => {
                    const newGame = new Chess() as ChessInstance;
                    setGame(newGame);
                    setMoveHistory([]);
                    setCurrentMove(0);
                    setInitialPosition(''); // Reset the initial position state
                  });
                }}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Reset game"
              >
                <ArrowPathIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="flex flex-col">
            <ChessAnalysis 
              fen={game.fen()} 
              onArrowsUpdate={handleArrowsUpdate}
            />
          </div>
        </div>
      </div>
    </main>
  );
}