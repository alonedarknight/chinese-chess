package com.cotuong.logic;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Board {
    private Piece[][] grid;

    public Board() {
        this.grid = new Piece[10][9]; // 10 rows, 9 columns
    }

    public void initializeBoard() {
        // Red Pieces (Rows 0-3)
        setupSide("RED", 0, 2, 3);
        // Black Pieces (Rows 9-6)
        setupSide("BLACK", 9, 7, 6);
    }

    private void setupSide(String color, int backRow, int cannonRow, int pawnRow) {
        // Back row: R K B A G A B K R
        grid[backRow][0] = PieceFactory.createPiece(Piece.PieceType.ROOK, color, 0, backRow);
        grid[backRow][1] = PieceFactory.createPiece(Piece.PieceType.KNIGHT, color, 1, backRow);
        grid[backRow][2] = PieceFactory.createPiece(Piece.PieceType.BISHOP, color, 2, backRow);
        grid[backRow][3] = PieceFactory.createPiece(Piece.PieceType.ADVISOR, color, 3, backRow);
        grid[backRow][4] = PieceFactory.createPiece(Piece.PieceType.GENERAL, color, 4, backRow);
        grid[backRow][5] = PieceFactory.createPiece(Piece.PieceType.ADVISOR, color, 5, backRow);
        grid[backRow][6] = PieceFactory.createPiece(Piece.PieceType.BISHOP, color, 6, backRow);
        grid[backRow][7] = PieceFactory.createPiece(Piece.PieceType.KNIGHT, color, 7, backRow);
        grid[backRow][8] = PieceFactory.createPiece(Piece.PieceType.ROOK, color, 8, backRow);

        // Cannons
        grid[cannonRow][1] = PieceFactory.createPiece(Piece.PieceType.CANNON, color, 1, cannonRow);
        grid[cannonRow][7] = PieceFactory.createPiece(Piece.PieceType.CANNON, color, 7, cannonRow);

        // Pawns
        for (int x = 0; x <= 8; x += 2) {
            grid[pawnRow][x] = PieceFactory.createPiece(Piece.PieceType.PAWN, color, x, pawnRow);
        }
    }

    public boolean movePiece(int fromX, int fromY, int toX, int toY) {
        if (!isMoveLegal(fromX, fromY, toX, toY)) return false;

        Piece piece = grid[fromY][fromX];
        piece.setX(toX);
        piece.setY(toY);
        grid[toY][toX] = piece;
        grid[fromY][fromX] = null;
        return true;
    }

    public boolean isMoveLegal(int fromX, int fromY, int toX, int toY) {
        Piece piece = grid[fromY][fromX];
        if (piece == null || !piece.isValidMove(toX, toY, grid)) return false;

        // Simulate move
        Piece target = grid[toY][toX];
        int oldX = piece.getX();
        int oldY = piece.getY();
        
        grid[toY][toX] = piece;
        grid[fromY][fromX] = null;
        piece.setX(toX);
        piece.setY(toY);

        boolean illegal = isKingInCheck(piece.getColor()) || isFlyingGeneral();

        // Undo move
        grid[fromY][fromX] = piece;
        grid[toY][toX] = target;
        piece.setX(oldX);
        piece.setY(oldY);

        return !illegal;
    }

    public boolean isKingInCheck(String color) {
        int[] kingPos = findGeneralPosition(color);
        if (kingPos == null) return false;

        String opponentColor = color.equals("RED") ? "BLACK" : "RED";
        for (int y = 0; y < 10; y++) {
            for (int x = 0; x < 9; x++) {
                Piece p = grid[y][x];
                if (p != null && p.getColor().equals(opponentColor)) {
                    if (p.isValidMove(kingPos[0], kingPos[1], grid)) return true;
                }
            }
        }
        return false;
    }

    public boolean isFlyingGeneral() {
        int[] redKing = findGeneralPosition("RED");
        int[] blackKing = findGeneralPosition("BLACK");
        if (redKing == null || blackKing == null) return false;

        if (redKing[0] == blackKing[0]) {
            int x = redKing[0];
            int start = Math.min(redKing[1], blackKing[1]) + 1;
            int end = Math.max(redKing[1], blackKing[1]);
            for (int y = start; y < end; y++) {
                if (grid[y][x] != null) return false;
            }
            return true;
        }
        return false;
    }

    public int[] findGeneralPosition(String color) {
        for (int y = 0; y < 10; y++) {
            for (int x = 0; x < 9; x++) {
                Piece p = grid[y][x];
                if (p != null && p.getColor().equals(color) && p.getType() == Piece.PieceType.GENERAL) {
                    return new int[]{x, y};
                }
            }
        }
        return null;
    }

    public boolean isCheckmate(String color) {
        if (!isKingInCheck(color)) return false;

        for (int y = 0; y < 10; y++) {
            for (int x = 0; x < 9; x++) {
                Piece p = grid[y][x];
                if (p != null && p.getColor().equals(color)) {
                    for (int ty = 0; ty < 10; ty++) {
                        for (int tx = 0; tx < 9; tx++) {
                            if (isMoveLegal(x, y, tx, ty)) return false;
                        }
                    }
                }
            }
        }
        return true;
    }
}
