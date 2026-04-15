package com.cotuong.service;

import com.cotuong.entity.GameRoom;
import com.cotuong.entity.GameState;
import com.cotuong.entity.User;
import com.cotuong.entity.Game;
import com.cotuong.logic.Board;
import com.cotuong.repository.GameRoomRepository;
import com.cotuong.repository.GameStateRepository;
import com.cotuong.repository.UserRepository;
import com.cotuong.repository.GameRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GameRoomService {
    private final GameRoomRepository gameRoomRepository;
    private final UserRepository userRepository;
    private final GameStateRepository gameStateRepository;
    private final GameRepository gameRepository;
    private final EloService eloService;
    private final ObjectMapper objectMapper;

    @Transactional
    public GameRoom createRoom(Long hostId) {
        User host = userRepository.findById(hostId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        GameRoom room = GameRoom.builder()
                .roomCode(UUID.randomUUID().toString().substring(0, 8))
                .playerRed(host)
                .status(GameRoom.RoomStatus.WAITING)
                .build();

        room = gameRoomRepository.save(room);

        // Initialize board state immediately upon room creation
        Board board = new Board();
        board.initializeBoard();
        try {
            String boardJson = objectMapper.writeValueAsString(board.getGrid());
            GameState gameState = GameState.builder()
                    .gameRoom(room)
                    .boardState(boardJson)
                    .currentTurn(GameState.PieceColor.RED)
                    .build();
            gameStateRepository.save(gameState);
        } catch (Exception e) {
            throw new RuntimeException("Failed to initialize game state", e);
        }

        return room;
    }

    public List<GameRoom> getWaitingRooms() {
        return gameRoomRepository.findByStatus(GameRoom.RoomStatus.WAITING);
    }

    @Transactional
    public GameRoom joinRoom(Long roomId, Long playerId) {
        GameRoom room = gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (room.getStatus() != GameRoom.RoomStatus.WAITING || room.getPlayerBlack() != null) {
            throw new RuntimeException("Room is not available to join");
        }

        User player = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        room.setPlayerBlack(player);
        room.setStatus(GameRoom.RoomStatus.PLAYING);
        gameRoomRepository.save(room);

        return room;
    }

    @Transactional
    public void finishGame(Long roomId, String winnerColor) {
        GameRoom room = gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (room.getStatus() == GameRoom.RoomStatus.FINISHED) return;

        User winner = winnerColor.equals("RED") ? room.getPlayerRed() : room.getPlayerBlack();
        User loser = winnerColor.equals("RED") ? room.getPlayerBlack() : room.getPlayerRed();

        room.setStatus(GameRoom.RoomStatus.FINISHED);
        gameRoomRepository.save(room);

        Game game = Game.builder()
                .gameRoom(room)
                .winner(winner)
                .result(winnerColor.equals("RED") ? Game.GameResult.RED_WIN : Game.GameResult.BLACK_WIN)
                .endedAt(LocalDateTime.now())
                .build();
        game = gameRepository.save(game);

        eloService.calculateElo(winner, loser, game);
    }
}
