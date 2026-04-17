package com.cotuong.controller;

import com.cotuong.entity.Lobby;
import com.cotuong.entity.Room;
import com.cotuong.repository.RoomRepository;
import com.cotuong.service.LobbyService;
import com.cotuong.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class LobbyController {
    private final LobbyService lobbyService;
    private final RoomService roomService;
    private final RoomRepository roomRepository;

    @GetMapping("/lobby")
    public Lobby getLobby() {
        return lobbyService.getGlobalLobby();
    }

    @GetMapping("/rooms")
    public List<Room> getRooms() {
        return roomService.getActiveRooms();
    }

    @GetMapping("/rooms/{roomId}")
    public Room getRoom(@PathVariable Integer roomId) {
        return roomRepository.findById(roomId).orElseThrow(() -> new RuntimeException("Room not found"));
    }

    @PostMapping("/rooms")
    public Room createRoom(@RequestParam Long hostId, @RequestParam Integer timePlay) {
        return roomService.createRoom(hostId, timePlay);
    }

    @PostMapping("/rooms/{roomId}/join")
    public Room joinRoom(@PathVariable Integer roomId, @RequestParam Long playerId) {
        return roomService.joinRoom(roomId, playerId);
    }

    @PostMapping("/rooms/{roomId}/leave")
    public void leaveRoom(@PathVariable Integer roomId, @RequestParam Long playerId) {
        roomService.leaveRoom(roomId, playerId);
    }

    @PostMapping("/rooms/{roomId}/rematch")
    public void rematchRoom(@PathVariable Integer roomId) {
        roomService.resetRoomForRematch(roomId);
    }
}
