import type { StockfishInstance } from '@/types/stockfish';

let stockfishPromise: Promise<StockfishInstance> | null = null;

export async function loadStockfish(): Promise<StockfishInstance> {
  if (stockfishPromise) {
    return stockfishPromise;
  }

  stockfishPromise = new Promise((resolve, reject) => {
    try {
      // Create a new Web Worker
      const worker = new Worker('/stockfish/stockfish.js') as StockfishInstance;

      // Set up message handling
      worker.onmessage = (event) => {
        const message = event.data;

        // When we receive 'uciok', the engine is ready
        if (message === 'uciok') {
          console.log('Stockfish initialized successfully');
          resolve(worker);
        }

        // Log any errors
        if (message.startsWith('info string error')) {
          console.error('Stockfish error:', message);
          reject(new Error(message));
        }
      };

      // Set up error handling
      worker.onerror = (error) => {
        console.error('Stockfish worker error:', error);
        reject(error);
      };

      // Initialize the engine
      worker.postMessage('uci');

    } catch (error) {
      console.error('Error creating Stockfish worker:', error);
      reject(error);
    }
  });

  return stockfishPromise;
}

// Function to get evaluation from Stockfish
export async function getEvaluation(fen: string, depth: number = 20): Promise<number> {
  const stockfish = await loadStockfish();

  return new Promise((resolve, reject) => {
    let evaluation: number | null = null;
    let timeoutId: NodeJS.Timeout;

    const messageHandler = (event: { data: string }) => {
      const message = event.data;

      if (message.startsWith('info depth') && message.includes('score cp')) {
        const match = message.match(/score cp (-?\d+)/);
        if (match) {
          evaluation = parseInt(match[1]) / 100;
        }
      } else if (message.startsWith('info depth') && message.includes('score mate')) {
        const match = message.match(/score mate (-?\d+)/);
        if (match) {
          evaluation = parseInt(match[1]) > 0 ? 999 : -999;
        }
      } else if (message === 'bestmove') {
        if (evaluation !== null) {
          clearTimeout(timeoutId);
          stockfish.onmessage = null;
          resolve(evaluation);
        }
      }
    };

    // Set up timeout
    timeoutId = setTimeout(() => {
      stockfish.onmessage = null;
      stockfish.postMessage('stop');
      reject(new Error('Evaluation timed out'));
    }, 30000); // 30 second timeout

    try {
      stockfish.onmessage = messageHandler;
      stockfish.postMessage('position fen ' + fen);
      stockfish.postMessage('go depth ' + depth);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
}