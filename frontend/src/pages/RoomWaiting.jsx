import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const RoomWaiting = () => {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axiosClient.get(`/rooms`);
        // Note: Our GET /api/rooms only returns WAITING rooms.
        // We might need a specific GET /api/rooms/{id} to check status.
        // For now, I'll implement a workaround by checking if the room is still in the list.
        const currentRooms = response.data;
        const targetRoom = currentRooms.find(r => r.id === parseInt(roomId));
        
        if (!targetRoom) {
          // If room is no longer WAITING, it might be PLAYING or deleted.
          // Let's assume it started.
          navigate(`/game/${roomId}`);
        } else {
          setRoom(targetRoom);
        }
      } catch (err) {
        console.error('Error polling room status', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [roomId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">
      <div className="bg-white p-10 rounded-2xl shadow-2xl text-center max-w-md w-full border border-gray-100">
        <div className="mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Room #{roomId}</h2>
          <p className="text-gray-500 font-medium">Waiting for opponent to join...</p>
        </div>
        
        <div className="bg-gray-50 rounded-xl p-4 mb-8">
          <p className="text-sm text-gray-600 mb-1">Host</p>
          <p className="text-lg font-bold text-gray-800">{room?.playerRed?.username || 'Loading...'}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2 text-blue-600 bg-blue-50 py-3 rounded-xl">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-200"></div>
            <span className="font-semibold ml-2">Searching...</span>
          </div>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3 text-gray-600 font-bold hover:text-red-500 transition duration-200"
          >
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomWaiting;
