package com.cotuong.controller;

import com.cotuong.entity.GameHistory;
import com.cotuong.entity.User;
import com.cotuong.repository.GameHistoryRepository;
import com.cotuong.repository.UserRepository;
import com.cotuong.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final GameHistoryRepository gameHistoryRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        System.out.println("DEBUG: Entering register for user: " + user.getUsername());
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setElo(1200); // Default Elo
        return userRepository.save(user);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody User loginRequest) {
        System.out.println("DEBUG: Entering login for user: " + loginRequest.getUsername());
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );

        User user = userRepository.findByUsername(loginRequest.getUsername()).orElseThrow();
        String token = jwtUtils.generateToken((org.springframework.security.core.userdetails.UserDetails) authentication.getPrincipal());
        
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", user);
        return response;
    }

    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userRepository.findById(id).orElseThrow();
    }

    @GetMapping("/{id}/history")
    public List<GameHistory> getHistory(@PathVariable Long id) {
        System.out.println("DEBUG: Fetching history for user ID: " + id);
        List<GameHistory> history = gameHistoryRepository.findByPlayerIdOrderByCreatedAtDesc(id);
        System.out.println("DEBUG: Found " + history.size() + " records for user ID: " + id);
        return history;
    }
}
