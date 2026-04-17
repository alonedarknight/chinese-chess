import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import ChessBoard from '../components/ChessBoard';
import axiosClient from '../api/axiosClient';

const Game = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [redTimer, setRedTimer] = useState(0);
    const [blackTimer, setBlackTimer] = useState(0);
    const [gameOver, setGameOver] = useState(null);
    const [drawOffer, setDrawOffer] = useState(null);
    const [showDeclined, setShowDeclined] = useState(false);
    const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
    
    const stompClient = useRef(null);
    const trayRef = useRef(null);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchGameState();
        const socket = new SockJS('http://localhost:8081/ws');
        stompClient.current = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                stompClient.current.subscribe(`/topic/game/${roomId}`, (message) => {
                    try {
                        const data = JSON.parse(message.body);
                        if (data && data.board) {
                            setSession(data);
                            setRedTimer(data.redTimeLeft);
                            setBlackTimer(data.blackTimeLeft);
                        }
                    } catch (e) {
                        // Ignore non-JSON messages (e.g. "REFRESH" strings)
                    }
                });

                stompClient.current.subscribe(`/topic/game/${roomId}/events`, (message) => {
                    const event = JSON.parse(message.body);
                    if (event.gameStatus === 'GAME_OVER') {
                        setGameOver(event);
                        // Update local user state immediately for Header sync
                        if (user && user.id) {
                            const myColor = session?.redPlayerId === user.id ? 'RED' : 'BLACK';
                            const myEloChange = myColor === 'RED' ? event.redEloChange : event.blackEloChange;
                            const updatedUser = { ...user, elo: (user.elo || 1200) + (myEloChange || 0) };
                            localStorage.setItem('user', JSON.stringify(updatedUser));
                        }
                    } else if (event.type === 'DRAW_REQUEST') {
                        if (event.fromPlayerId !== user.id) {
                            setDrawOffer(event);
                        }
                    } else if (event.type === 'DRAW_DECLINED') {
                        setShowDeclined(true);
                        setTimeout(() => setShowDeclined(false), 3000);
                    }
                });
                
                // Also listen to room events for rematch sync
                stompClient.current.subscribe(`/topic/room/${roomId}`, (message) => {
                    if (message.body === 'REFRESH_ROOM') {
                        // Show a notification that opponent is waiting in the lobby
                        const notification = document.createElement('div');
                        notification.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-6 py-3 rounded-xl font-bold z-[100] shadow-2xl animate-bounce';
                        notification.innerText = '⚡ Opponent has returned to the waiting room!';
                        document.body.appendChild(notification);
                        setTimeout(() => notification.remove(), 5000);
                    }
                });

                // Notify server about our presence for disconnect/forfeit handling
                stompClient.current.publish({
                    destination: `/app/room/${roomId}/join-notify`,
                    body: JSON.stringify({ playerId: user.id })
                });
            },
        });
        stompClient.current.activate();

        return () => stompClient.current?.deactivate();
    }, [roomId]);

    const fetchGameState = async () => {
        try {
            const response = await axiosClient.get(`/game/${roomId}/state`);
            if (response.data) {
                setSession(response.data);
                setRedTimer(response.data.redTimeLeft);
                setBlackTimer(response.data.blackTimeLeft);
            }
        } catch (err) {
            console.error('Failed to fetch game state', err);
        }
    };

    // Timer effect
    useEffect(() => {
        if (!session || session.status !== 'PLAYING') return;

        const interval = setInterval(() => {
            if (session.currentTurn === 'RED') {
                setRedTimer(prev => Math.max(0, prev - 1));
            } else {
                setBlackTimer(prev => Math.max(0, prev - 1));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [session]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
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
        if (gameOver || !session) return;

        const board = session.board.grid;
        const clickedPiece = board[y][x];

        if (!selectedPiece) {
            if (clickedPiece && clickedPiece.color === session.currentTurn) {
                // Ensure it's our piece
                const isMyPiece = (session.currentTurn === 'RED' && session.redPlayerId === user.id) ||
                                  (session.currentTurn === 'BLACK' && session.blackPlayerId === user.id);
                if (isMyPiece) {
                    setSelectedPiece({ x, y, piece: clickedPiece });
                    fetchValidMoves(x, y);
                }
            }
        } else {
            if (selectedPiece.x === x && selectedPiece.y === y) {
                setSelectedPiece(null);
                setValidMoves([]);
                return;
            }

            stompClient.current.publish({
                destination: `/app/game/${roomId}/move`,
                body: JSON.stringify({ playerId: user.id, fromX: selectedPiece.x, fromY: selectedPiece.y, toX: x, toY: y }),
            });
            setSelectedPiece(null);
            setValidMoves([]);
        }
    };

    const handleSurrender = () => {
        setShowSurrenderConfirm(true);
    };

    const confirmSurrender = () => {
        stompClient.current.publish({
            destination: `/app/game/${roomId}/surrender`,
            body: JSON.stringify({ playerId: user.id }),
        });
        setShowSurrenderConfirm(false);
    };

    const handleDrawRequest = () => {
        stompClient.current.publish({
            destination: `/app/game/${roomId}/draw-request`,
            body: JSON.stringify({ playerId: user.id }),
        });
    };

    const sendDrawResponse = (accepted) => {
        stompClient.current.publish({
            destination: `/app/game/${roomId}/draw-response`,
            body: JSON.stringify({ accepted }),
        });
        setDrawOffer(null);
    };

    const [isRematching, setIsRematching] = useState(false);
    const handleRematch = async () => {
        if (isRematching) return;
        setIsRematching(true);
        try {
            await axiosClient.post(`/rooms/${roomId}/rematch`);
            // Add a very small delay to ensure backend broadcast is sent
            setTimeout(() => {
                navigate(`/room/${roomId}`);
                setIsRematching(false);
            }, 300);
        } catch (err) {
            console.error('Failed to initiate rematch', err);
            const errorMsg = err.response?.data?.message || 'Room no longer exists or partner left.';
            alert(`KHÔNG THỂ TÁI ĐẤU: ${errorMsg}`);
            navigate('/');
            setIsRematching(false);
        }
    };

    const handleLeaveRoom = async () => {
        try {
            await axiosClient.post(`/rooms/${roomId}/leave?playerId=${user.id}`);
            navigate('/');
        } catch (err) {
            console.error('Failed to leave room', err);
            navigate('/');
        }
    };

    if (!session) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Masterpiece...</div>;

    const myColor = session.redPlayerId === user.id ? 'RED' : 'BLACK';
    const opponentColor = myColor === 'RED' ? 'BLACK' : 'RED';
    const isFlipped = myColor === 'RED'; 
    
    // Assign values for panels
    const myName = myColor === 'RED' ? session.redPlayerName : session.blackPlayerName;
    const myTimeRemaining = myColor === 'RED' ? redTimer : blackTimer;
    
    const opponentName = opponentColor === 'RED' ? session.redPlayerName : session.blackPlayerName;
    const opponentTimeRemaining = opponentColor === 'RED' ? redTimer : blackTimer;

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row p-4 md:p-8 gap-8 items-center justify-center">
            {/* Left Panel: Game Info */}
            <div className="w-full md:w-64 flex flex-col gap-4">
                <div className={`p-4 rounded-3xl bg-slate-900 border-2 transition ${session.currentTurn === opponentColor ? (opponentColor === 'RED' ? 'border-red-500 shadow-lg shadow-red-900/20' : 'border-blue-500 shadow-lg shadow-blue-900/20') : 'border-slate-800'}`}>
                    <div className="text-xs font-black text-slate-500 uppercase mb-2">{opponentColor} Player</div>
                    <div className="text-xl font-bold truncate">{opponentName || "Opponent"}</div>
                    <div className="text-3xl font-mono text-slate-300 mt-2">{formatTime(opponentTimeRemaining)}</div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <button 
                        onClick={handleDrawRequest}
                        className="py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold border border-slate-700 transition"
                    >
                        OFFER DRAW
                    </button>
                    <button 
                        onClick={handleSurrender}
                        className="py-3 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded-xl font-bold border border-red-900/30 transition"
                    >
                        SURRENDER
                    </button>
                    <button 
                        onClick={handleLeaveRoom}
                        className="py-2 text-slate-500 hover:text-white transition text-sm"
                    >
                        QUIT TO LOBBY
                    </button>
                </div>
            </div>

            {/* Center: Board */}
            <div className="relative">
                <div className="absolute -top-12 left-0 right-0 flex justify-between px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>{session.currentTurn === 'RED' ? "Red Path" : "Black Path"}</span>
                    <span>Phòng: {roomId}</span>
                </div>
                
                <div className="bg-amber-900/20 p-4 rounded-[40px] shadow-2xl border-4 border-amber-900/10">
                    <ChessBoard 
                        boardState={session.board.grid} 
                        selectedPiece={selectedPiece} 
                        validMoves={validMoves}
                        isFlipped={isFlipped}
                        onSquareClick={onSquareClick}
                    />
                </div>
            </div>

            {/* Right Panel: Player Status */}
            <div className="w-full md:w-64 flex flex-col gap-4">
                <div className={`p-4 rounded-3xl bg-slate-900 border-2 transition ${session.currentTurn === myColor ? (myColor === 'RED' ? 'border-red-500 shadow-lg shadow-red-900/40' : 'border-blue-500 shadow-lg shadow-blue-900/40') : 'border-slate-800'}`}>
                    <div className="text-xs font-black text-slate-500 uppercase mb-2">{myColor} Player (You)</div>
                    <div className="text-xl font-bold truncate">{myName}</div>
                    <div className="text-3xl font-mono text-amber-500 mt-2">{formatTime(myTimeRemaining)}</div>
                </div>
            </div>

            {/* Draw Offer Modal */}
            {drawOffer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-6">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                        <div className="text-4xl mb-4">🤝</div>
                        <h2 className="text-2xl font-bold mb-2">CẦU HÒA?</h2>
                        <p className="text-slate-400 mb-8">Đối thủ muốn kết thúc ván đấu với kết quả hòa. Bạn có đồng ý?</p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => sendDrawResponse(false)}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold"
                            >
                                TỪ CHỐI
                            </button>
                            <button 
                                onClick={() => sendDrawResponse(true)}
                                className="flex-1 py-3 bg-amber-500 text-black hover:bg-amber-400 rounded-xl font-bold"
                            >
                                ĐỒNG Ý
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Toasts */}
            {showDeclined && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-2xl animate-in slide-in-from-top duration-500 z-[120]">
                    Ối! Đối thủ đã từ chối hòa ⚔️
                </div>
            )}

            {/* Surrender Confirm Modal */}
            {showSurrenderConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-6">
                    <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl">
                        <div className="text-4xl mb-4">🏳️</div>
                        <h2 className="text-2xl font-bold mb-2">ĐẦU HÀNG?</h2>
                        <p className="text-slate-400 mb-8">Bạn có chắc chắn muốn đầu hàng và chấp nhận thất bại?</p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowSurrenderConfirm(false)}
                                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold"
                            >
                                HỦY BỎ
                            </button>
                            <button 
                                onClick={confirmSurrender}
                                className="flex-1 py-3 bg-red-600 text-white hover:bg-red-500 rounded-xl font-bold shadow-lg shadow-red-900/20"
                            >
                                ĐẦU HÀNG
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            {gameOver && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
                    <div className="max-w-md w-full text-center">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl ${
                            (gameOver.result.startsWith(myColor)) ? 'bg-amber-500 shadow-amber-500/40' : 'bg-slate-700 shadow-slate-900/40'
                        }`}>
                             <span className="text-5xl">
                                {gameOver.result.includes('DRAW') ? '🤝' : (gameOver.result.startsWith(myColor) ? '🏆' : '💀')}
                             </span>
                        </div>
                        <h2 className="text-5xl font-black mb-4 italic tracking-tighter">TRẬN ĐẤU KẾT THÚC</h2>
                        <div className="text-3xl font-bold mb-2 uppercase tracking-widest">
                            {gameOver.result.includes('DRAW') ? (
                                <span className="text-slate-400">HÒA NHAU</span>
                            ) : (
                                gameOver.result.startsWith(myColor) ? (
                                    <span className="text-amber-500">BẠN THẮNG</span>
                                ) : (
                                    <span className="text-red-500">BẠN THUA</span>
                                )
                            )}
                        </div>
                        
                        {/* Elo Change Display */}
                        <div className="mb-8 flex items-center justify-center gap-2">
                            <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">ELO RATING</span>
                            <span className={`text-xl font-black ${
                                (myColor === 'RED' ? gameOver.redEloChange : gameOver.blackEloChange) >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                                {(myColor === 'RED' ? gameOver.redEloChange : gameOver.blackEloChange) >= 0 ? '+' : ''}
                                {myColor === 'RED' ? gameOver.redEloChange : gameOver.blackEloChange}
                            </span>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={handleRematch}
                                disabled={isRematching}
                                className={`w-full py-4 font-black rounded-2xl transition transform hover:scale-105 shadow-xl shadow-amber-900/20 ${
                                    isRematching ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-amber-500 text-black hover:bg-amber-400'
                                }`}
                            >
                                {isRematching ? 'ĐANG VỀ PHÒNG...' : 'TÁI ĐẤU / VỀ PHÒNG'}
                            </button>
                            <button 
                                onClick={handleLeaveRoom}
                                className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition"
                            >
                                QUAY VỀ SẢNH
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;
