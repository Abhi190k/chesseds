import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';

type Move = {
  san: string;
  fen: string;
};

export const useGameHistory = (initialGame?: Chess) => {
  const [moves, setMoves] = useState<Move[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  const addMove = useCallback((san: string, fen: string) => {
    setMoves(prevMoves => {
      const newMoves = [...prevMoves.slice(0, currentMoveIndex + 1), { san, fen }];
      setCurrentMoveIndex(newMoves.length - 1);
      return newMoves;
    });
  }, [currentMoveIndex]);

  const goToMove = useCallback((index: number) => {
    if (index >= -1 && index < moves.length) {
      setCurrentMoveIndex(index);
      return index === -1 ? initialGame?.fen() : moves[index].fen;
    }
    return null;
  }, [moves, initialGame]);

  const clearHistory = useCallback(() => {
    setMoves([]);
    setCurrentMoveIndex(-1);
  }, []);

  return {
    moves,
    currentMoveIndex,
    addMove,
    goToMove,
    clearHistory
  };
};