import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Lobby = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchRooms();
  }, []);

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
      const response = await axiosClient.post(`/rooms?hostId=${user.id}`);
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
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Xiangqi Lobby</h1>
            <p className="text-gray-600">Welcome, {user?.username} (ELO: {user?.elo})</p>
          </div>
          <div className="space-x-4">
            <button
              onClick={handleCreateRoom}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition"
            >
              Create Room
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 uppercase">Room ID</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 uppercase">Host</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-sm font-bold text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">Loading rooms...</td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No rooms available. Create one to start!</td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{room.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{room.playerRed.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        className="text-blue-600 hover:text-blue-900 font-bold"
                      >
                        Join Game
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
