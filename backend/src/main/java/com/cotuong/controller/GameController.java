package com.cotuong.controller;

import com.cotuong.logic.Board;
import com.cotuong.model.GameSession;
import com.cotuong.service.GameRedisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
public class GameController {
    private final GameRedisService gameRedisService;

    @GetMapping("/{roomId}/state")
    public GameSession getGameState(@PathVariable Integer roomId) {
        return gameRedisService.loadSession(roomId);
    }

    @GetMapping("/{roomId}/valid-moves")
    public List<int[]> getValidMoves(@PathVariable Integer roomId, @RequestParam int x, @RequestParam int y) {
        GameSession session = gameRedisService.loadSession(roomId);
        if (session == null) return List.of();
        
        Board board = session.getBoard();
        return board.getValidMoves(x, y);
    }
}
