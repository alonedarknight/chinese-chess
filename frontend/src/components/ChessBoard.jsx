import React from 'react';
import PieceUI from './PieceUI';

const ChessBoard = ({ boardState, selectedPiece, validMoves = [], isFlipped, onSquareClick }) => {
  const isPalace = (x, y) => {
    const isRedPalace = x >= 3 && x <= 5 && y >= 0 && y <= 2;
    const isBlackPalace = x >= 3 && x <= 5 && y >= 7 && y <= 9;
    return isRedPalace || isBlackPalace;
  };

  const isRiver = (y) => y === 4;

  const isValidMove = (x, y) => {
    return validMoves.some(move => move[0] === x && move[1] === y);
  };

  const rows = isFlipped ? [...Array(10).keys()].reverse() : [...Array(10).keys()];
  const cols = isFlipped ? [...Array(9).keys()].reverse() : [...Array(9).keys()];

  return (
    <div className="relative inline-block p-4 bg-orange-50 rounded-lg shadow-2xl border-4 border-orange-200">
      {/* The 10x9 Grid */}
      <div className="grid grid-cols-9 bg-orange-100 border border-orange-300">
        {rows.map((y) =>
          cols.map((x) => {
            const piece = boardState[y][x];
            const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;
            const inPalace = isPalace(x, y);
            const nearRiver = isRiver(y);
            const isHint = isValidMove(x, y);

            return (
              <div
                key={`${x}-${y}`}
                onClick={() => onSquareClick(x, y)}
                className={`
                  w-[8vmin] h-[8vmin] max-w-[64px] max-h-[64px] flex items-center justify-center relative cursor-default
                  border border-orange-200
                  ${inPalace ? 'bg-orange-200' : ''}
                  ${nearRiver ? 'border-b-4 border-b-blue-200' : ''}
                `}
              >
                {/* Horizontal line */}
                <div className="absolute w-full h-px bg-orange-400 z-0 top-1/2 left-0"></div>
                {/* Vertical line */}
                <div className="absolute w-px h-full bg-orange-400 z-0 top-0 left-1/2"></div>
                
                {/* Piece rendering */}
                {piece && (
                  <div className="relative z-10">
                    <PieceUI
                      piece={piece}
                      isSelected={isSelected}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSquareClick(x, y);
                      }}
                    />
                  </div>
                )}

                {/* Valid Move Hint */}
                {isHint && (
                  <div className={`absolute z-20 w-5 h-5 ${piece ? 'bg-red-500' : 'bg-green-500'} bg-opacity-40 rounded-full ring-2 ring-white animate-pulse shadow-lg`}></div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Legend/Labels */}
      <div className="mt-4 flex justify-between text-orange-800 font-bold text-sm uppercase tracking-widest px-10">
        <span>Tả</span>
        <span className="text-blue-600">楚 河 (Sông Sở)</span>
        <span className="text-blue-600">漢 界 (Hán Giới)</span>
        <span>Hữu</span>
      </div>
    </div>
  );
};

export default ChessBoard;
