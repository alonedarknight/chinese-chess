package com.cotuong.logic;

public class ChineseChessPieceFactory implements PieceFactory {
    
    private Piece initialize(Piece piece, Piece.PieceType type, String color, int x, int y) {
        piece.setType(type);
        piece.setColor(color);
        piece.setX(x);
        piece.setY(y);
        return piece;
    }

    @Override
    public Piece createGeneral(String color, int x, int y) {
        return initialize(new General(), Piece.PieceType.GENERAL, color, x, y);
    }

    @Override
    public Piece createAdvisor(String color, int x, int y) {
        return initialize(new Advisor(), Piece.PieceType.ADVISOR, color, x, y);
    }

    @Override
    public Piece createBishop(String color, int x, int y) {
        return initialize(new Bishop(), Piece.PieceType.BISHOP, color, x, y);
    }

    @Override
    public Piece createKnight(String color, int x, int y) {
        return initialize(new Knight(), Piece.PieceType.KNIGHT, color, x, y);
    }

    @Override
    public Piece createRook(String color, int x, int y) {
        return initialize(new Rook(), Piece.PieceType.ROOK, color, x, y);
    }

    @Override
    public Piece createCannon(String color, int x, int y) {
        return initialize(new Cannon(), Piece.PieceType.CANNON, color, x, y);
    }

    @Override
    public Piece createPawn(String color, int x, int y) {
        return initialize(new Pawn(), Piece.PieceType.PAWN, color, x, y);
    }
}
