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
      style={{
        width: 52,
        height: 52,
        borderRadius: '50%',
        border: `3px solid ${isRed ? '#991b1b' : '#1e293b'}`,
        background: isRed
          ? 'radial-gradient(circle at 38% 38%, #fff5f5, #fecaca)'
          : 'radial-gradient(circle at 38% 38%, #f8fafc, #e2e8f0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isSelected ? 'scale(1.15) translateY(-4px)' : 'scale(1)',
        boxShadow: isSelected
          ? '0 8px 16px rgba(0,0,0,0.4), 0 0 0 4px #facc15'
          : '0 3px 6px rgba(0,0,0,0.3)',
        zIndex: isSelected ? 30 : 10,
        position: 'relative',
      }}
    >
      <span
        style={{
          fontSize: 28,
          fontWeight: 900,
          lineHeight: 1,
          color: isRed ? '#991b1b' : '#1e293b',
          fontFamily: "'Noto Serif SC', 'SimSun', serif",
          userSelect: 'none',
          textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.5)',
        }}
      >
        {char}
      </span>
    </div>
  );
};

export default PieceUI;
