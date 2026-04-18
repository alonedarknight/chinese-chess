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
    public Game startGame(Integer roomId, Long redPlayerId, Long blackPlayerId) {
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
                .redPlayerId(redPlayerId)
                .blackPlayerId(blackPlayerId)
                .build();

        Game savedGame = gameRepository.save(game);
        System.out.println("TRACE: Game created with ID=" + savedGame.getId()
                + " for room=" + roomId
                + ", redPlayerId=" + redPlayerId
                + ", blackPlayerId=" + blackPlayerId);
        return savedGame;
    }

    @Transactional
    public void finishGame(Integer roomId, String result) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!"PLAYING".equals(room.getStatus())) {
            System.out.println("WARN: finishGame skipped - Room " + roomId + " status is '" + room.getStatus() + "', expected 'PLAYING'");
            return;
        }

        System.out.println("TRACE: [0] finishGame called for Room ID: " + roomId + " with result: " + result);

        // Sanitize result: strip suffixes like "(Opponent disconnected)"
        String sanitizedResult = result != null ? result.split(" ")[0].toUpperCase() : "DRAW";

        room.setStatus("WAITING");
        roomRepository.saveAndFlush(room);

        gameRepository.findFirstByRoomIdAndEndedAtIsNullOrderByStartedAtDesc(roomId)
                .ifPresentOrElse(game -> {
                    System.out.println("TRACE: [0.1] Found active game ID: " + game.getId()
                            + ", redPlayerId=" + game.getRedPlayerId()
                            + ", blackPlayerId=" + game.getBlackPlayerId());

                    game.setEndedAt(LocalDateTime.now());
                    game.setResult(sanitizedResult);
                    gameRepository.saveAndFlush(game);

                    // Use actual color assignments from Game entity
                    Long redId = game.getRedPlayerId();
                    Long blackId = game.getBlackPlayerId();

                    if (redId == null || blackId == null) {
                        // Fallback for legacy games created before color tracking
                        System.out.println("WARN: Game " + game.getId() + " missing color IDs, using room host/guest as fallback");
                        redId = room.getPlayerHost().getId();
                        blackId = room.getPlayerBlack() != null ? room.getPlayerBlack().getId() : null;
                    }

                    if (redId == null || blackId == null) {
                        System.out.println("ERROR: Cannot record game - missing player IDs. redId=" + redId + ", blackId=" + blackId);
                        return;
                    }

                    final Long finalRedId = redId;
                    final Long finalBlackId = blackId;

                    User redPlayer = userRepository.findById(finalRedId)
                            .orElseThrow(() -> new RuntimeException("Red player not found: " + finalRedId));
                    User blackPlayer = userRepository.findById(finalBlackId)
                            .orElseThrow(() -> new RuntimeException("Black player not found: " + finalBlackId));

                    // Record game history and update ELO
                    try {
                        Map<String, Integer> eloChanges = gameHistoryService.recordGame(game, redPlayer, blackPlayer, sanitizedResult);
                        System.out.println("TRACE: [5] Finished recordGame. ELO changes: RED=" + eloChanges.get("RED") + ", BLACK=" + eloChanges.get("BLACK"));

                        // Broadcast GAME_OVER with Elo Changes
                        Map<String, Object> gameOverMessage = new HashMap<>();
                        gameOverMessage.put("gameStatus", "GAME_OVER");
                        gameOverMessage.put("result", sanitizedResult);
                        gameOverMessage.put("redEloChange", eloChanges.get("RED"));
                        gameOverMessage.put("blackEloChange", eloChanges.get("BLACK"));
                        messagingTemplate.convertAndSend("/topic/game/" + roomId + "/events", gameOverMessage);
                    } catch (Exception e) {
                        System.out.println("ERROR: recordGame failed for game " + game.getId() + ": " + e.getMessage());
                        e.printStackTrace();
                        // Still broadcast GAME_OVER even if ELO recording fails
                        Map<String, Object> gameOverMessage = new HashMap<>();
                        gameOverMessage.put("gameStatus", "GAME_OVER");
                        gameOverMessage.put("result", sanitizedResult);
                        gameOverMessage.put("redEloChange", 0);
                        gameOverMessage.put("blackEloChange", 0);
                        messagingTemplate.convertAndSend("/topic/game/" + roomId + "/events", gameOverMessage);
                    }
                }, () -> {
                    System.out.println("ERROR: No active game (endedAt IS NULL) found for room " + roomId);
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

        // Find active game to determine actual color assignments
        Game activeGame = gameRepository.findFirstByRoomIdAndEndedAtIsNullOrderByStartedAtDesc(roomId).orElse(null);

        String result;
        if (activeGame != null && activeGame.getRedPlayerId() != null) {
            // Use actual color from Game entity
            if (playerId.equals(activeGame.getRedPlayerId())) {
                result = "BLACK_WIN";
            } else {
                result = "RED_WIN";
            }
        } else {
            // Fallback: determine by room position
            if (room.getPlayerHost().getId().equals(playerId)) {
                result = "BLACK_WIN";
            } else {
                result = "RED_WIN";
            }
        }

        System.out.println("TRACE: forfeitGame - Room " + roomId + ", playerId=" + playerId + ", result=" + result);

        // finishGame already broadcasts GAME_OVER with ELO changes
        finishGame(roomId, result);
    }

    @Transactional
    public void deleteRoom(Integer roomId) {
        roomRepository.deleteById(roomId);
    }
}
