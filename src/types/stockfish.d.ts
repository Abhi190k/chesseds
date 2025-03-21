declare module 'stockfish' {
  interface StockfishEngine {
    postMessage(message: string): void;
    onmessage: ((event: { data: string }) => void) | null;
    terminate(): void;
  }

  function Stockfish(): StockfishEngine;
  export default Stockfish;
}