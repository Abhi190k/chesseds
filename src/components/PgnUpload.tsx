'use client';

import { useState } from 'react';
import { Chess } from 'chess.js';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

interface PgnUploadProps {
  onPgnLoaded: (game: Chess) => void;
}

// Extend the Chess type to include the loadPgn method
interface ChessWithPgn extends Chess {
  loadPgn: (pgn: string) => boolean;
}

export default function PgnUpload({ onPgnLoaded }: PgnUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePgnUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Read the PGN file
      const text = await file.text();
      
      // Create a new chess instance
      const game = new Chess() as ChessWithPgn;
      
      // Try to load the PGN
      const success = game.loadPgn(text);
      
      if (!success) {
        throw new Error('Failed to load PGN file. The format might be invalid.');
      }
      
      // Successfully loaded the PGN
      onPgnLoaded(game);
    } catch (err: any) {
      console.error('Error loading PGN:', err);
      setError(err.message || 'Failed to load the PGN file. Please check the format and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
      <div className="flex flex-col items-center justify-center">
        <label
          htmlFor="pgn-file-upload"
          className={`cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg ${
            isLoading ? 'border-gray-300' : 'border-gray-400 hover:border-gray-600'
          }`}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <ArrowPathIcon className="w-10 h-10 mb-2 text-gray-400" />
            <p className="mb-1 text-sm text-gray-500">
              <span className="font-semibold">Click to upload PGN</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">Upload a PGN file with chess game data</p>
          </div>
          <input
            id="pgn-file-upload"
            type="file"
            className="hidden"
            accept=".pgn,text/plain"
            onChange={handlePgnUpload}
            disabled={isLoading}
          />
        </label>
        
        {isLoading && (
          <div className="mt-4 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-2"></div>
            <span className="text-sm text-gray-600">Loading PGN file...</span>
          </div>
        )}

        {error && (
          <div className="mt-4 text-sm text-red-500 flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 mr-1 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}