package com.cotuong.logic;

public class General extends Piece {
    @Override
    public boolean isValidMove(int toX, int toY, Piece[][] board) {
        if (!isValidDestination(toX, toY, board)) return false;

        int dx = Math.abs(toX - x);
        int dy = Math.abs(toY - y);

        // Move 1 step horizontally or vertically
        if (!((dx == 1 && dy == 0) || (dx == 0 && dy == 1))) return false;

        // Within Palace
        if (toX < 3 || toX > 5) return false;
        if (color.equals("RED")) {
            return toY >= 0 && toY <= 2;
        } else {
            return toY >= 7 && toY <= 9;
        }
    }
}
