package com.cotuong.repository;

import com.cotuong.entity.GameState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameStateRepository extends JpaRepository<GameState, Long> {
    Optional<GameState> findByGameRoomId(Long gameRoomId);
}
