import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

type Move = {
  san: string;
  fen: string;
};

type GameHistoryProps = {
  moves: Move[];
  currentMoveIndex: number;
  onSelectMove: (index: number) => void;
};

export function GameHistory({
  moves,
  currentMoveIndex,
  onSelectMove
}: GameHistoryProps) {
  if (moves.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">
        No moves played yet
      </p>
    );
  }

  return (
    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
      <div className="grid grid-cols-2 gap-2">
        {moves.map((move, index) => (
          <Button
            key={index}
            variant={currentMoveIndex === index ? 'default' : 'ghost'}
            className="justify-start"
            onClick={() => onSelectMove(index)}
          >
            {Math.floor(index / 2) + 1}.
            {index % 2 === 0 ? '' : '...'} {move.san}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}