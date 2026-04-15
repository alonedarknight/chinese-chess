package com.cotuong.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "games")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "game_room_id")
    private GameRoom gameRoom;

    @ManyToOne
    @JoinColumn(name = "winner_id")
    private User winner;

    @Enumerated(EnumType.STRING)
    private GameResult result; // RED_WIN, BLACK_WIN, DRAW

    private LocalDateTime endedAt;

    public enum GameResult {
        RED_WIN, BLACK_WIN, DRAW
    }
}
