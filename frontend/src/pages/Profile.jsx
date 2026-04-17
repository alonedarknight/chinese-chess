import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const Profile = () => {
    const { userId } = useParams();
    const [history, setHistory] = useState([]);
    const [profileUser, setProfileUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const loggedInUser = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        const targetId = userId || loggedInUser?.id;
        if (!targetId) {
            navigate('/login');
            return;
        }
        fetchProfileData(targetId);
    }, [userId]);

    const fetchProfileData = async (targetId) => {
        setLoading(true);
        try {
            const [userRes, historyRes] = await Promise.all([
                axiosClient.get(`/users/${targetId}`),
                axiosClient.get(`/users/${targetId}/history`)
            ]);
            setProfileUser(userRes.data);
            setHistory(historyRes.data);
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    const stats = history.reduce((acc, current) => {
        acc.total++;
        if (current.result === 'WIN') acc.wins++;
        else if (current.result === 'LOSS') acc.losses++;
        else acc.draws++;
        return acc;
    }, { wins: 0, losses: 0, draws: 0, total: 0 });

    const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-5xl mx-auto">
                <button 
                    onClick={() => navigate('/')}
                    className="text-slate-500 hover:text-amber-500 transition font-bold mb-8 flex items-center gap-2"
                >
                    ← BACK TO LOBBY
                </button>

                {/* Profile Header */}
                <div className="flex flex-col md:flex-row gap-8 items-center mb-12 bg-slate-900/50 p-10 rounded-[40px] border border-slate-800">
                    <div className="w-32 h-32 bg-gradient-to-br from-red-600 to-amber-600 rounded-full flex items-center justify-center text-5xl font-black shadow-2xl shadow-red-900/20">
                        {profileUser?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-4xl font-black mb-2">{profileUser?.username}</h1>
                        <p className="text-slate-500 uppercase tracking-widest text-xs font-black">Professional Xiangqi Player</p>
                        <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                             <div className="bg-slate-800 px-6 py-2 rounded-2xl border border-slate-700">
                                 <span className="text-xs text-slate-500 font-bold block">Current Rating</span>
                                 <span className="text-2xl font-black text-amber-500">{profileUser?.elo} ELO</span>
                             </div>
                             <div className="bg-slate-800 px-6 py-2 rounded-2xl border border-slate-700">
                                 <span className="text-xs text-slate-500 font-bold block">Win Rate</span>
                                 <span className="text-2xl font-black text-green-500">{winRate}%</span>
                             </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                         <div className="text-center">
                             <div className="text-2xl font-black text-white">{stats.wins}</div>
                             <div className="text-[10px] text-green-500 font-black uppercase">Wins</div>
                         </div>
                         <div className="text-center border-l border-slate-800 pl-4">
                             <div className="text-2xl font-black text-white">{stats.losses}</div>
                             <div className="text-[10px] text-red-500 font-black uppercase">Losses</div>
                         </div>
                         <div className="text-center border-l border-slate-800 pl-4">
                             <div className="text-2xl font-black text-white">{stats.draws}</div>
                             <div className="text-[10px] text-slate-500 font-black uppercase">Draws</div>
                         </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-[40px] p-8 shadow-2xl">
                    <h3 className="text-xl font-black mb-8 italic tracking-tighter text-slate-500 uppercase">Recent Matches</h3>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <div className="py-20 text-center text-slate-600 animate-pulse font-bold uppercase tracking-widest text-sm">
                                Loading Grandmaster History...
                            </div>
                        ) : history.length === 0 ? (
                            <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                                <div className="text-4xl mb-4 opacity-20">🏆</div>
                                <div className="text-slate-500 font-bold uppercase tracking-widest text-xs">No matches played yet</div>
                                <button 
                                    onClick={() => navigate('/')}
                                    className="mt-6 px-6 py-2 bg-amber-500 text-black text-xs font-black rounded-full hover:bg-amber-400 transition"
                                >
                                    PLAY NOW
                                </button>
                            </div>
                        ) : (
                            history.map((record) => (
                                <div key={record.id} className="bg-slate-800/30 border border-slate-700/50 p-6 rounded-3xl flex items-center justify-between hover:bg-slate-800/50 transition transform hover:-translate-y-1">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black ${
                                            record.result === 'WIN' ? 'bg-green-500/10 text-green-500' : 
                                            record.result === 'LOSS' ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-slate-500'
                                        }`}>
                                            {record.result}
                                        </div>
                                        <div>
                                            <div className="text-lg font-bold">Xiangqi Match #{record.game?.id || 'N/A'}</div>
                                            <div className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                Played as <span className={record.color === 'RED' ? 'text-red-500' : 'text-slate-200'}>{record.color}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <div className="text-xs text-slate-500 font-bold uppercase mb-1">ELO RATING</div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-600 line-through text-sm">{record.eloBefore}</span>
                                            <span className="text-amber-500 font-black text-xl tracking-tighter">
                                                {record.eloAfter}
                                            </span>
                                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                                record.eloAfter >= record.eloBefore ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                                {record.eloAfter >= record.eloBefore ? '+' : ''}{record.eloAfter - record.eloBefore}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
