package com.cotuong.controller;

import com.cotuong.entity.Game;
import com.cotuong.entity.Room;
import com.cotuong.entity.User;
import com.cotuong.logic.Board;
import com.cotuong.logic.Piece;
import com.cotuong.logic.PieceFactory;
import com.cotuong.model.GameSession;
import com.cotuong.repository.UserRepository;
import com.cotuong.repository.RoomRepository;
import com.cotuong.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import com.cotuong.config.WebSocketEventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {
    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    private final RoomRepository roomRepository;
    private final RoomStateManager roomStateManager;
    private final GameRedisService gameRedisService;
    private final GameHistoryService gameHistoryService;
    private final PieceFactory pieceFactory;
    private final UserRepository userRepository;
    private final WebSocketEventListener webSocketEventListener;

    @MessageMapping("/room/{roomId}/ready")
    public void handleReady(@DestinationVariable Integer roomId, Map<String, Object> payload) {
        Long playerId = Long.valueOf(payload.get("playerId").toString());
        boolean ready = (boolean) payload.get("ready");

        roomStateManager.setReady(roomId, playerId, ready);

        Map<String, Object> response = new HashMap<>();
        response.put("playerId", playerId);
        response.put("ready", ready);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, response);
    }

    @MessageMapping("/room/{roomId}/join-notify")
    public void handleJoinNotify(@DestinationVariable Integer roomId, Map<String, Object> payload, StompHeaderAccessor headerAccessor) {
        Long playerId = Long.valueOf(payload.get("playerId").toString());
        webSocketEventListener.registerSession(headerAccessor.getSessionId(), roomId, playerId);
    }

    @MessageMapping("/room/{roomId}/start")
    @Transactional
    public void handleStartGame(@DestinationVariable Integer roomId, Map<String, Object> payload) {
        Long hostId = Long.valueOf(payload.get("hostId").toString());
        Room room = roomRepository.findById(roomId).orElseThrow();

        if (!room.getPlayerHost().getId().equals(hostId)) return;
        if (room.getPlayerBlack() == null || !roomStateManager.isPlayerReady(roomId, room.getPlayerBlack().getId())) return;

        // Randomize colors FIRST
        boolean hostIsRed = new Random().nextBoolean();
        Long redId = hostIsRed ? room.getPlayerHost().getId() : room.getPlayerBlack().getId();
        Long blackId = hostIsRed ? room.getPlayerBlack().getId() : room.getPlayerHost().getId();
        String redName = hostIsRed ? room.getPlayerHost().getUsername() : room.getPlayerBlack().getUsername();
        String blackName = hostIsRed ? room.getPlayerBlack().getUsername() : room.getPlayerHost().getUsername();

        // Start persistence match with color assignments
        Game game = roomService.startGame(roomId, redId, blackId);

        // Initialize Board via Abstract Factory
        Board board = new Board();
        board.initializeBoard(pieceFactory);

        // Initialize Session in Redis
        Integer initialTime = room.getTimePlay() * 60; // Convert to seconds
        GameSession session = GameSession.builder()
                .roomId(roomId)
                .redPlayerId(redId)
                .blackPlayerId(blackId)
                .redPlayerName(redName)
                .blackPlayerName(blackName)
                .currentTurn("RED")
                .board(board)
                .status("PLAYING")
                .redTimeLeft(initialTime)
                .blackTimeLeft(initialTime)
                .lastMoveTimestamp(System.currentTimeMillis())
                .build();
        gameRedisService.saveSession(session);

        // Broadcast Start
        messagingTemplate.convertAndSend("/topic/game/" + roomId, session);
    }

    @MessageMapping("/game/{roomId}/move")
    public void handleMove(@DestinationVariable Integer roomId, Map<String, Object> payload) {
        Long playerId = Long.valueOf(payload.get("playerId").toString());
        int fromX = (int) payload.get("fromX");
        int fromY = (int) payload.get("fromY");
        int toX = (int) payload.get("toX");
        int toY = (int) payload.get("toY");

        GameSession session = gameRedisService.loadSession(roomId);
        if (session == null || !"PLAYING".equals(session.getStatus())) return;

        // Check turn
        Long currentTurnId = session.getCurrentTurn().equals("RED") ? session.getRedPlayerId() : session.getBlackPlayerId();
        if (!currentTurnId.equals(playerId)) return;

        Board board = session.getBoard();
        
        // Calculate Time
        long currentTime = System.currentTimeMillis();
        int elapsed = (int) ((currentTime - session.getLastMoveTimestamp()) / 1000);
        
        if (session.getCurrentTurn().equals("RED")) {
            session.setRedTimeLeft(session.getRedTimeLeft() - elapsed);
            if (session.getRedTimeLeft() <= 0) {
                finishGameInternal(roomId, "BLACK_WIN");
                return;
            }
        } else {
            session.setBlackTimeLeft(session.getBlackTimeLeft() - elapsed);
            if (session.getBlackTimeLeft() <= 0) {
                finishGameInternal(roomId, "RED_WIN");
                return;
            }
        }
        session.setLastMoveTimestamp(currentTime);

        if (board.movePiece(fromX, fromY, toX, toY)) {
            // Update turn
            String nextTurn = session.getCurrentTurn().equals("RED") ? "BLACK" : "RED";
            session.setCurrentTurn(nextTurn);
            gameRedisService.saveSession(session);

            // Broadcast move
            messagingTemplate.convertAndSend("/topic/game/" + roomId, session);

            // Checkmate check
            if (board.isCheckmate(nextTurn)) {
                finishGameInternal(roomId, nextTurn.equals("RED") ? "BLACK_WIN" : "RED_WIN");
            }
        }
    }

    @MessageMapping("/game/{roomId}/surrender")
    public void handleSurrender(@DestinationVariable Integer roomId, Map<String, Object> payload) {
        Long playerId = Long.valueOf(payload.get("playerId").toString());
        GameSession session = gameRedisService.loadSession(roomId);
        if (session == null) return;

        String winnerResult = (playerId.equals(session.getRedPlayerId())) ? "BLACK_WIN" : "RED_WIN";
        finishGameInternal(roomId, winnerResult);
    }

    @MessageMapping("/game/{roomId}/draw-request")
    public void handleDrawRequest(@DestinationVariable Integer roomId, Map<String, Object> payload) {
        Long playerId = Long.valueOf(payload.get("playerId").toString());
        Map<String, Object> event = new HashMap<>();
        event.put("type", "DRAW_REQUEST");
        event.put("fromPlayerId", playerId);
        messagingTemplate.convertAndSend("/topic/game/" + roomId + "/events", event);
    }

    @MessageMapping("/game/{roomId}/draw-response")
    public void handleDrawResponse(@DestinationVariable Integer roomId, Map<String, Object> payload) {
        boolean accepted = (boolean) payload.get("accepted");
        if (accepted) {
            finishGameInternal(roomId, "DRAW");
        } else {
            GameSession session = gameRedisService.loadSession(roomId);
            if (session == null) return;
            
            Map<String, Object> event = new HashMap<>();
            event.put("type", "DRAW_DECLINED");
            event.put("fromPlayerId", "OPPONENT"); 
            messagingTemplate.convertAndSend("/topic/game/" + roomId + "/events", event);
        }
    }

    private void finishGameInternal(Integer roomId, String result) {
        GameSession session = gameRedisService.loadSession(roomId);
        if (session == null) {
            System.out.println("WARN: finishGameInternal - No Redis session found for room " + roomId);
            return;
        }

        System.out.println("TRACE: finishGameInternal called for room " + roomId + " with result: " + result);

        gameRedisService.deleteSession(roomId);
        roomStateManager.clearRoom(roomId);

        try {
            roomService.finishGame(roomId, result);
        } catch (Exception e) {
            System.out.println("ERROR: finishGameInternal failed for room " + roomId + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
}
