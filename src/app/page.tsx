'use client';

import { useState, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useDropzone } from 'react-dropzone';
import { useStockfish } from '@/hooks/useStockfish';
import { useChessboard } from '@/hooks/useChessboard';
import { useGameHistory } from '@/hooks/useGameHistory';
import { usePositionRecognition } from '@/hooks/usePositionRecognition';
import { useWindowSize } from '@/hooks/useWindowSize';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GameControls } from '@/components/GameControls';
import { GameHistory } from '@/components/GameHistory';
import { PositionAnalysis } from '@/components/PositionAnalysis';
import { PositionRecognition } from '@/components/PositionRecognition';
import { EngineSettings } from '@/components/EngineSettings';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { cn } from '@/lib/utils';

export default function Home() {
  // State
  const [activeTab, setActiveTab] = useState('play');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');

  // Refs
  const boardRef = useRef<HTMLDivElement>(null);

  // Custom hooks
  const { width } = useWindowSize();
  const {
    game,
    fen,
    setFen,
    makeMove,
    undoMove,
    resetGame,
    isGameOver,
    gameResult
  } = useChessboard();

  const {
    engineLevel,
    setEngineLevel,
    engineDepth,
    setEngineDepth,
    isThinking,
    bestMove,
    evaluation,
    startEngine,
    stopEngine,
    makeEngineMove
  } = useStockfish();

  const {
    moves,
    currentMoveIndex,
    goToMove,
    addMove,
    clearHistory
  } = useGameHistory();

  const {
    recognizePosition,
    isRecognizing,
    recognitionError
  } = usePositionRecognition();

  // Calculate board size based on window width
  const getBoardSize = () => {
    if (width < 640) return width - 32; // Small screens
    if (width < 1024) return 480; // Medium screens
    return 560; // Large screens
  };

  // Handle position recognition from image
  const handleRecognizePosition = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      const newFen = await recognizePosition(file);
      if (newFen) {
        setFen(newFen);
        clearHistory();
      }
    } catch (err) {
      setError('Failed to recognize position from image');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Dropzone configuration
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        await handleRecognizePosition(acceptedFiles[0]);
      }
    }
  });

  // Effect to start/stop engine
  useEffect(() => {
    if (activeTab === 'analysis') {
      startEngine();
    } else {
      stopEngine();
    }
    return () => stopEngine();
  }, [activeTab, startEngine, stopEngine]);

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <div className="grid lg:grid-cols-[auto,400px] gap-8">
        {/* Left column - Chessboard */}
        <div className="space-y-4">
          <Card className="p-4">
            <div ref={boardRef} style={{ width: getBoardSize() }}>
              <Chessboard
                position={fen}
                onPieceDrop={(source, target) => makeMove(source, target)}
                boardOrientation={orientation}
                customBoardStyle={{
                  borderRadius: '4px',
                }}
              />
            </div>
            <GameControls
              onFlipBoard={() => setOrientation(prev => prev === 'white' ? 'black' : 'white')}
              onUndoMove={undoMove}
              onResetGame={resetGame}
              isGameOver={isGameOver}
              gameResult={gameResult}
            />
          </Card>
        </div>

        {/* Right column - Controls & Analysis */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="play">Play</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="play" className="space-y-4">
              <Card className="p-4">
                <h2 className="text-xl font-bold mb-4">Game Settings</h2>
                <EngineSettings
                  engineLevel={engineLevel}
                  onLevelChange={setEngineLevel}
                  engineDepth={engineDepth}
                  onDepthChange={setEngineDepth}
                />
              </Card>

              <Card className="p-4">
                <h2 className="text-xl font-bold mb-4">Game History</h2>
                <GameHistory
                  moves={moves}
                  currentMoveIndex={currentMoveIndex}
                  onSelectMove={goToMove}
                />
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <Card className="p-4">
                <h2 className="text-xl font-bold mb-4">Position Analysis</h2>
                <PositionAnalysis
                  isThinking={isThinking}
                  bestMove={bestMove}
                  evaluation={evaluation}
                  fen={fen}
                />
              </Card>

              <Card className="p-4">
                <h2 className="text-xl font-bold mb-4">Position Recognition</h2>
                <PositionRecognition
                  getRootProps={getRootProps}
                  getInputProps={getInputProps}
                  isRecognizing={isRecognizing}
                  error={recognitionError}
                />
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <LoadingSpinner />
        </div>
      )}
    </main>
  );
}