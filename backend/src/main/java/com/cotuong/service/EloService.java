package com.cotuong.service;

import com.cotuong.entity.EloHistory;
import com.cotuong.entity.User;
import com.cotuong.repository.EloHistoryRepository;
import com.cotuong.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import com.cotuong.entity.Game;

@Service
@RequiredArgsConstructor
public class EloService {
    private final EloHistoryRepository eloHistoryRepository;
    private final UserRepository userRepository;
    private static final int K = 32;

    @Transactional
    public void calculateElo(User winner, User loser, Game game) {
        double expectedWinner = 1.0 / (1 + Math.pow(10, (loser.getElo() - winner.getElo()) / 400.0));
        double expectedLoser = 1.0 / (1 + Math.pow(10, (winner.getElo() - loser.getElo()) / 400.0));

        int newWinnerElo = (int) Math.round(winner.getElo() + K * (1 - expectedWinner));
        int newLoserElo = (int) Math.round(loser.getElo() + K * (0 - expectedLoser));

        saveHistory(winner, newWinnerElo, game);
        saveHistory(loser, newLoserElo, game);

        winner.setElo(newWinnerElo);
        loser.setElo(newLoserElo);

        userRepository.save(winner);
        userRepository.save(loser);
    }

    private void saveHistory(User user, int newElo, Game game) {
        EloHistory history = EloHistory.builder()
                .user(user)
                .game(game)
                .eloBefore(user.getElo())
                .eloAfter(newElo)
                .changeAmount(newElo - user.getElo())
                .createdAt(LocalDateTime.now())
                .build();
        eloHistoryRepository.save(history);
    }
}
