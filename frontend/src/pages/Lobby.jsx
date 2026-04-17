import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosClient from '../api/axiosClient';

const Lobby = () => {
  const [rooms, setRooms] = useState([]);
  const [lobbyData, setLobbyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [timePlay, setTimePlay] = useState(10);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const navigate = useNavigate();

  useEffect(() => {
    fetchLobbyData();
    fetchRooms();

    const socket = new SockJS('http://localhost:8081/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        client.subscribe('/topic/lobby', (message) => {
          if (message.body === 'REFRESH') {
            fetchRooms();
            fetchLobbyData();
          }
        });
      },
    });
    client.activate();

    return () => client.deactivate();
  }, []);

  const fetchLobbyData = async () => {
    try {
      const response = await axiosClient.get('/lobby');
      setLobbyData(response.data);
    } catch (err) {
      console.error('Failed to fetch lobby data', err);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await axiosClient.get('/rooms');
      setRooms(response.data);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    try {
      const response = await axiosClient.post(`/rooms?hostId=${user.id}&timePlay=${timePlay}`);
      navigate(`/room/${response.data.id}`);
    } catch (err) {
      alert('Failed to create room');
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await axiosClient.post(`/rooms/${roomId}/join?playerId=${user.id}`);
      navigate(`/room/${roomId}`);
    } catch (err) {
      alert('Failed to join room. It might be full.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-amber-500">
              CHINESE CHESS ONLINE
            </h1>
            <p className="text-slate-400 mt-2">
              Welcome, <span className="text-amber-400 font-bold">{user?.username}</span> (ELO: {user?.elo})
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-bold">Total Rooms</div>
              <div className="text-2xl font-mono text-amber-500">{lobbyData?.totalRoom || 0}</div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold transition-all shadow-lg shadow-red-900/40 transform hover:-translate-y-0.5"
            >
              CREATE ROOM
            </button>
            <button
              onClick={handleLogout}
              className="p-3 text-slate-400 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-slate-500">Loading rooms...</div>
          ) : rooms.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-800">
              <div className="text-slate-500 mb-4">No rooms available right now.</div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="text-amber-500 font-bold hover:underline"
              >
                Create the first one!
              </button>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl hover:border-amber-500/50 transition group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Room ID: {room.id}</div>
                    <div className="text-xl font-bold">{room.playerHost.username}'s Match</div>
                  </div>
                  <div className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-black">
                    {room.timePlay} MIN
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <div className="text-slate-400 text-sm">
                            {room.playerBlack ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    {room.playerBlack.username} joined
                                </span>
                            ) : (
                                "Waiting for opponent..."
                            )}
                        </div>
                        <div className={`text-xs font-bold mt-1 uppercase ${room.status === 'PLAYING' ? 'text-amber-500' : 'text-slate-500'}`}>
                            {room.status === 'PLAYING' ? '⚡ Match in progress' : '⏱️ Lobby waiting'}
                        </div>
                    </div>
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={room.playerBlack !== null || room.status === 'PLAYING'}
                    className={`px-6 py-2 font-bold rounded-lg transition-all ${
                        (room.playerBlack !== null || room.status === 'PLAYING') 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
                        : 'bg-amber-500 hover:bg-amber-600 text-black shadow-lg shadow-amber-900/20'
                    }`}
                  >
                    {room.status === 'PLAYING' ? 'IN PROGRESS' : (room.playerBlack ? 'FULL' : 'JOIN')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Room Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 max-w-md w-full">
              <h2 className="text-2xl font-bold mb-6">MATCH CONFIGURATION</h2>
              
              <div className="mb-8">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">Time Control</label>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 30, 60].map(time => (
                    <button
                      key={time}
                      onClick={() => setTimePlay(time)}
                      className={`py-3 rounded-xl font-bold transition ${
                        timePlay === time ? 'bg-amber-500 text-black' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {time} MIN
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-slate-400 font-bold hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleCreateRoom}
                  className="flex-[2] py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold shadow-lg shadow-red-900/20"
                >
                  START WAITING
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
