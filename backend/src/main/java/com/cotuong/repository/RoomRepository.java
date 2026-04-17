package com.cotuong.repository;

import com.cotuong.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {
    List<Room> findByStatus(String status);
    List<Room> findByStatusNot(String status);
    long countByStatusNot(String status);
}
