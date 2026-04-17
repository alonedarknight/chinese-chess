package com.cotuong.config;

import com.cotuong.entity.Lobby;
import com.cotuong.repository.LobbyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataLoader {
    private final LobbyRepository lobbyRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void initLobby() {
        if (lobbyRepository.count() == 0) {
            Lobby lobby = Lobby.builder()
                    .totalRoom(0)
                    .build();
            lobbyRepository.save(lobby);
        }
    }
}
