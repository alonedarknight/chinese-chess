package com.cotuong.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.*;

@Service
@RequiredArgsConstructor
public class GameConnectionTracker {
    private final SimpMessagingTemplate messagingTemplate;
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();
    private final Map<Long, ScheduledFuture<?>> disconnectTimers = new ConcurrentHashMap<>();

    public void handleDisconnect(Long playerId, Integer roomId, Runnable onTimeout) {
        // Start a 2-minute timer
        ScheduledFuture<?> timer = scheduler.schedule(() -> {
            onTimeout.run();
            disconnectTimers.remove(playerId);
        }, 2, TimeUnit.MINUTES);

        disconnectTimers.put(playerId, timer);

        // Notify opponent
        Map<String, Object> event = new HashMap<>();
        event.put("type", "PLAYER_DISCONNECTED");
        event.put("playerId", playerId);
        messagingTemplate.convertAndSend("/topic/game/" + roomId + "/events", event);
    }

    public void handleReconnect(Long playerId, Integer roomId) {
        ScheduledFuture<?> timer = disconnectTimers.remove(playerId);
        if (timer != null) {
            timer.cancel(false);
            
            // Notify opponent
            Map<String, Object> event = new HashMap<>();
            event.put("type", "PLAYER_RECONNECTED");
            event.put("playerId", playerId);
            messagingTemplate.convertAndSend("/topic/game/" + roomId + "/events", event);
        }
    }
}
