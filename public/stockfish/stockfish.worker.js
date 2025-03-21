// Web Worker wrapper for Stockfish
importScripts('stockfish.js');

let stockfish = new Module.Stockfish();

onmessage = function(event) {
  let line = event.data;
  if (line === 'quit') {
    stockfish.terminate();
    close();
  } else {
    stockfish.postMessage(line);
  }
};

stockfish.addMessageListener((line) => {
  postMessage(line);
});

stockfish.postMessage = function(line) {
  postMessage(line);
};