package com.cotuong.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "tbl_game")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "room_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"playerHost", "playerBlack", "lobby", "games", "hibernateLazyInitializer", "handler"})
    private Room room;

    @Column(name = "red_player_id")
    private Long redPlayerId;

    @Column(name = "black_player_id")
    private Long blackPlayerId;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    private String result; // RED_WIN, BLACK_WIN, DRAW

    @JsonIgnore
    @OneToMany(mappedBy = "game", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<GameHistory> gameHistorys;
}
