import React from 'react';
import PieceUI from './PieceUI';

const CELL = 60;
const RIVER_H = 48;
const PIECE_SIZE = 52;
const BOARD_W = 8 * CELL;          // 480px
const TOP_H = 4 * CELL;            // 240px
const BOT_H = 4 * CELL;            // 240px
const TOTAL_H = TOP_H + RIVER_H + BOT_H; // 528px
const PAD = CELL / 2;              // 30px

// Board col/row → pixel coordinates
const toPixel = (col, row) => {
  const px = col * CELL;
  const py = row <= 4
    ? row * CELL
    : TOP_H + RIVER_H + (row - 5) * CELL;
  return { px, py };
};

const ChessBoard = ({ boardState, selectedPiece, validMoves = [], isFlipped, onSquareClick }) => {
  const isValidMove = (x, y) => validMoves.some(m => m[0] === x && m[1] === y);

  const svgLines = [];

  // 10 horizontal lines
  for (let r = 0; r < 10; r++) {
    const { py } = toPixel(0, r);
    svgLines.push(
      <line key={`h${r}`} x1={0} y1={py} x2={BOARD_W} y2={py} stroke="#8B6914" strokeWidth="1.5" />
    );
  }

  // 9 vertical lines
  for (let c = 0; c < 9; c++) {
    const x = c * CELL;
    if (c === 0 || c === 8) {
      svgLines.push(
        <line key={`v${c}`} x1={x} y1={0} x2={x} y2={TOTAL_H} stroke="#8B6914" strokeWidth="1.5" />
      );
    } else {
      svgLines.push(
        <line key={`vt${c}`} x1={x} y1={0} x2={x} y2={TOP_H} stroke="#8B6914" strokeWidth="1.5" />
      );
      svgLines.push(
        <line key={`vb${c}`} x1={x} y1={TOP_H + RIVER_H} x2={x} y2={TOTAL_H} stroke="#8B6914" strokeWidth="1.5" />
      );
    }
  }

  // Palace diagonals
  const t1 = toPixel(3, 0), t2 = toPixel(5, 0), t3 = toPixel(3, 2), t4 = toPixel(5, 2);
  svgLines.push(<line key="pt1" x1={t1.px} y1={t1.py} x2={t4.px} y2={t4.py} stroke="#8B6914" strokeWidth="1.2" />);
  svgLines.push(<line key="pt2" x1={t2.px} y1={t2.py} x2={t3.px} y2={t3.py} stroke="#8B6914" strokeWidth="1.2" />);

  const b1 = toPixel(3, 7), b2 = toPixel(5, 7), b3 = toPixel(3, 9), b4 = toPixel(5, 9);
  svgLines.push(<line key="pb1" x1={b1.px} y1={b1.py} x2={b4.px} y2={b4.py} stroke="#8B6914" strokeWidth="1.2" />);
  svgLines.push(<line key="pb2" x1={b2.px} y1={b2.py} x2={b3.px} y2={b3.py} stroke="#8B6914" strokeWidth="1.2" />);

  const pieces = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 9; col++) {
      const bCol = isFlipped ? 8 - col : col;
      const bRow = isFlipped ? 9 - row : row;

      const { px, py } = toPixel(col, row);
      const piece = boardState[bRow]?.[bCol];
      const isSelected = selectedPiece?.x === bCol && selectedPiece?.y === bRow;
      const isHint = isValidMove(bCol, bRow);

      pieces.push(
        <div
          key={`c-${col}-${row}`}
          onClick={() => onSquareClick(bCol, bRow)}
          className="absolute flex items-center justify-center translate-z-0"
          style={{
            left: px - CELL / 2,
            top: py - CELL / 2,
            width: CELL,
            height: CELL,
            cursor: piece ? 'pointer' : 'default',
          }}
        >
          {piece && (
            <PieceUI
              piece={piece}
              isSelected={isSelected}
              onClick={(e) => { e.stopPropagation(); onSquareClick(bCol, bRow); }}
            />
          )}
          {isHint && !piece && (
            <div className="absolute rounded-full bg-green-500/40 ring-2 ring-white/70 animate-pulse"
              style={{ width: 18, height: 18, zIndex: 20 }}
            />
          )}
          {isHint && piece && (
            <div className="absolute rounded-full ring-4 ring-red-500 bg-red-500/25 animate-pulse"
              style={{ width: PIECE_SIZE + 4, height: PIECE_SIZE + 4, zIndex: 5 }}
            />
          )}
        </div>
      );
    }
  }

  return (
    <div className="inline-block select-none">
      <div
        className="rounded-2xl shadow-2xl"
        style={{
          padding: 12,
          background: 'linear-gradient(145deg, #b8892e, #8a6520)',
          border: '3px solid #6b4f18',
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: BOARD_W + CELL,
            height: TOTAL_H + CELL,
            background: '#e8c878',
            borderRadius: 8,
            border: '2px solid #8B6914',
          }}
        >
          <svg
            className="absolute pointer-events-none"
            style={{ left: PAD, top: PAD }}
            width={BOARD_W}
            height={TOTAL_H}
          >
            {svgLines}
          </svg>

          <div
            className="absolute flex items-center"
            style={{
              left: PAD,
              top: PAD + TOP_H,
              width: BOARD_W,
              height: RIVER_H,
              background: 'linear-gradient(180deg, #dbb86a 0%, #cde4ee 30%, #b8d8e8 50%, #cde4ee 70%, #dbb86a 100%)',
            }}
          >
            <div className="flex-1 flex items-center justify-center">
              <span style={{ fontSize: '1.3rem', color: '#6a4e1e', fontWeight: 900, letterSpacing: '0.4em', fontFamily: "'Noto Serif SC','SimSun',serif" }}>
                楚 河
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span style={{ fontSize: '1.3rem', color: '#6a4e1e', fontWeight: 900, letterSpacing: '0.4em', fontFamily: "'Noto Serif SC','SimSun',serif" }}>
                漢 界
              </span>
            </div>
          </div>

          <div className="absolute" style={{ left: PAD, top: PAD, width: BOARD_W, height: TOTAL_H }}>
            {pieces}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;
