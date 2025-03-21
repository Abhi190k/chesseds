import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type PositionAnalysisProps = {
  isThinking: boolean;
  bestMove: string | null;
  evaluation: number | null;
  fen: string;
};

export function PositionAnalysis({
  isThinking,
  bestMove,
  evaluation,
  fen
}: PositionAnalysisProps) {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        {isThinking ? (
          <div className="flex items-center gap-2">
            <LoadingSpinner />
            <span>Analyzing position...</span>
          </div>
        ) : (
          <div className="space-y-2">
            {bestMove && (
              <p>
                <span className="font-semibold">Best move: </span>
                {bestMove}
              </p>
            )}
            {evaluation !== null && (
              <p>
                <span className="font-semibold">Evaluation: </span>
                {evaluation > 0 ? '+' : ''}{evaluation.toFixed(2)}
              </p>
            )}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <p className="font-mono text-sm break-all">{fen}</p>
      </Card>
    </div>
  );
}