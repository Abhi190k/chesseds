export interface StockfishInstance extends Worker {
  onmessage: (event: { data: string }) => void;
  postMessage: (message: string) => void;
  terminate: () => void;
}

export interface AnalysisLine {
  depth: number;
  score: number;
  pv: string[];
  nodes: number;
}