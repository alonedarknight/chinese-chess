package com.cotuong.service;

import org.springframework.stereotype.Component;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RoomStateManager {
    // roomId -> Set of playerIds that are READY
    private final ConcurrentHashMap<Integer, Set<Long>> readyPlayers = new ConcurrentHashMap<>();

    public void setReady(Integer roomId, Long playerId, boolean ready) {
        readyPlayers.computeIfAbsent(roomId, k -> Collections.newSetFromMap(new ConcurrentHashMap<>()));
        if (ready) {
            readyPlayers.get(roomId).add(playerId);
        } else {
            readyPlayers.get(roomId).remove(playerId);
        }
    }

    public boolean isPlayerReady(Integer roomId, Long playerId) {
        Set<Long> players = readyPlayers.get(roomId);
        return players != null && players.contains(playerId);
    }

    public boolean areAllReady(Integer roomId, Long... playerIds) {
        Set<Long> players = readyPlayers.get(roomId);
        if (players == null) return false;
        for (Long id : playerIds) {
            if (!players.contains(id)) return false;
        }
        return true;
    }

    public void clearRoom(Integer roomId) {
        readyPlayers.remove(roomId);
    }
}
