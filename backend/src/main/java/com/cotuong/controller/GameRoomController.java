package com.cotuong.controller;

import com.cotuong.entity.GameRoom;
import com.cotuong.service.GameRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class GameRoomController {
    private final GameRoomService gameRoomService;

    @PostMapping
    public GameRoom createRoom(@RequestParam Long hostId) {
        return gameRoomService.createRoom(hostId);
    }

    @GetMapping
    public List<GameRoom> getWaitingRooms() {
        return gameRoomService.getWaitingRooms();
    }

    @PostMapping("/{roomId}/join")
    public GameRoom joinRoom(@PathVariable Long roomId, @RequestParam Long playerId) {
        return gameRoomService.joinRoom(roomId, playerId);
    }
}
