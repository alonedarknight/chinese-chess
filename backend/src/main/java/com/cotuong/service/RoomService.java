package com.cotuong.service;

import com.cotuong.entity.*;
import com.cotuong.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class RoomService {
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final LobbyService lobbyService;
    private final GameRepository gameRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final GameHistoryService gameHistoryService;

    @Transactional
    public Room createRoom(Long hostId, Integer timePlay) {
        User host = userRepository.findById(hostId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Lobby lobby = lobbyService.getGlobalLobby();

        Room room = Room.builder()
                .playerHost(host)
                .timePlay(timePlay)
                .status("WAITING")
                .lobby(lobby)
                .build();

        room = roomRepository.save(room);

        // Broadcast to Lobby
        messagingTemplate.convertAndSend("/topic/lobby", "REFRESH");

        return room;
    }

    public List<Room> getActiveRooms() {
        return roomRepository.findByStatusNot("FINISHED");
    }

    public List<Room> getWaitingRooms() {
        return roomRepository.findByStatus("WAITING");
    }

    @Transactional
    public Room joinRoom(Integer roomId, Long playerId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!"WAITING".equals(room.getStatus()) || room.getPlayerBlack() != null) {
            throw new RuntimeException("Room is not available to join");
        }

        if (room.getPlayerHost().getId().equals(playerId)) {
            throw new RuntimeException("Host cannot join their own room as opponent");
        }

        User player = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        room.setPlayerBlack(player);
        Room savedRoom = roomRepository.save(room);

        // Broadcast to Host in room
        messagingTemplate.convertAndSend("/topic/room/" + roomId, "PLAYER_JOINED");
        // Broadcast to other people in Lobby (to refresh the rooms list as this one is now occupied)
        messagingTemplate.convertAndSend("/topic/lobby", "REFRESH");

        return savedRoom;
    }

    @Transactional
    public void kickPlayer(Integer roomId, Long hostId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!room.getPlayerHost().getId().equals(hostId)) {
            throw new RuntimeException("Only host can kick players");
        }

        if (!"WAITING".equals(room.getStatus())) {
            throw new RuntimeException("Cannot kick players while game is in progress");
        }

        room.setPlayerBlack(null);
        roomRepository.save(room);
    }

    @Transactional
    public Game startGame(Integer roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!"WAITING".equals(room.getStatus()) || room.getPlayerBlack() == null) {
            throw new RuntimeException("Room not ready to start");
        }

        room.setStatus("PLAYING");
        roomRepository.save(room);

        Game game = Game.builder()
                .room(room)
                .startedAt(LocalDateTime.now())
                .build();
        return gameRepository.save(game);
    }

    @Transactional
    public void finishGame(Integer roomId, String result) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!"PLAYING".equals(room.getStatus())) return;

        System.out.println("TRACE: [0] finishGame called for Room ID: " + roomId + " with result: " + result);

        // Sanitize result: strip suffixes like "(Opponent disconnected)"
        String sanitizedResult = result != null ? result.split(" ")[0].toUpperCase() : "DRAW";

        room.setStatus("WAITING");
        roomRepository.saveAndFlush(room);

        gameRepository.findFirstByRoomIdAndEndedAtIsNullOrderByStartedAtDesc(roomId)
                .ifPresent(game -> {
                    System.out.println("TRACE: [0.1] Found active game ID: " + game.getId());
                    game.setEndedAt(LocalDateTime.now());
                    game.setResult(sanitizedResult);
                    gameRepository.saveAndFlush(game);
                    
                    // Record game history and update ELO
                    java.util.Map<String, Integer> eloChanges = gameHistoryService.recordGame(game, room.getPlayerHost(), room.getPlayerBlack(), sanitizedResult);
                    System.out.println("TRACE: [5] Finished recordGame sequence.");

                    // Broadcast GAME_OVER with Elo Changes
                    Map<String, Object> gameOverMessage = new HashMap<>();
                    gameOverMessage.put("gameStatus", "GAME_OVER");
                    gameOverMessage.put("result", sanitizedResult);
                    gameOverMessage.put("redEloChange", eloChanges.get("RED"));
                    gameOverMessage.put("blackEloChange", eloChanges.get("BLACK"));
                    messagingTemplate.convertAndSend("/topic/game/" + roomId + "/events", gameOverMessage);
                });
    }

    @Transactional
    public void resetRoomForRematch(Integer roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        
        room.setStatus("WAITING");
        roomRepository.save(room);
        
        // Notify both players to refresh their room state
        messagingTemplate.convertAndSend("/topic/room/" + roomId, "REFRESH_ROOM");
        // Notify lobby that a new game might start soon (or just to keep sync)
        messagingTemplate.convertAndSend("/topic/lobby", "REFRESH");
    }

    @Transactional
    public void leaveRoom(Integer roomId, Long playerId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        // Allow leaving if WAITING or FINISHED
        if ("PLAYING".equals(room.getStatus())) return; 

        if (room.getPlayerHost().getId().equals(playerId)) {
            // Host leaving
            if (room.getPlayerBlack() != null) {
                // Transfer Host to the other player
                room.setPlayerHost(room.getPlayerBlack());
                room.setPlayerBlack(null);
                roomRepository.save(room);
                // Notify current players to refresh (Guest is now Host)
                messagingTemplate.convertAndSend("/topic/room/" + roomId, "PLAYER_LEFT");
            } else {
                // No one left -> Delete room
                deleteRoom(roomId);
                messagingTemplate.convertAndSend("/topic/room/" + roomId, "ROOM_CLOSED");
            }
        } else if (room.getPlayerBlack() != null && room.getPlayerBlack().getId().equals(playerId)) {
            // Second player leaving -> Clear black slot
            room.setPlayerBlack(null);
            roomRepository.save(room);
            messagingTemplate.convertAndSend("/topic/room/" + roomId, "PLAYER_LEFT");
        }
        
        // Refresh Lobby
        messagingTemplate.convertAndSend("/topic/lobby", "REFRESH");
    }

    @Transactional
    public void forfeitGame(Integer roomId, Long playerId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!"PLAYING".equals(room.getStatus())) return;

        String winnerColor;
        if (room.getPlayerHost().getId().equals(playerId)) {
            winnerColor = "BLACK";
        } else {
            winnerColor = "RED";
        }

        String result = winnerColor + "_WIN (Opponent disconnected)";
        finishGame(roomId, result);

        // Notify client
        Map<String, Object> event = new HashMap<>();
        event.put("gameStatus", "GAME_OVER");
        event.put("result", result);
        messagingTemplate.convertAndSend("/topic/game/" + roomId + "/events", event);
        messagingTemplate.convertAndSend("/topic/game/" + roomId, "REFRESH");
    }

    @Transactional
    public void deleteRoom(Integer roomId) {
        roomRepository.deleteById(roomId);
    }
}
