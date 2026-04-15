package com.cotuong.logic;

public class Knight extends Piece {
    @Override
    public boolean isValidMove(int toX, int toY, Piece[][] board) {
        if (!isValidDestination(toX, toY, board)) return false;

        int dx = Math.abs(toX - x);
        int dy = Math.abs(toY - y);

        // Move in L-shape
        if (!((dx == 1 && dy == 2) || (dx == 2 && dy == 1))) return false;

        // Check for obstruction (Horse's Foot)
        int checkX = x;
        int checkY = y;
        if (dx == 1) {
            // Moving more vertically
            checkY = (toY > y) ? y + 1 : y - 1;
        } else {
            // Moving more horizontally
            checkX = (toX > x) ? x + 1 : x - 1;
        }

        if (board[checkY][checkX] != null) return false;

        return true;
    }
}
