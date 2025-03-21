'use client';

import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import PgnUpload from '@/components/PgnUpload';
import ChessImageUpload from '@/components/ChessImageUpload';
import ChessAnalysis from '@/components/ChessAnalysis';
import type { Square } from '@/types/chess';

export default function Home() {
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentMove, setCurrentMove] = useState(0);
  const [arrows, setArrows] = useState<[Square, Square, string?][]>([]);

  // Function to handle moves
  const handleMove = useCallback((move: string) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);
      
      if (result) {
        setGame(newGame);
        setMoveHistory(prev => {
          // If we're not at the end of the move history,
          // we need to truncate the history at the current move
          if (currentMove < prev.length) {
            return [...prev.slice(0, currentMove), move];
          }
          return [...prev, move];
        });
        setCurrentMove(prev => prev + 1);
      }
      return result;
    } catch (error) {
      console.error('Error making move:', error);
      return null;
    }
  }, [game, currentMove]);

  // Function to handle piece drops on the board
  const onDrop = (sourceSquare: Square, targetSquare: Square) => {
    try {
      const move = handleMove({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Always promote to queen for simplicity
      });
      
      return move !== null;
    } catch (error) {
      return false;
    }
  };

  // Function to handle PGN file upload
  const handlePgnLoaded = (loadedGame: Chess) => {
    setGame(loadedGame);
    setMoveHistory(loadedGame.history());
    setCurrentMove(loadedGame.history().length);
  };

  // Function to handle image upload and position recognition
  const handlePositionRecognized = (recognizedGame: Chess) => {
    setGame(recognizedGame);
    setMoveHistory([]);
    setCurrentMove(0);
  };

  // Function to handle going to a specific move
  const handleGoToMove = useCallback((moveIndex: number) => {
    if (moveIndex < 0 || moveIndex > moveHistory.length) return;

    const newGame = new Chess();
    
    // Replay all moves up to the selected index
    for (let i = 0; i < moveIndex; i++) {
      newGame.move(moveHistory[i]);
    }
    
    setGame(newGame);
    setCurrentMove(moveIndex);
  }, [moveHistory]);

  // Function to handle arrow updates from analysis
  const handleArrowsUpdate = useCallback((newArrows: [Square, Square, string?][]) => {
    setArrows(newArrows);
  }, []);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">
          Chesseds
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="mb-4 space-y-4">
              <PgnUpload onPgnLoaded={handlePgnLoaded} />
              <ChessImageUpload onPositionRecognized={handlePositionRecognized} />
            </div>
            
            <div className="aspect-square w-full max-w-2xl mx-auto">
              <Chessboard
                position={game.fen()}
                onPieceDrop={onDrop}
                customArrows={arrows}
                boardWidth={800}
              />
            </div>
          </div>
          
          <div>
            <ChessAnalysis
              game={game}
              moveHistory={moveHistory}
              onMove={handleMove}
              onArrowsUpdate={handleArrowsUpdate}
              onGoToMove={handleGoToMove}
              currentMove={currentMove}
            />
          </div>
        </div>
      </div>
    </main>
  );
}