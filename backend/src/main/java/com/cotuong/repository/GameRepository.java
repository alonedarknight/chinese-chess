package com.cotuong.repository;

import com.cotuong.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameRepository extends JpaRepository<Game, Integer> {
    java.util.Optional<Game> findFirstByRoomIdAndEndedAtIsNullOrderByStartedAtDesc(Integer roomId);
    java.util.List<Game> findByRoomId(Integer roomId);
}
