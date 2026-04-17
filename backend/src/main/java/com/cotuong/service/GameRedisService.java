package com.cotuong.service;

import com.cotuong.model.GameSession;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class GameRedisService {
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private static final String KEY_PREFIX = "game:session:";

    public void saveSession(GameSession session) {
        try {
            String json = objectMapper.writeValueAsString(session);
            redisTemplate.opsForValue().set(KEY_PREFIX + session.getRoomId(), json, 2, TimeUnit.HOURS);
        } catch (Exception e) {
            throw new RuntimeException("Failed to save session to Redis", e);
        }
    }

    public GameSession loadSession(Integer roomId) {
        String json = redisTemplate.opsForValue().get(KEY_PREFIX + roomId);
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, GameSession.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to load session from Redis", e);
        }
    }

    public void deleteSession(Integer roomId) {
        redisTemplate.delete(KEY_PREFIX + roomId);
    }
}
