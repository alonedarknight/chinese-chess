package com.cotuong.config;

import com.cotuong.entity.Room;
import com.cotuong.repository.RoomRepository;
import com.cotuong.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final RoomService roomService;
    private final RoomRepository roomRepository;
    
    // Store mapping from SessionId to PlayerInfo (roomId and playerId)
    private final Map<String, PlayerSessionInfo> sessions = new ConcurrentHashMap<>();
    
    // Store pending forfeits: key is "roomId:playerId", value is the scheduled task
    private final Map<String, ScheduledFuture<?>> pendingForfeits = new ConcurrentHashMap<>();
    // Store pending leaves for WAITING rooms
    private final Map<String, ScheduledFuture<?>> pendingLeaves = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        PlayerSessionInfo info = sessions.remove(sessionId);
        if (info != null) {
            Room room = roomRepository.findById(info.getRoomId()).orElse(null);
            if (room == null) return;

            String leaveKey = info.getRoomId() + ":" + info.getPlayerId();

            if ("PLAYING".equals(room.getStatus())) {
                log.info("User {} disconnected from PLAYING room {}. Scheduling forfeit in 120s...", info.getPlayerId(), info.getRoomId());
                
                ScheduledFuture<?> forfeitTask = scheduler.schedule(() -> {
                    log.info("Forfeiting game for player {} in room {} due to timeout.", info.getPlayerId(), info.getRoomId());
                    pendingForfeits.remove(leaveKey);
                    try {
                        roomService.forfeitGame(info.getRoomId(), info.getPlayerId());
                    } catch (Exception e) {
                        log.error("Error forfeiting game for player {} in room {}: {}", info.getPlayerId(), info.getRoomId(), e.getMessage());
                    }
                }, 120, TimeUnit.SECONDS);
                
                pendingForfeits.put(leaveKey, forfeitTask);
            } else if ("WAITING".equals(room.getStatus())) {
                // Delay the leave by 5 seconds to allow for page navigation (Game -> RoomWaiting)
                // If the player reconnects within 5 seconds, the leave is cancelled
                log.info("User {} disconnected from WAITING room {}. Scheduling leave in 5s...", info.getPlayerId(), info.getRoomId());
                
                ScheduledFuture<?> leaveTask = scheduler.schedule(() -> {
                    log.info("Executing delayed leave for player {} in room {}.", info.getPlayerId(), info.getRoomId());
                    pendingLeaves.remove(leaveKey);
                    try {
                        roomService.leaveRoom(info.getRoomId(), info.getPlayerId());
                    } catch (Exception e) {
                        log.error("Error leaving room for player {} in room {}: {}", info.getPlayerId(), info.getRoomId(), e.getMessage());
                    }
                }, 5, TimeUnit.SECONDS);
                
                pendingLeaves.put(leaveKey, leaveTask);
            }
        }
    }

    public void registerSession(String sessionId, Integer roomId, Long playerId) {
        sessions.put(sessionId, new PlayerSessionInfo(roomId, playerId));
        
        String key = roomId + ":" + playerId;
        
        // Cancel any pending forfeit for this player
        ScheduledFuture<?> forfeitTask = pendingForfeits.remove(key);
        if (forfeitTask != null) {
            log.info("Player {} reconnected to room {}. Cancelling forfeit task.", playerId, roomId);
            forfeitTask.cancel(false);
        }
        
        // Cancel any pending leave for this player
        ScheduledFuture<?> leaveTask = pendingLeaves.remove(key);
        if (leaveTask != null) {
            log.info("Player {} reconnected to room {}. Cancelling leave task.", playerId, roomId);
            leaveTask.cancel(false);
        }
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    private static class PlayerSessionInfo {
        private Integer roomId;
        private Long playerId;
    }
}
