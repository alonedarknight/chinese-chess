package com.cotuong.controller;

import com.cotuong.entity.GameState;
import com.cotuong.logic.Board;
import com.cotuong.logic.Piece;
import com.cotuong.repository.GameStateRepository;
import com.cotuong.service.GameRoomService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {
    private final GameStateRepository gameStateRepository;
    private final GameRoomService gameRoomService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    @MessageMapping("/game/{roomId}/move")
    @Transactional
    public void handleMove(@DestinationVariable Long roomId, Map<String, Object> payload) {
        int fromX = (int) payload.get("fromX");
        int fromY = (int) payload.get("fromY");
        int toX = (int) payload.get("toX");
        int toY = (int) payload.get("toY");
        
        GameState gameState = gameStateRepository.findByGameRoomId(roomId)
                .orElseThrow(() -> new RuntimeException("Game state not found"));

        try {
            Piece[][] grid = objectMapper.readValue(gameState.getBoardState(), Piece[][].class);
            Board board = new Board();
            board.setGrid(grid);

            Piece piece = grid[fromY][fromX];
            if (piece == null || !piece.getColor().equals(gameState.getCurrentTurn().toString())) {
                return;
            }

            // Using the new isMoveLegal which includes Flying General and Self-Check
            if (board.movePiece(fromX, fromY, toX, toY)) {
                String nextTurnColor = gameState.getCurrentTurn() == GameState.PieceColor.RED ? "BLACK" : "RED";
                gameState.setCurrentTurn(GameState.PieceColor.valueOf(nextTurnColor));
                gameState.setBoardState(objectMapper.writeValueAsString(board.getGrid()));
                gameStateRepository.save(gameState);

                // Broadcast move
                messagingTemplate.convertAndSend("/topic/game/" + roomId, gameState);

                // Check for terminal state (Checkmate)
                if (board.isCheckmate(nextTurnColor)) {
                    String winnerColor = (nextTurnColor.equals("RED")) ? "BLACK" : "RED";
                    gameRoomService.finishGame(roomId, winnerColor);
                    
                    Map<String, Object> gameOverMessage = new HashMap<>();
                    gameOverMessage.put("gameStatus", "GAME_OVER");
                    gameOverMessage.put("winner", winnerColor);
                    messagingTemplate.convertAndSend("/topic/game/" + roomId + "/events", gameOverMessage);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
