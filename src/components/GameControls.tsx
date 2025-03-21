import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type GameControlsProps = {
  onFlipBoard: () => void;
  onUndoMove: () => void;
  onResetGame: () => void;
  isGameOver: boolean;
  gameResult: string | null;
};

export function GameControls({
  onFlipBoard,
  onUndoMove,
  onResetGame,
  isGameOver,
  gameResult
}: GameControlsProps) {
  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2">
        <Button onClick={onFlipBoard} variant="outline">
          Flip Board
        </Button>
        <Button onClick={onUndoMove} variant="outline">
          Undo Move
        </Button>
        <Button onClick={onResetGame} variant="outline">
          Reset Game
        </Button>
      </div>

      {isGameOver && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
          <p className="text-lg font-semibold">
            Game Over: {gameResult === 'checkmate' ? 'Checkmate!' : 'Draw!'}
          </p>
        </Card>
      )}
    </div>
  );
}