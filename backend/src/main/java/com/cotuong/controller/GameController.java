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
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @GetMapping("/{roomId}/state")
    public ResponseEntity<GameState> getGameState(@PathVariable Long roomId) {
        return gameStateRepository.findByGameRoomId(roomId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{roomId}/valid-moves")
    public ResponseEntity<java.util.List<int[]>> getValidMoves(
            @PathVariable Long roomId,
            @org.springframework.web.bind.annotation.RequestParam int x,
            @org.springframework.web.bind.annotation.RequestParam int y) {
        
        GameState gameState = gameStateRepository.findByGameRoomId(roomId)
                .orElseThrow(() -> new RuntimeException("Game not found"));

        try {
            com.cotuong.logic.Piece[][] grid = objectMapper.readValue(gameState.getBoardState(), com.cotuong.logic.Piece[][].class);
            com.cotuong.logic.Board board = new com.cotuong.logic.Board();
            board.setGrid(grid);

            return ResponseEntity.ok(board.getValidMoves(x, y));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
