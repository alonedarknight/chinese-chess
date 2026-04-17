package com.cotuong.model;

import com.cotuong.logic.Board;
import lombok.*;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameSession implements Serializable {
    private Integer roomId;
    private Long redPlayerId;
    private Long blackPlayerId;
    private String redPlayerName;
    private String blackPlayerName;
    private String currentTurn; // RED, BLACK
    private Board board;
    private String status; // PLAYING, FINISHED
    
    // Time tracking (in seconds)
    private Integer redTimeLeft;
    private Integer blackTimeLeft;
    private Long lastMoveTimestamp;
}
