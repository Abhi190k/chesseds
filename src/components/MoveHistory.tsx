'use client';

import React, { useCallback } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Chess } from 'chess.js';

// Define more specific Chess type with the methods we use
interface ChessInstance extends Chess {
  turn(): 'w' | 'b';
  fen(): string;
  move(move: string | { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }): { from: string; to: string; [key: string]: any } | null;
  history(): string[];
  pgn?(): string;
}

interface MoveHistoryProps {
  game: ChessInstance;
  moveHistory: string[]; // Use the full move history from parent instead of game.history()
  currentMove: number;
  onGoToMove: (moveIndex: number) => void;
  className?: string;
}

const MoveHistory: React.FC<MoveHistoryProps> = ({
  game,
  moveHistory,
  currentMove,
  onGoToMove,
  className = '',
}) => {
  // Memoize the handler to prevent recreating functions on each render
  const handleMoveClick = useCallback((moveIndex: number) => {
    if (moveIndex >= 0 && moveIndex <= moveHistory.length) {
      // Use requestAnimationFrame to prevent blocking the UI
      requestAnimationFrame(() => {
        onGoToMove(moveIndex);
      });
    }
  }, [onGoToMove, moveHistory.length]);
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <h3 className="font-medium mb-4 flex items-center text-lg">
        <ArrowPathIcon className="h-5 w-5 mr-2 text-blue-500" />
        Move History
      </h3>
      
      {moveHistory.length > 0 ? (
        <div className="space-y-2">
          <div className="grid grid-cols-[60px_1fr_1fr] gap-2 bg-gray-50 p-2 rounded">
            <div className="font-semibold text-center text-gray-600">Move</div>
            <div className="font-semibold text-center text-gray-600">White</div>
            <div className="font-semibold text-center text-gray-600">Black</div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto pr-1">
            {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, index) => {
              const moveNumber = index + 1;
              const whiteIdx = index * 2;
              const blackIdx = index * 2 + 1;
              
              const whiteMove = whiteIdx < moveHistory.length ? moveHistory[whiteIdx] : '';
              const blackMove = blackIdx < moveHistory.length ? moveHistory[blackIdx] : '';
              
              const isCurrentWhiteMove = whiteIdx === currentMove - 1;
              const isCurrentBlackMove = blackIdx === currentMove - 1;
              
              return (
                <div 
                  key={moveNumber}
                  className="grid grid-cols-[60px_1fr_1fr] gap-2 hover:bg-gray-50 rounded mb-1"
                >
                  <div className="text-center py-2 font-medium text-gray-500">
                    {moveNumber}.
                  </div>
                  <button
                    onClick={() => whiteMove && handleMoveClick(whiteIdx + 1)}
                    className={`py-2 px-2 font-mono text-sm rounded transition-all ${
                      isCurrentWhiteMove 
                        ? 'bg-blue-100 text-blue-700 font-bold' 
                        : 'hover:bg-blue-50 text-gray-700'
                    } ${!whiteMove ? 'opacity-0 cursor-default' : 'hover:shadow-sm'}`}
                    disabled={!whiteMove}
                    title={whiteMove ? `Go to move ${whiteIdx + 1}` : ''}
                  >
                    {whiteMove}
                  </button>
                  <button
                    onClick={() => blackMove && handleMoveClick(blackIdx + 1)}
                    className={`py-2 px-2 font-mono text-sm rounded transition-all ${
                      isCurrentBlackMove 
                        ? 'bg-blue-100 text-blue-700 font-bold' 
                        : 'hover:bg-blue-50 text-gray-700'
                    } ${!blackMove ? 'opacity-0 cursor-default' : 'hover:shadow-sm'}`}
                    disabled={!blackMove}
                    title={blackMove ? `Go to move ${blackIdx + 1}` : ''}
                  >
                    {blackMove}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <p>No moves yet</p>
          <p className="text-sm">Make a move to start the game</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(MoveHistory);