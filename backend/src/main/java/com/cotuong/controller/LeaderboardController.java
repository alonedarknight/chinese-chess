package com.cotuong.controller;

import com.cotuong.entity.User;
import com.cotuong.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {
    private final UserRepository userRepository;

    @GetMapping
    public List<User> getLeaderboard() {
        return userRepository.findTop20ByOrderByEloDesc();
    }
}
