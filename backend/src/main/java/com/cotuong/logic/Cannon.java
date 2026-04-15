package com.cotuong.logic;

public class Cannon extends Piece {
    @Override
    public boolean isValidMove(int toX, int toY, Piece[][] board) {
        if (!isValidDestination(toX, toY, board)) return false;

        // Cannon must move in a straight line
        if (x != toX && y != toY) return false;

        int obstacles = countObstacles(toX, toY, board);
        Piece target = board[toY][toX];

        if (target == null) {
            // Moving: must have 0 obstacles
            return obstacles == 0;
        } else {
            // Capturing: must have exactly 1 obstacle
            return obstacles == 1;
        }
    }
}
