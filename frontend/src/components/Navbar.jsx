import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Trophy, LayoutDashboard, UserCircle, LogOut } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-40">
      <div className="flex items-center space-x-12">
        {/* Logo removed as per user request */}
        
        <div className="flex space-x-8">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex items-center space-x-2 font-bold transition ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <LayoutDashboard size={20} />
            <span>Lobby</span>
          </NavLink>
          <NavLink 
            to="/leaderboard" 
            className={({ isActive }) => `flex items-center space-x-2 font-bold transition ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <Trophy size={20} />
            <span>Leaderboard</span>
          </NavLink>
          <NavLink 
            to={`/profile/${user?.id}`} 
            className={({ isActive }) => `flex items-center space-x-2 font-bold transition ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <UserCircle size={20} />
            <span>Profile</span>
          </NavLink>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">{user?.username}</p>
          <p className="text-xs text-gray-400 font-medium">ELO: {user?.elo}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center space-x-2 bg-gray-50 text-gray-600 px-4 py-2 rounded-xl border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition"
        >
          <LogOut size={18} />
          <span className="font-bold">Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
