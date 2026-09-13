import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function Navbar({ profile }) {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const response = await fetch(`${apiUrl}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
            headers: {
              'Authorization': `Bearer ${session?.access_token}`
            }
          });
          const data = await response.json();
          setSearchResults(data || []);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, session]);

  if (!profile) return null; // Wait for profile data

  return (
    <nav className="w-full max-w-6xl px-6 py-4 flex justify-between items-center z-10 border-b border-white/5">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-black font-bold">Q</div>
          <span className="font-bold text-lg tracking-wide">QuestUp</span>
          <span className="text-xs text-gray-500 ml-2 hidden sm:inline-block border-l border-white/10 pl-2">GLACIER PROTOCOL</span>
        </div>
        <div className="hidden md:flex space-x-2 text-sm font-medium">
          <Link to="/dashboard" className="text-gray-400 hover:text-white px-4 py-1.5 transition-colors">Dashboard</Link>
          <div className="relative flex items-center">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-full px-3 py-1.5 ml-2">
              <Search size={14} className="text-gray-400 mr-2" />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none w-32 md:w-48 transition-all"
              />
            </div>
            {searchQuery.trim() && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#121b24] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
                {isSearching ? (
                  <div className="p-3 text-xs text-gray-500 text-center">Searching...</div>
                ) : searchResults.length > 0 ? (
                  <div className="flex flex-col">
                    {searchResults.map(u => (
                      <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0">
                        <img src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold leading-none">{u.display_name}</span>
                          <span className="text-xs text-primary mt-1">@{u.username} • Lvl {u.level}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 text-xs text-gray-500 text-center">No users found</div>
                )}
              </div>
            )}
          </div>
          <a href="#" onClick={(e) => e.preventDefault()} className="text-gray-500 cursor-not-allowed px-4 py-1.5 flex items-center gap-2 transition-colors">
            Stats <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-primary/20">Coming Soon</span>
          </a>
          <Link to="/profile" className="text-gray-400 hover:text-white px-4 py-1.5 transition-colors">Profile</Link>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white border border-white/10">
          <Bell size={14} />
        </button>
        <div className="px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
          <span className="text-xs font-bold text-primary tracking-wide">Lv. {profile.level} {profile.display_name}</span>
        </div>
        <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} alt="Avatar" className="w-8 h-8 rounded-full border border-white/20" />
      </div>
    </nav>
  );
}
