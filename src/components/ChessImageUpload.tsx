'use client';

import { useState } from 'react';
import { Chess } from 'chess.js';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { Chessboard } from 'react-chessboard';

interface ChessImageUploadProps {
  onPositionRecognized: (game: Chess) => void;
}

interface RecognitionResult {
  fen: string;
  evaluation?: number;
  bestMove?: string;
  winChance?: number;
  fallback?: boolean;
  error?: string;
}

export default function ChessImageUpload({ onPositionRecognized }: ChessImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [showManualSetup, setShowManualSetup] = useState(false);
  const [tempGame, setTempGame] = useState(new Chess());

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setShowManualSetup(false);

    try {
      // Create a FormData object to send the image
      const formData = new FormData();
      formData.append('image', file);

      // Send the image to our API endpoint for position recognition
      const response = await fetch('/api/recognize-position', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      // Check if there's an error but with a fallback option
      if (data.error && data.fallback) {
        setError(data.error);
        setResult(data);
        
        // Set up a temporary game with the fallback FEN
        if (data.fen) {
          try {
            const fallbackGame = new Chess(data.fen);
            setTempGame(fallbackGame);
            setShowManualSetup(true);
          } catch (fenError) {
            console.error('Invalid fallback FEN:', fenError);
          }
        }
        
        return;
      }

      // Standard error handling for non-fallback errors
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to recognize chess position');
      }

      setResult(data);

      // Create a new chess instance with the recognized position
      try {
        const game = new Chess(data.fen);
        onPositionRecognized(game);
      } catch (fenError) {
        console.error('Invalid FEN from API:', fenError);
        setError('The recognized position appears to be invalid. Please try again with a clearer image.');
      }
    } catch (err: any) {
      console.error('Error recognizing position:', err);
      setError(err.message || 'Failed to recognize the chess position. Please try again with a clearer image.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSetupConfirm = () => {
    if (tempGame) {
      onPositionRecognized(tempGame);
      setShowManualSetup(false);
    }
  };

  // Function to handle piece drop on the manual setup board
  const onDrop = (sourceSquare: string, targetSquare: string) => {
    try {
      const newTempGame = new Chess(tempGame.fen());
      const move = newTempGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      });
      
      if (move) {
        setTempGame(newTempGame);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Reset the board to initial position in manual setup
  const resetBoard = () => {
    setTempGame(new Chess());
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <div className="flex flex-col items-center justify-center">
        <label
          htmlFor="chess-image-upload"
          className={`cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${
            isLoading ? 'border-gray-300' : 'border-gray-400 hover:border-gray-600'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <ArrowPathIcon className="w-10 h-10 mb-2 text-gray-400" />
            <p className="mb-1 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
          </div>
          <input
            id="chess-image-upload"
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleImageUpload}
            disabled={isLoading}
          />
        </label>
        
        {isLoading && (
          <div className="mt-4 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
            <span className="text-sm text-gray-600">Recognizing position...</span>
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-500 flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 mr-1 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {showManualSetup && (
          <div className="mt-4 w-full">
            <h3 className="text-md font-medium mb-2">Manual Setup</h3>
            <p className="text-sm text-gray-600 mb-3">
              Position recognition failed. Drag and drop pieces to set up your position manually.
            </p>
            
            <div className="max-w-md mx-auto">
              <Chessboard 
                position={tempGame.fen()} 
                onPieceDrop={onDrop}
                width={300}
              />
            </div>
            
            <div className="flex justify-center space-x-2 mt-3">
              <button
                onClick={resetBoard}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Reset
              </button>
              <button
                onClick={handleManualSetupConfirm}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm"
              >
                Confirm Position
              </button>
            </div>
          </div>
        )}

        {result && !showManualSetup && (
          <div className="mt-4 w-full space-y-2">
            {typeof result.evaluation === 'number' && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Evaluation:</span>
                <span className={`font-medium ${result.evaluation > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.evaluation > 0 ? '+' : ''}{result.evaluation.toFixed(1)}
                </span>
              </div>
            )}
            {result.bestMove && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Best Move:</span>
                <span className="font-medium">{result.bestMove}</span>
              </div>
            )}
            {typeof result.winChance === 'number' && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Win Chance:</span>
                <span className="font-medium">{(result.winChance * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}