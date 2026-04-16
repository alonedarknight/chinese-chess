import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import ChessBoard from '../components/ChessBoard';
import GameOverModal from '../components/GameOverModal';
import axiosClient from '../api/axiosClient';

const Game = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const stompClientRef = useRef(null);
  const myUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // 1. Initial Fetch
    fetchGameState();

    // 2. Setup WebSocket
    const socket = new SockJS('http://localhost:8081/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      debug: (str) => console.log('STOMP:', str),
      onConnect: () => {
        console.log('Connected to WebSocket');
        // Subscribe to game updates
        client.subscribe(`/topic/game/${roomId}`, (message) => {
          const newState = JSON.parse(message.body);
          setGameState(newState);
        });

        // Subscribe to game over events
        client.subscribe(`/topic/game/${roomId}/events`, (message) => {
          const event = JSON.parse(message.body);
          if (event.gameStatus === 'GAME_OVER') {
            setGameOver(event);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Broker error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [roomId]);

  if (!myUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="mb-4">Vui lòng đăng nhập để chơi.</p>
          <button onClick={() => navigate('/login')} className="bg-blue-600 px-4 py-2 rounded">Đăng nhập</button>
        </div>
      </div>
    );
  }

  const fetchGameState = async () => {
    try {
      const response = await axiosClient.get(`/game/${roomId}/state`);
      setGameState(response.data);
    } catch (err) {
      console.error('Failed to fetch initial state', err);
    }
  };

  const fetchValidMoves = async (x, y) => {
    try {
      const response = await axiosClient.get(`/game/${roomId}/valid-moves?x=${x}&y=${y}`);
      setValidMoves(response.data);
    } catch (err) {
      console.error('Failed to fetch valid moves', err);
    }
  };

  const onSquareClick = (x, y) => {
    if (gameOver) return;

    const clickedPiece = gameState?.boardState ? JSON.parse(gameState.boardState)[y][x] : null;

    if (!selectedPiece) {
      // First click: Select own piece
      if (clickedPiece && clickedPiece.color === gameState?.currentTurn) {
        setSelectedPiece({ x, y, piece: clickedPiece });
        fetchValidMoves(x, y);
      }
    } else {
      // Second click: Try to move
      if (selectedPiece.x === x && selectedPiece.y === y) {
        setSelectedPiece(null); // Deselect
        setValidMoves([]);
        return;
      }

      // Send move via STOMP
      const movePayload = {
        fromX: selectedPiece.x,
        fromY: selectedPiece.y,
        toX: x,
        toY: y,
        playerId: myUser.id
      };

      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.publish({
          destination: `/app/game/${roomId}/move`,
          body: JSON.stringify(movePayload)
        });
      }

      setSelectedPiece(null);
      setValidMoves([]);
    }
  };

  const myColor = gameState?.gameRoom?.playerRed?.id === Number(myUser?.id) ? 'RED' : 'BLACK';
  // Red is at top (Row 0) in the grid, so if I am RED, I am at the bottom (Row 0 bottom)
  const isFlipped = myColor === 'RED';

  console.log('DEBUG Perspectives:', {
    myUserId: myUser.id,
    playerRedId: gameState?.gameRoom?.playerRed?.id,
    playerBlackId: gameState?.gameRoom?.playerBlack?.id,
    myColor,
    isFlipped
  });

  const boardArray = gameState?.boardState 
    ? JSON.parse(gameState.boardState) 
    : Array(10).fill(null).map(() => Array(9).fill(null));

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Phòng chơi #{roomId}</h2>
        <div className="flex items-center space-x-4 bg-gray-800 px-6 py-2 rounded-full border border-gray-700">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${gameState?.currentTurn === 'RED' ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></div>
            <span className={gameState?.currentTurn === 'RED' ? 'text-red-400 font-bold' : 'text-gray-400'}>Quân ĐỎ</span>
          </div>
          <div className="text-gray-500">|</div>
          <div className="flex items-center space-x-2">
            <span className={gameState?.currentTurn === 'BLACK' ? 'text-gray-100 font-bold' : 'text-gray-400'}>Quân ĐEN</span>
            <div className={`w-3 h-3 rounded-full ${gameState?.currentTurn === 'BLACK' ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`}></div>
          </div>
        </div>
      </div>

      <ChessBoard 
        boardState={boardArray} 
        selectedPiece={selectedPiece} 
        validMoves={validMoves}
        isFlipped={isFlipped}
        onSquareClick={onSquareClick}
      />

      {gameOver && (
        <GameOverModal winner={gameOver.winner} currentUserId={myUser.id} />
      )}

      <div className="mt-8 text-gray-500 text-sm">
        Click lần 1 để chọn quân (đúng lượt), Click lần 2 để di chuyển.
      </div>
    </div>
  );
};

export default Game;
