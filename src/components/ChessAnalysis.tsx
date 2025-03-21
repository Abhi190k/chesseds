'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { loadStockfish, StockfishInstance } from '@/utils/stockfish';
import MoveHistory from './MoveHistory';

// Define Square type for chessboard
type Square = 'a1' | 'a2' | 'a3' | 'a4' | 'a5' | 'a6' | 'a7' | 'a8' |
              'b1' | 'b2' | 'b3' | 'b4' | 'b5' | 'b6' | 'b7' | 'b8' |
              'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6' | 'c7' | 'c8' |
              'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8' |
              'e1' | 'e2' | 'e3' | 'e4' | 'e5' | 'e6' | 'e7' | 'e8' |
              'f1' | 'f2' | 'f3' | 'f4' | 'f5' | 'f6' | 'f7' | 'f8' |
              'g1' | 'g2' | 'g3' | 'g4' | 'g5' | 'g6' | 'g7' | 'g8' |
              'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7' | 'h8';

interface AnalysisLine {
  depth: number;
  score: number;
  pv: string[];
  nodes: number;
}

// Define more specific Chess type with the methods we use
interface ChessInstance extends Chess {
  turn(): 'w' | 'b';
  fen(): string;
  move(move: string | { from: string; to: string; promotion?: 'q' | 'r' | 'b' | 'n' }): { from: string; to: string; [key: string]: any } | null;
  history(): string[];
  pgn?(): string;
}

interface ChessAnalysisProps {
  game: ChessInstance;
  moveHistory: string[];
  onMove: (move: string) => void;
  onArrowsUpdate?: (arrows: [Square, Square, string?][]) => void;
  onGoToMove?: (moveIndex: number) => void;
  currentMove?: number;
}

export default function ChessAnalysis({ 
  game, 
  moveHistory,
  onMove, 
  onArrowsUpdate, 
  onGoToMove,
  currentMove = 0 
}: ChessAnalysisProps) {
  const [engine, setEngine] = useState<StockfishInstance | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisLine | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [depth, setDepth] = useState(20);
  const [lines, setLines] = useState<AnalysisLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [arrows, setArrows] = useState<[Square, Square, string?][]>([]);
  const [lastAnalyzedFen, setLastAnalyzedFen] = useState<string>('');
  const [engineReady, setEngineReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'history'>('analysis');

  useEffect(() => {
    let mounted = true;
    let initRetries = 0;
    const MAX_RETRIES = 3;

    const initEngine = async () => {
      if (mounted) {
        setIsLoading(true);
        setError(null);
      }
      
      try {
        console.log('Initializing Stockfish...');
        const stockfish = await loadStockfish();
        console.log('Stockfish loaded successfully');

        if (!mounted) return;

        stockfish.onmessage = (event: { data: string }) => {
          const message = event.data;
          
          // Log important messages
          if (!message.startsWith('info') || message.includes('depth')) {
            console.log('Stockfish message:', message);
          }

          // Handle readyok message
          if (message === 'readyok') {
            if (mounted) {
              setEngineReady(true);
              setIsLoading(false);
              setError(null);
            }
          }
          
          // Handle analysis info
          if (message.startsWith('info depth')) {
            try {
              // Parse analysis info from Stockfish output
              console.log('Parsing analysis info:', message);
              
              // More robust regex to catch all variations in Stockfish output
              const infoRegex = /info depth (\d+)(?:\s+seldepth \d+)?(?:\s+multipv (\d+))?\s+score (cp|mate) (-?\d+)(?:\s+upperbound|\s+lowerbound)?(?:\s+nodes (\d+))?(?:\s+nps \d+)?(?:\s+hashfull \d+)?(?:\s+tbhits \d+)?(?:\s+time \d+)?(?:\s+pv (.+))?$/;
              const match = message.match(infoRegex);
              
              if (match) {
                const [, depth, multipv = '1', scoreType, scoreValue, nodes = '0', pv = ''] = match;
                const pvMoves = pv.trim().split(' ');
                
                console.log('Parsed PV:', pvMoves);
                
                const analysisLine: AnalysisLine = {
                  depth: parseInt(depth),
                  score: scoreType === 'cp' ? parseInt(scoreValue) / 100 : parseInt(scoreValue),
                  pv: pvMoves,
                  nodes: parseInt(nodes)
                };
                
                if (mounted) {
                  setLines(prev => {
                    const newLines = [...prev];
                    newLines[parseInt(multipv) - 1] = analysisLine;
                    return newLines;
                  });
                  if (parseInt(multipv) === 1) {
                    setAnalysis(analysisLine);
                    updateArrows(analysisLine, game);
                  }
                }
              } else {
                console.warn('Could not parse Stockfish message:', message);
              }
            } catch (err) {
              console.error('Error parsing Stockfish message:', err, message);
            }
          }
        };

        // Configure engine
        stockfish.postMessage('uci');
        stockfish.postMessage('setoption name MultiPV value 3');
        stockfish.postMessage('setoption name Threads value 1');
        stockfish.postMessage('setoption name Hash value 32');
        stockfish.postMessage('setoption name Skill Level value 20');

        // Debug state before sending isready
        console.log('Sending isready to Stockfish...');
        stockfish.postMessage('isready');

        if (mounted) {
          setEngine(stockfish);
        }
      } catch (error) {
        console.error('Failed to initialize Stockfish:', error);
        
        if (mounted) {
          if (initRetries < MAX_RETRIES) {
            console.log(`Retry attempt ${initRetries + 1}/${MAX_RETRIES}`);
            initRetries++;
            // Wait before retrying
            setTimeout(initEngine, 2000);
          } else {
            setError('Failed to initialize chess engine. Please try refreshing the page.');
            setIsLoading(false);
          }
        }
      }
    };

    initEngine();

    return () => {
      mounted = false;
      if (engine) {
        try {
          engine.postMessage('quit');
          engine.terminate();
        } catch (e) {
          console.error('Error terminating engine:', e);
        }
      }
    };
  }, []);

  const updateArrows = useCallback((analysisLine: AnalysisLine, currentGame: ChessInstance) => {
    if (!analysisLine || !analysisLine.pv || analysisLine.pv.length === 0) {
      setArrows([]);
      if (onArrowsUpdate) {
        onArrowsUpdate([]);
      }
      return;
    }

    const newArrows: [Square, Square, string?][] = [];
    const isWhiteToMove = currentGame.turn() === 'w';
    
    try {
      // Show multiple arrows for current player's top moves
      // Use the collected analysis lines to show multiple good moves
      const arrowColors = [
        isWhiteToMove ? 'rgb(0, 128, 255)' : 'rgb(255, 64, 64)', // Best move (blue for white, red for black)
        isWhiteToMove ? 'rgb(0, 200, 255)' : 'rgb(255, 128, 128)', // Second best move (lighter blue/red)
        isWhiteToMove ? 'rgb(0, 255, 255)' : 'rgb(255, 180, 180)'  // Third best move (even lighter)
      ];
      
      // Get up to 3 moves from the lines array (which contains multiple analysis lines)
      lines.slice(0, 3).forEach((line, index) => {
        if (line && line.pv && line.pv.length > 0) {
          const move = line.pv[0];
          if (move.length >= 4) {
            const from = move.substring(0, 2) as Square;
            const to = move.substring(2, 4) as Square;
            
            // Add arrow for this move option
            newArrows.push([
              from,
              to,
              arrowColors[index]
            ]);
          }
        }
      });
      
      // Add the opponent's expected response to the best move
      if (lines[0] && lines[0].pv && lines[0].pv.length > 1) {
        const responseMove = lines[0].pv[1];
        if (responseMove.length >= 4) {
          const responseFrom = responseMove.substring(0, 2) as Square;
          const responseTo = responseMove.substring(2, 4) as Square;
          
          newArrows.push([
            responseFrom,
            responseTo,
            isWhiteToMove ? 'rgb(255, 64, 64)' : 'rgb(0, 128, 255)' // Opponent's color
          ]);
        }
      }
    } catch (e) {
      console.error('Error updating arrows:', e);
    }
    
    setArrows(newArrows);
    if (onArrowsUpdate) {
      onArrowsUpdate(newArrows);
    }
  }, [onArrowsUpdate, lines]);

  // Start analysis when the position changes
  useEffect(() => {
    const currentFen = game.fen();
    if (!engine || !engineReady || currentFen === lastAnalyzedFen || isLoading) {
      return;
    }

    const startAnalysis = () => {
      setIsAnalyzing(true);
      setLastAnalyzedFen(currentFen);
      setLines([]);
      
      try {
        engine.postMessage('stop');
        engine.postMessage('position fen ' + currentFen);
        engine.postMessage(`go depth ${depth}`);
      } catch (e) {
        console.error('Error starting analysis:', e);
        setError('Failed to start analysis. Please try refreshing the page.');
        setIsAnalyzing(false);
      }
    };

    // Use a small delay to avoid too frequent updates
    const timeoutId = setTimeout(startAnalysis, 100);

    return () => {
      clearTimeout(timeoutId);
      if (engine) {
        try {
          engine.postMessage('stop');
        } catch (e) {
          console.error('Error stopping engine:', e);
        }
      }
    };
  }, [game.fen(), engine, engineReady, lastAnalyzedFen, depth, isLoading]);

  // Stop analysis when component unmounts
  useEffect(() => {
    return () => {
      if (engine) {
        try {
          engine.postMessage('stop');
        } catch (e) {
          console.error('Error stopping engine:', e);
        }
      }
    };
  }, [engine]);

  // Function to format evaluation score
  const formatScore = (score: number): string => {
    if (score === 0) return '0.0';
    const sign = score > 0 ? '+' : '';
    return `${sign}${score.toFixed(1)}`;
  };

  // Function to format nodes count
  const formatNodes = (nodes: number): string => {
    if (nodes < 1000) return nodes.toString();
    if (nodes < 1000000) return `${(nodes / 1000).toFixed(1)}K`;
    return `${(nodes / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-lg flex items-center">
          <SparklesIcon className="h-5 w-5 mr-2 text-yellow-500" />
          Analysis
        </h3>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-3 py-1 rounded ${activeTab === 'analysis' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            Analysis
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 rounded ${activeTab === 'history' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'analysis' ? (
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading engine...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 text-center">{error}</div>
          ) : (
            <div className="space-y-4">
              {/* Analysis information */}
              {lines.map((line, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-medium text-lg">
                        {formatScore(line.score)}
                      </span>
                      <span className="text-sm text-gray-500">
                        Depth: {line.depth}
                      </span>
                      <span className="text-sm text-gray-500">
                        Nodes: {formatNodes(line.nodes)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Principal variation */}
                  <div className="font-mono text-sm space-x-1">
                    {line.pv.slice(0, 6).map((move, moveIndex) => (
                      <span
                        key={moveIndex}
                        className={`inline-block px-1.5 py-0.5 rounded ${moveIndex === 0 ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600'}`}
                      >
                        {move}
                      </span>
                    ))}
                    {line.pv.length > 6 && (
                      <span className="text-gray-400">...</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <MoveHistory
          game={game}
          moveHistory={moveHistory}
          currentMove={currentMove}
          onGoToMove={onGoToMove || (() => {})}
        />
      )}
    </div>
  );
}