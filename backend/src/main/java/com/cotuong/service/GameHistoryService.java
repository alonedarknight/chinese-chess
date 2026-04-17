package com.cotuong.service;

import com.cotuong.entity.Game;
import com.cotuong.entity.GameHistory;
import com.cotuong.entity.User;
import com.cotuong.repository.GameHistoryRepository;
import com.cotuong.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GameHistoryService {
    private final GameHistoryRepository gameHistoryRepository;
    private final UserRepository userRepository;
    private static final int K = 32;

    @Transactional
    public java.util.Map<String, Integer> recordGame(Game game, User redPlayer, User blackPlayer, String result) {
        System.out.println("TRACE: [1] Start recordGame for Room: " + (game.getRoom() != null ? game.getRoom().getId() : "null"));
        
        // Calculate Expected Scores
        double expectedRed = 1.0 / (1 + Math.pow(10, (blackPlayer.getElo() - redPlayer.getElo()) / 400.0));
        double expectedBlack = 1.0 / (1 + Math.pow(10, (redPlayer.getElo() - blackPlayer.getElo()) / 400.0));

        // Actual Scores
        double scoreRed = 0.5;
        double scoreBlack = 0.5;

        if ("RED_WIN".equals(result)) {
            scoreRed = 1.0;
            scoreBlack = 0.0;
        } else if ("BLACK_WIN".equals(result)) {
            scoreRed = 0.0;
            scoreBlack = 1.0;
        }

        // New Elos
        int oldRedElo = redPlayer.getElo();
        int oldBlackElo = blackPlayer.getElo();
        int newRedElo = (int) Math.round(oldRedElo + K * (scoreRed - expectedRed));
        int newBlackElo = (int) Math.round(oldBlackElo + K * (scoreBlack - expectedBlack));

        System.out.println("TRACE: [2] Elo Calculated. Red: " + oldRedElo + "->" + newRedElo + ", Black: " + oldBlackElo + "->" + newBlackElo);

        // Save Histories
        saveHistory(redPlayer, game, oldRedElo, newRedElo, scoreRed, "RED");
        saveHistory(blackPlayer, game, oldBlackElo, newBlackElo, scoreBlack, "BLACK");

        // Update Players
        redPlayer.setElo(newRedElo);
        blackPlayer.setElo(newBlackElo);
        userRepository.saveAndFlush(redPlayer);
        userRepository.saveAndFlush(blackPlayer);

        System.out.println("TRACE: [4] Players ELO updated and flushed.");

        java.util.Map<String, Integer> changes = new java.util.HashMap<>();
        changes.put("RED", newRedElo - oldRedElo);
        changes.put("BLACK", newBlackElo - oldBlackElo);
        return changes;
    }

    private void saveHistory(User player, Game game, int eloBefore, int eloAfter, double score, String color) {
        String resultStr = "DRAW";
        if (score == 1.0) resultStr = "WIN";
        if (score == 0.0) resultStr = "LOSS";

        GameHistory history = GameHistory.builder()
                .player(player)
                .game(game)
                .eloBefore(eloBefore)
                .eloAfter(eloAfter)
                .result(resultStr)
                .color(color)
                .build();
        
        System.out.println("TRACE: [3] Attempting to save history for " + player.getUsername() + " (" + color + ")");
        GameHistory saved = gameHistoryRepository.saveAndFlush(history);
        System.out.println("TRACE: [3-SUCCESS] History record ID: " + saved.getId() + " saved and flushed.");
    }
}
