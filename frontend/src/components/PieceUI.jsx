import React from 'react';

const TYPE_MAP = {
  GENERAL: { RED: '帥', BLACK: '將' },
  ADVISOR: { RED: '仕', BLACK: '士' },
  BISHOP: { RED: '相', BLACK: '象' },
  KNIGHT: { RED: '傌', BLACK: '馬' },
  ROOK: { RED: '俥', BLACK: '車' },
  CANNON: { RED: '炮', BLACK: '砲' },
  PAWN: { RED: '兵', BLACK: '卒' },
};

const PieceUI = ({ piece, isSelected, onClick }) => {
  if (!piece) return null;

  const isRed = piece.color === 'RED';
  const char = TYPE_MAP[piece.type]?.[piece.color] || '?';

  return (
    <div
      onClick={onClick}
      className={`
        w-[7vmin] h-[7vmin] max-w-[56px] max-h-[56px] rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg
        ${isRed 
          ? 'bg-red-50 border-red-800 text-red-800' 
          : 'bg-gray-100 border-gray-900 text-gray-900'}
        ${isSelected ? 'ring-4 ring-yellow-400 scale-110 z-10' : 'hover:scale-105'}
      `}
    >
      <span className="text-[3.5vmin] sm:text-2xl font-bold leading-none">{char}</span>
    </div>
  );
};

export default PieceUI;
