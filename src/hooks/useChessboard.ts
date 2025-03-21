import { useState, useCallback } from 'react';
import { Chess } from 'chess.js';

export const useChessboard = () => {
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState(game.fen());
  const [initialPosition, setInitialPosition] = useState(game.fen());

  const makeMove = useCallback((source: string, target: string) => {
    try {
      const move = game.move({
        from: source,
        to: target,
        promotion: 'q'
      });

      if (move) {
        setFen(game.fen());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Invalid move:', error);
      return false;
    }
  }, [game]);

  const undoMove = useCallback(() => {
    const move = game.undo();
    if (move) {
      setFen(game.fen());
      return true;
    }
    return false;
  }, [game]);

  const resetGame = useCallback(() => {
    game.reset();
    setFen(game.fen());
    setInitialPosition(game.fen());
  }, [game]);

  const setPosition = useCallback((newFen: string) => {
    try {
      game.load(newFen);
      setFen(newFen);
      setInitialPosition(newFen);
    } catch (error) {
      console.error('Invalid FEN:', error);
    }
  }, [game]);

  return {
    game,
    fen,
    initialPosition,
    setPosition,
    makeMove,
    undoMove,
    resetGame,
    isGameOver: game.isGameOver(),
    gameResult: game.isCheckmate() ? 'checkmate' : game.isDraw() ? 'draw' : null
  };
};