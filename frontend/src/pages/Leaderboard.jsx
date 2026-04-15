import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Medal } from 'lucide-react';

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axiosClient.get('/leaderboard');
      setPlayers(response.data);
    } catch (err) {
      console.error('Failed to fetch leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (index) => {
    if (index === 0) return 'text-yellow-500';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-orange-500';
    return 'text-gray-300';
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans">
      <div className="flex items-center space-x-4 mb-10">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
          <Medal size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Top Players</h1>
          <p className="text-gray-500 font-medium">Seasonal Rankings - Grandmasters</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Rank</th>
              <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest">Player</th>
              <th className="px-8 py-5 text-sm font-bold text-gray-400 uppercase tracking-widest text-right">ELO Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan="3" className="px-8 py-6 bg-gray-50 h-16"></td>
                </tr>
              ))
            ) : players.map((player, index) => (
              <tr 
                key={player.id}
                onClick={() => navigate(`/profile/${player.id}`)}
                className="hover:bg-blue-50 cursor-pointer transition group"
              >
                <td className="px-8 py-6">
                  <span className={`text-xl font-black ${getMedalColor(index)}`}>
                    #{index + 1}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-blue-600 transition">{player.username}</p>
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">{player.status}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <span className="text-lg font-black text-gray-900 group-hover:scale-110 transition inline-block">
                    {player.elo}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
