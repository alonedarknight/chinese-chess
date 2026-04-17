package com.cotuong.service;

import com.cotuong.entity.Lobby;
import com.cotuong.entity.Room;
import com.cotuong.repository.LobbyRepository;
import com.cotuong.repository.RoomRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LobbyService {
    private final LobbyRepository lobbyRepository;
    private final RoomRepository roomRepository;

    @PostConstruct
    public void cleanupStaleRooms() {
        // Clear all rooms on startup to ensure a consistent state during dev/test.
        // This is safe because websocket connections are lost anyway on restart.
        System.out.println("DEBUG: Cleaning up stale rooms on startup...");
        try {
            roomRepository.deleteAll();
        } catch (Exception e) {
            System.err.println("ERROR: Failed to cleanup rooms: " + e.getMessage());
        }
    }

    public Lobby getGlobalLobby() {
        Lobby lobby = lobbyRepository.findById(1).orElseGet(() -> {
            Lobby newLobby = Lobby.builder().id(1).totalRoom(0).build();
            return lobbyRepository.save(newLobby);
        });
        
        // Dynamic count: all rooms that are NOT finished
        List<Room> activeRooms = roomRepository.findByStatusNot("FINISHED");
        lobby.setTotalRoom(activeRooms.size());
        return lobby;
    }

    @Transactional
    public void incrementRoomCount() {}

    @Transactional
    public void decrementRoomCount() {}
}
