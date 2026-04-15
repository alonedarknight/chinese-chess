package com.cotuong.logic;

public class Rook extends Piece {
    @Override
    public boolean isValidMove(int toX, int toY, Piece[][] board) {
        if (!isValidDestination(toX, toY, board)) return false;

        // Rook must move in a straight line
        if (x != toX && y != toY) return false;

        // No obstacles allowed
        return countObstacles(toX, toY, board) == 0;
    }
}
