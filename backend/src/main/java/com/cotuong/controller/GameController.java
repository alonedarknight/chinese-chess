package com.cotuong.controller;

import com.cotuong.entity.GameState;
import com.cotuong.repository.GameStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
public class GameController {
    private final GameStateRepository gameStateRepository;

    @GetMapping("/{roomId}/state")
    public ResponseEntity<GameState> getGameState(@PathVariable Long roomId) {
        return gameStateRepository.findByGameRoomId(roomId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
