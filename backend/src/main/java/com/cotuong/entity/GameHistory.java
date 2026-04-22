package com.cotuong.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tbl_game_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "player_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"password"})
    private User player;

    @ManyToOne
    @JoinColumn(name = "game_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"room", "gameHistorys", "games", "hibernateLazyInitializer", "handler"})
    private Game game;

    private Integer eloBefore;
    private Integer eloAfter;
    private String result; // WIN, LOSS, DRAW
    private String color; // RED, BLACK

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
