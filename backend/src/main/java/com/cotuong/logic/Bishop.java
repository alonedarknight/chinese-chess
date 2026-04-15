package com.cotuong.logic;

public class Bishop extends Piece {
    @Override
    public boolean isValidMove(int toX, int toY, Piece[][] board) {
        if (!isValidDestination(toX, toY, board)) return false;

        int dx = Math.abs(toX - x);
        int dy = Math.abs(toY - y);

        // Move 2 steps diagonally
        if (dx != 2 || dy != 2) return false;

        // Cannot cross the river
        if (color.equals("RED")) {
            if (toY > 4) return false;
        } else {
            if (toY < 5) return false;
        }

        // Check for obstruction (Elephant's Eye)
        int midX = (x + toX) / 2;
        int midY = (y + toY) / 2;
        if (board[midY][midX] != null) return false;

        return true;
    }
}
