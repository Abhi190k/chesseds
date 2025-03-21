import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type PositionRecognitionProps = {
  getRootProps: any;
  getInputProps: any;
  isRecognizing: boolean;
  error: string | null;
};

export function PositionRecognition({
  getRootProps,
  getInputProps,
  isRecognizing,
  error
}: PositionRecognitionProps) {
  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors"
      >
        <input {...getInputProps()} />
        {isRecognizing ? (
          <div className="flex items-center justify-center gap-2">
            <LoadingSpinner />
            <span>Recognizing position...</span>
          </div>
        ) : (
          <p>Drag & drop an image here, or click to select</p>
        )}
      </div>

      {error && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <p>{error}</p>
        </Card>
      )}
    </div>
  );
}