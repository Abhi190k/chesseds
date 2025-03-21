declare module 'chess.js' {
  export class Chess {
    constructor(fen?: string);
    fen(): string;
    move(move: { from: string; to: string; promotion?: string } | string): any;
    history(): string[];
    isCheckmate(): boolean;
    isDraw(): boolean;
    isCheck(): boolean;
    loadPgn(pgn: string): boolean;
    load(fen: string): boolean;
    turn(): 'w' | 'b';
  }
}

declare module 'react-chessboard' {
  import { ReactNode } from 'react';
  
  interface ChessboardProps {
    position: string;
    onPieceDrop?: (sourceSquare: string, targetSquare: string) => boolean;
    boardOrientation?: 'white' | 'black';
    customBoardStyle?: {
      borderRadius?: string;
      boxShadow?: string;
    };
    width?: number;
  }

  export function Chessboard(props: ChessboardProps): ReactNode;
}

declare module '@heroicons/react/24/outline' {
  import { ComponentType, SVGProps } from 'react';
  
  export const ArrowPathIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ArrowUturnLeftIcon: ComponentType<SVGProps<SVGSVGElement>>;
  export const ArrowUturnRightIcon: ComponentType<SVGProps<SVGSVGElement>>;
}