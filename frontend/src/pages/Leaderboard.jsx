import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Leaderboard = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

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

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <button 
                            onClick={() => navigate('/')}
                            className="text-slate-500 hover:text-amber-500 transition font-bold flex items-center gap-2 mb-4"
                        >
                            ← BACK TO LOBBY
                        </button>
                        <h1 className="text-5xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-600">
                            GRANDMASTERS
                        </h1>
                        <p className="text-slate-500 mt-2 uppercase tracking-widest text-xs font-black">Top 20 Global Ranking</p>
                    </div>
                    
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl text-center hidden md:block">
                         <div className="text-xs font-black text-slate-600 uppercase mb-1">Your Rank</div>
                         <div className="text-3xl font-black text-amber-500">#{players.findIndex(p => p.id === user?.id) + 1 || 'N/A'}</div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-2xl">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left bg-slate-800/50">
                                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Rank</th>
                                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest">Player</th>
                                <th className="px-8 py-6 text-xs font-black text-slate-500 uppercase tracking-widest text-right">ELO Rating</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {loading ? (
                                <tr><td colSpan="3" className="px-8 py-20 text-center text-slate-600">Calculating rankings...</td></tr>
                            ) : players.map((p, index) => (
                                <tr 
                                    key={p.id} 
                                    onClick={() => navigate(`/profile/${p.id}`)}
                                    className={`hover:bg-slate-800/50 cursor-pointer transition ${p.id === user?.id ? 'bg-amber-500/5' : ''}`}
                                >
                                    <td className="px-8 py-6">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                                            index === 0 ? 'bg-amber-500 text-black' : 
                                            index === 1 ? 'bg-slate-300 text-black' : 
                                            index === 2 ? 'bg-amber-700 text-white' : 'text-slate-500'
                                        }`}>
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-400">
                                                {p.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className={`font-bold text-lg ${p.id === user?.id ? 'text-amber-500' : 'text-white'}`}>
                                                    {p.username}
                                                </div>
                                                <div className="text-xs text-slate-600 uppercase font-black">Professional</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="text-2xl font-mono font-black text-amber-500 tracking-tighter">
                                            {p.elo}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Leaderboard;
