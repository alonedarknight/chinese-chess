package com.cotuong.logic;

public class Pawn extends Piece {
    @Override
    public boolean isValidMove(int toX, int toY, Piece[][] board) {
        if (!isValidDestination(toX, toY, board)) return false;

        int dx = Math.abs(toX - x);
        int dy = toY - y; // Directional dy

        if (color.equals("RED")) {
            // RED Pawns move in +Y direction (up)
            if (y <= 4) {
                // Before crossing river: only forward 1 step
                return dx == 0 && dy == 1;
            } else {
                // After crossing river: forward or sideways 1 step
                return (dy == 1 && dx == 0) || (dy == 0 && dx == 1);
            }
        } else {
            // BLACK Pawns move in -Y direction (down)
            if (y >= 5) {
                // Before crossing river: only forward 1 step
                return dx == 0 && dy == -1;
            } else {
                // After crossing river: forward or sideways 1 step
                return (dy == -1 && dx == 0) || (dy == 0 && dx == 1);
            }
        }
    }
}
