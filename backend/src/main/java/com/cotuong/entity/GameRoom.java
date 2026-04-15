package com.cotuong.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "game_rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String roomCode;

    @ManyToOne
    @JoinColumn(name = "player_red_id")
    private User playerRed;

    @ManyToOne
    @JoinColumn(name = "player_black_id")
    private User playerBlack;

    @Enumerated(EnumType.STRING)
    private RoomStatus status; // WAITING, PLAYING, FINISHED

    public enum RoomStatus {
        WAITING, PLAYING, FINISHED
    }
}
