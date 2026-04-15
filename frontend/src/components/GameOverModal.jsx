import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Home, Frown } from 'lucide-react';

const GameOverModal = ({ winner, currentUserId }) => {
  const navigate = useNavigate();
  const isWinner = (winner === 'RED' && JSON.parse(localStorage.getItem('user')).id === 1 /* Red ID placeholder */) || false; 
  // Note: We'll need better logic for isWinner. For now, we'll just check if winner matches my team.
  
  // Real check:
  const myUser = JSON.parse(localStorage.getItem('user'));
  // This logic depends on which side the user was assigned. 
  // We'll pass result info from the Game page instead.

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-sm w-full transform transition-all scale-100">
        {winner ? (
          <>
            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-yellow-600" />
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-2">Trận đấu kết thúc</h2>
            <p className="text-2xl font-bold text-blue-600 mb-8">
              {winner === 'RED' ? 'Quân ĐỎ Thắng!' : 'Quân ĐEN Thắng!'}
            </p>
          </>
        ) : (
          <>
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Frown className="w-12 h-12 text-gray-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Hòa cờ!</h2>
          </>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center space-x-2 bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition transform hover:-translate-y-1"
        >
          <Home className="w-5 h-5" />
          <span>Quay lại Sảnh</span>
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;
