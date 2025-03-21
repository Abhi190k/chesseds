'use client';

import { useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import PgnUpload from '@/components/PgnUpload';

export default function Home() {
  const [game, setGame] = useState(new Chess());

  const handlePgnLoaded = (loadedGame: Chess) => {
    setGame(loadedGame);
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Chesseds</h1>
        
        <PgnUpload onPgnLoaded={handlePgnLoaded} />
        
        <div className="aspect-square max-w-2xl mx-auto">
          <Chessboard
            position={game.fen()}
            boardWidth={800}
          />
        </div>
      </div>
    </main>
  );
}
