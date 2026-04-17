package com.cotuong.repository;

import com.cotuong.entity.GameHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GameHistoryRepository extends JpaRepository<GameHistory, Integer> {
    @Query("SELECT gh FROM GameHistory gh WHERE gh.player.id = :playerId ORDER BY gh.createdAt DESC")
    List<GameHistory> findByPlayerIdOrderByCreatedAtDesc(@Param("playerId") Long playerId);
}
