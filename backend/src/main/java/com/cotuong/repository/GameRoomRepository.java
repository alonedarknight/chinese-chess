package com.cotuong.repository;

import com.cotuong.entity.GameRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GameRoomRepository extends JpaRepository<GameRoom, Long> {
    List<GameRoom> findByStatus(GameRoom.RoomStatus status);
}
