'use client';

export interface StockfishInstance {
  postMessage(message: string): void;
  onmessage: ((event: { data: string }) => void) | null;
  terminate(): void;
}

export async function loadStockfish(): Promise<StockfishInstance> {
  if (typeof window === 'undefined') {
    throw new Error('Stockfish can only be loaded in the browser');
  }

  try {
    console.log('Loading Stockfish directly from a browser-ready BLOB URL');
    
    // Using stockfish-nnue-16-single.js from node_modules to create a blob URL
    // This is more reliable than trying to use CDN or public paths
    const stockfishJs = `
    // Stockfish worker code
    let engine = null;
    
    onmessage = function(e) {
      if (typeof e.data === 'string') {
        if (!engine) {
          // Initialize engine
          importScripts('/stockfish/stockfish.js');
          engine = new Worker('/stockfish/stockfish.worker.js');
          
          // Forward messages from engine to main thread
          engine.onmessage = function(e) {
            postMessage(e.data);
          };
          
          // Send initial UCI command
          engine.postMessage('uci');
        }
        
        // Forward commands to engine
        engine.postMessage(e.data);
      }
    };
    `;
    
    // Create a Blob containing the worker code
    const blob = new Blob([stockfishJs], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Create the worker from the blob URL
    const worker = new window.Worker(blobUrl);
    
    // Set up a timeout to prevent hanging indefinitely
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Stockfish initialization timed out after 10 seconds'));
      }, 10000);
    });

    // Create a promise that resolves when uciok is received
    const initPromise = new Promise<StockfishInstance>((resolve) => {
      worker.onmessage = (event: { data: string }) => {
        console.log('Stockfish message:', event.data);
        if (typeof event.data === 'string' && event.data.includes('uciok')) {
          resolve(worker as unknown as StockfishInstance);
        }
      };
      
      // Send a message to initialize the worker
      worker.postMessage('init');
    });

    // Race the init promise against the timeout
    return await Promise.race([initPromise, timeout]);
  } catch (error) {
    console.error('Failed to load Stockfish from blob:', error);
    
    // Try alternative method - direct loading
    try {
      console.log('Trying alternative method - direct loading');
      
      // Try loading the single-threaded version directly
      const worker = new window.Worker('/stockfish-engine.js');
      
      return new Promise<StockfishInstance>((resolve) => {
        worker.onmessage = (event: { data: string }) => {
          console.log('Direct Stockfish message:', event.data);
          if (typeof event.data === 'string' && event.data.includes('uciok')) {
            resolve(worker as unknown as StockfishInstance);
          }
        };
        
        worker.postMessage('uci');
      });
    } catch (fallbackError) {
      console.error('All methods to load Stockfish failed:', fallbackError);
      throw new Error('Failed to initialize chess engine. Please try refreshing the page.');
    }
  }
}