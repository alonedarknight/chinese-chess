package com.cotuong.logic;

public class PieceFactory {
    public static Piece createPiece(Piece.PieceType type, String color, int x, int y) {
        Piece piece;
        switch (type) {
            case GENERAL:
                piece = new General();
                break;
            case ADVISOR:
                piece = new Advisor();
                break;
            case BISHOP:
                piece = new Bishop();
                break;
            case KNIGHT:
                piece = new Knight();
                break;
            case ROOK:
                piece = new Rook();
                break;
            case CANNON:
                piece = new Cannon();
                break;
            case PAWN:
                piece = new Pawn();
                break;
            default:
                throw new IllegalArgumentException("Unknown piece type: " + type);
        }
        piece.setType(type);
        piece.setColor(color);
        piece.setX(x);
        piece.setY(y);
        return piece;
    }
}
