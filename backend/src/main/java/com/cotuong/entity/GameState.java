package com.cotuong.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "game_states")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameState {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "game_room_id")
    private GameRoom gameRoom;

    @Column(columnDefinition = "TEXT")
    private String boardState; // JSON representation of the board

    @Enumerated(EnumType.STRING)
    private PieceColor currentTurn;

    public enum PieceColor {
        RED, BLACK
    }
}
