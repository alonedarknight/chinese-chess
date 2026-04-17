import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosClient from '../api/axiosClient';

const RoomWaiting = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const stompClient = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // Small delay to ensure DB consistency if coming from a fast rematch
    const timer = setTimeout(() => {
        fetchRoomInitial();
    }, 200);
    connectWebSocket();

    return () => {
      clearTimeout(timer);
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [roomId]);

  const fetchRoomInitial = async () => {
    try {
      const response = await axiosClient.get(`/rooms/${roomId}`);
      setRoom(response.data);
    } catch (err) {
      navigate('/');
    }
  };

  const connectWebSocket = () => {
    const socket = new SockJS('http://localhost:8081/ws');
    stompClient.current = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        stompClient.current.subscribe(`/topic/room/${roomId}`, (message) => {
          if (message.body === 'PLAYER_JOINED' || message.body === 'PLAYER_LEFT' || message.body === 'REFRESH_ROOM') {
            setIsReady(false);
            setOpponentReady(false);
            fetchRoomInitial();
            return;
          }
          if (message.body === 'ROOM_CLOSED') {
            navigate('/lobby');
            return;
          }
          const data = JSON.parse(message.body);
          if (data.playerId === user.id) {
            setIsReady(data.ready);
          } else {
            setOpponentReady(data.ready);
          }
        });

        stompClient.current.subscribe(`/topic/game/${roomId}`, (message) => {
          try {
            const data = JSON.parse(message.body);
            if (data && data.status === 'PLAYING') {
              navigate(`/game/${roomId}`);
            }
          } catch (e) {
            // Ignore non-JSON messages
          }
        });

        // Notify server about our presence for disconnect handling
        stompClient.current.publish({
            destination: `/app/room/${roomId}/join-notify`,
            body: JSON.stringify({ playerId: user.id })
        });
      },
    });
    stompClient.current.activate();
  };

  const toggleReady = () => {
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.publish({
        destination: `/app/room/${roomId}/ready`,
        body: JSON.stringify({ playerId: user.id, ready: !isReady }),
      });
    }
  };

  const handleLeaveRoom = async () => {
    try {
        await axiosClient.post(`/rooms/${roomId}/leave?playerId=${user.id}`);
        navigate('/lobby');
    } catch (err) {
        console.error('Failed to leave room', err);
        navigate('/lobby');
    }
  };

  const handleStartGame = () => {
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.publish({
        destination: `/app/room/${roomId}/start`,
        body: JSON.stringify({ hostId: user.id }),
      });
    }
  };

  const isHost = room?.playerHost?.id === user.id;
  const hasOpponent = room?.playerBlack != null;

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
            <div>
              <h1 className="text-2xl font-black text-white">ROOM #{roomId}</h1>
              <p className="text-slate-400">Mode: {room?.timePlay} Minutes</p>
            </div>
            <button 
                onClick={handleLeaveRoom}
                className="text-slate-500 hover:text-white transition font-bold uppercase text-sm tracking-widest"
            >
                Leave Room
            </button>
          </div>

          <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-12 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                <div className="text-4xl font-black text-slate-700 italic">VS</div>
            </div>

            {/* Host Side */}
            <div className={`flex flex-col items-center p-8 rounded-3xl transition ${isHost ? 'bg-red-500/5 border-2 border-red-500/20' : 'bg-slate-900/40'}`}>
                <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-3xl font-black mb-4 shadow-lg shadow-red-900/20">
                    {room?.playerHost?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="text-xl font-bold mb-1">{room?.playerHost?.username}</div>
                <div className="text-slate-500 text-sm mb-4">HOST • ELO {room?.playerHost?.elo}</div>
                <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${isHost ? (isReady ? 'bg-green-500 text-black' : 'bg-slate-700 text-slate-400') : (isHost ? 'READY' : 'WAITING')}`}>
                    {isHost ? (isReady ? 'READY' : 'NOT READY') : 'HOST'}
                </div>
            </div>

            {/* Opponent Side */}
            <div className={`flex flex-col items-center p-8 rounded-3xl transition ${!isHost && hasOpponent ? 'bg-blue-500/5 border-2 border-blue-500/20' : 'bg-slate-900/40'}`}>
                {hasOpponent ? (
                    <>
                        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-black mb-4 shadow-lg shadow-blue-900/20">
                            {room?.playerBlack?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-xl font-bold mb-1">{room?.playerBlack?.username}</div>
                        <div className="text-slate-500 text-sm mb-4">GUEST • ELO {room?.playerBlack?.elo}</div>
                        <div className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${!isHost ? (isReady ? 'bg-green-500 text-black' : 'bg-slate-700 text-slate-400') : (opponentReady ? 'bg-green-500 text-black' : 'bg-slate-700 text-slate-400')}`}>
                            {!isHost ? (isReady ? 'READY' : 'NOT READY') : (opponentReady ? 'READY' : 'NOT READY')}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="w-24 h-24 border-4 border-dashed border-slate-700 rounded-full flex items-center justify-center mb-4 animate-pulse">
                            <span className="text-2xl text-slate-700">?</span>
                        </div>
                        <div className="text-slate-600 font-bold">Waiting for opponent...</div>
                    </div>
                )}
            </div>
          </div>

          <div className="p-8 bg-slate-900/50 border-t border-slate-700 flex justify-center gap-4">
              {!isHost && hasOpponent && (
                   <button
                   onClick={toggleReady}
                   className={`px-12 py-4 rounded-2xl font-black transition-all transform hover:-translate-y-1 ${
                     isReady ? 'bg-slate-700 text-slate-400' : 'bg-amber-500 text-black shadow-lg shadow-amber-900/20'
                   }`}
                 >
                   {isReady ? 'UNREADY' : 'READY TO PLAY'}
                 </button>
              )}
              
              {isHost && (
                  <button
                  disabled={!opponentReady}
                  onClick={handleStartGame}
                  className={`px-12 py-4 rounded-2xl font-black transition-all transform hover:-translate-y-1 ${
                    opponentReady ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  START MATCH
                </button>
              )}

              <button 
                  onClick={handleLeaveRoom}
                  className="px-12 py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-slate-400 transition border border-slate-700 h-full"
              >
                  QUIT TO LOBBY
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomWaiting;
