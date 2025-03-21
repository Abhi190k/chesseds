import { useState, useEffect, useCallback, useRef } from 'react';

export const useStockfish = () => {
  const [engineLevel, setEngineLevel] = useState(10);
  const [engineDepth, setEngineDepth] = useState(15);
  const [isThinking, setIsThinking] = useState(false);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<number | null>(null);

  const engineRef = useRef<Worker | null>(null);

  const startEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new Worker('/stockfish/stockfish.js');
      engineRef.current.onmessage = (e) => {
        const message = e.data;
        if (message.includes('bestmove')) {
          const [move] = message.match(/bestmove\s+([\w]+)/) || [];
          setBestMove(move);
          setIsThinking(false);
        } else if (message.includes('score cp')) {
          const [score] = message.match(/score cp ([\-\d]+)/) || [];
          setEvaluation(parseInt(score) / 100);
        }
      };

      engineRef.current.postMessage('uci');
      engineRef.current.postMessage('isready');
      engineRef.current.postMessage(`setoption name Skill Level value ${engineLevel}`);
    }
  }, [engineLevel]);

  const stopEngine = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.terminate();
      engineRef.current = null;
    }
  }, []);

  const makeEngineMove = useCallback((fen: string) => {
    if (engineRef.current) {
      setIsThinking(true);
      setBestMove(null);
      setEvaluation(null);
      engineRef.current.postMessage(`position fen ${fen}`);
      engineRef.current.postMessage(`go depth ${engineDepth}`);
    }
  }, [engineDepth]);

  useEffect(() => {
    return () => stopEngine();
  }, [stopEngine]);

  return {
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
  };
};