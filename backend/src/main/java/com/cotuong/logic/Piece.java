package com.cotuong.logic;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonTypeInfo(
        use = JsonTypeInfo.Id.NAME,
        include = JsonTypeInfo.As.EXISTING_PROPERTY,
        property = "type",
        visible = true
)
@JsonSubTypes({
        @JsonSubTypes.Type(value = General.class, name = "GENERAL"),
        @JsonSubTypes.Type(value = Advisor.class, name = "ADVISOR"),
        @JsonSubTypes.Type(value = Bishop.class, name = "BISHOP"),
        @JsonSubTypes.Type(value = Knight.class, name = "KNIGHT"),
        @JsonSubTypes.Type(value = Rook.class, name = "ROOK"),
        @JsonSubTypes.Type(value = Cannon.class, name = "CANNON"),
        @JsonSubTypes.Type(value = Pawn.class, name = "PAWN")
})
public abstract class Piece {
    protected int x;
    protected int y;
    protected String color; // "RED" or "BLACK"
    protected PieceType type;

    public abstract boolean isValidMove(int toX, int toY, Piece[][] board);

    protected boolean isWithinBoard(int toX, int toY) {
        return toX >= 0 && toX <= 8 && toY >= 0 && toY <= 9;
    }

    protected boolean isValidDestination(int toX, int toY, Piece[][] board) {
        if (!isWithinBoard(toX, toY)) return false;
        Piece target = board[toY][toX];
        if (target != null && target.getColor().equals(this.color)) return false;
        return true;
    }

    protected int countObstacles(int toX, int toY, Piece[][] board) {
        int count = 0;
        if (this.x == toX) {
            int start = Math.min(this.y, toY) + 1;
            int end = Math.max(this.y, toY);
            for (int i = start; i < end; i++) {
                if (board[i][toX] != null) count++;
            }
        } else if (this.y == toY) {
            int start = Math.min(this.x, toX) + 1;
            int end = Math.max(this.x, toX);
            for (int i = start; i < end; i++) {
                if (board[toY][i] != null) count++;
            }
        }
        return count;
    }

    public enum PieceType {
        GENERAL, ADVISOR, BISHOP, KNIGHT, ROOK, CANNON, PAWN
    }
}
