package com.cotuong.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "elo_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EloHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "game_id")
    private Game game;

    private Integer eloBefore;
    private Integer eloAfter;
    private Integer changeAmount;
    private LocalDateTime createdAt;
}
