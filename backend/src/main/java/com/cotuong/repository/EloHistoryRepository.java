package com.cotuong.repository;

import com.cotuong.entity.EloHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EloHistoryRepository extends JpaRepository<EloHistory, Long> {
    List<EloHistory> findByUserIdOrderByCreatedAtDesc(Long userId);
}
