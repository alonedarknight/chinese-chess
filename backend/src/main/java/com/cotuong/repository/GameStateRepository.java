package com.cotuong.repository;

import com.cotuong.entity.GameState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameStateRepository extends JpaRepository<GameState, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT gs FROM GameState gs LEFT JOIN FETCH gs.gameRoom gr LEFT JOIN FETCH gr.playerRed LEFT JOIN FETCH gr.playerBlack WHERE gr.id = :gameRoomId")
    Optional<GameState> findByGameRoomId(@org.springframework.data.repository.query.Param("gameRoomId") Long gameRoomId);
}
