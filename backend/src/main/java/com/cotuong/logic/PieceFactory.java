package com.cotuong.logic;

public interface PieceFactory {
    Piece createGeneral(String color, int x, int y);
    Piece createAdvisor(String color, int x, int y);
    Piece createBishop(String color, int x, int y);
    Piece createKnight(String color, int x, int y);
    Piece createRook(String color, int x, int y);
    Piece createCannon(String color, int x, int y);
    Piece createPawn(String color, int x, int y);
}
