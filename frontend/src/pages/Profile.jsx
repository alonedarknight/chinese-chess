import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { User, History, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';

const Profile = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      const [userRes, historyRes] = await Promise.all([
        axiosClient.get(`/users/${userId}`),
        axiosClient.get(`/users/${userId}/history`)
      ]);
      setUserData(userRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Header / Summary Card */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600">
            <User size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{userData?.username || 'Loading...'}</h1>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Competitor Profile</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-6xl font-black text-gray-900">{userData?.elo || '...'}</p>
          <p className="text-gray-400 font-bold uppercase text-xs">Current ELO Rating</p>
        </div>
      </div>

      {/* History Table */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-gray-400">
          <History size={20} />
          <h2 className="font-black uppercase tracking-widest text-sm">Match History</h2>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Time</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Side</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Opponent</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Result</th>
                <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">ELO Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="5" className="px-8 py-10 text-center text-gray-400">Loading history...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="5" className="px-8 py-10 text-center text-gray-400">No matches played yet.</td></tr>
              ) : history.map((entry) => {
                const game = entry.game;
                const isRed = game.gameRoom.playerRed.id === parseInt(userId);
                const opponent = isRed ? game.gameRoom.playerBlack : game.gameRoom.playerRed;
                const isWin = game.winner?.id === parseInt(userId);
                
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 transition">
                    <td className="px-8 py-5">
                      <div className="flex items-center space-x-2 text-gray-600 text-sm font-medium">
                        <Clock size={14} />
                        <span>{formatDate(entry.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${isRed ? 'bg-red-100 text-red-700' : 'bg-gray-800 text-white'}`}>
                        {isRed ? 'Red' : 'Black'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="font-bold text-gray-900">{opponent?.username || 'Unknown'}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`font-black uppercase tracking-widest text-sm ${isWin ? 'text-green-600' : 'text-red-600'}`}>
                        {isWin ? 'Victory' : 'Defeat'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-lg">
                      <div className={`flex items-center justify-end space-x-1 ${entry.changeAmount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {entry.changeAmount >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                        <span>{Math.abs(entry.changeAmount)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Profile;
