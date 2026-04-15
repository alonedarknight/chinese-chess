import React from 'react';
import PieceUI from './PieceUI';

const ChessBoard = ({ boardState, selectedPiece, onSquareClick }) => {
  const isPalace = (x, y) => {
    const isRedPalace = x >= 3 && x <= 5 && y >= 0 && y <= 2;
    const isBlackPalace = x >= 3 && x <= 5 && y >= 7 && y <= 9;
    return isRedPalace || isBlackPalace;
  };

  const isRiver = (y) => y === 4;

  return (
    <div className="relative inline-block p-4 bg-orange-50 rounded-lg shadow-2xl border-4 border-orange-200">
      {/* The 10x9 Grid */}
      <div className="grid grid-cols-9 bg-orange-100 border border-orange-300">
        {boardState.map((row, y) =>
          row.map((piece, x) => {
            const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;
            const inPalace = isPalace(x, y);
            const nearRiver = isRiver(y);

            return (
              <div
                key={`${x}-${y}`}
                onClick={() => onSquareClick(x, y)}
                className={`
                  w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center relative cursor-default
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

                {/* Coordinate Debug (Optional) */}
                {/* <span className="absolute bottom-0 right-0 text-[8px] text-gray-400">{x},{y}</span> */}
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
