import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { Bell, Search, LogOut, Trash2, Smartphone, Monitor, Target } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Profile() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [attributes, setAttributes] = useState([]);
  const [streakDays, setStreakDays] = useState(Array(12).fill(false)); // Last 12 days

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!session?.user) return;
      
      const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      if (userData) setProfile(userData);

      const { data: attrsData } = await supabase.from('attributes').select('*').eq('user_id', session.user.id);
      if (attrsData) {
        // Sort attributes to match Intellect, Strength, Discipline, Focus
        const order = ['Intellect', 'Strength', 'Discipline', 'Focus'];
        attrsData.sort((a, b) => order.indexOf(a.attribute_name) - order.indexOf(b.attribute_name));
        setAttributes(attrsData);
      }
      
      const { data: tasksData } = await supabase.from('tasks').select('completed_at').eq('user_id', session.user.id).eq('status', 'completed');
      if (tasksData) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const streak = Array(12).fill(false);
        tasksData.forEach(t => {
          if (!t.completed_at) return;
          const d = new Date(t.completed_at);
          d.setHours(0,0,0,0);
          const diffDays = Math.round((today - d) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < 12) {
            streak[11 - diffDays] = true;
          }
        });
        setStreakDays(streak);
      }
    };
    fetchProfileData();
  }, [session]);



  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const getTier = (level) => {
    if (level < 5) return 'Tier I';
    if (level < 10) return 'Tier II';
    if (level < 20) return 'Tier III';
    return 'Tier IV';
  };

  if (!profile) return <div className="min-h-screen bg-[#0b1219] flex items-center justify-center text-white">Loading dossier...</div>;

  const totalAttrLevel = attributes.reduce((acc, curr) => acc + curr.level, 0);
  const userXpNeeded = Math.floor(500 * Math.pow(profile.level, 1.5));
  
  return (
    <div className="min-h-screen bg-[#0b1219] text-white font-sans flex flex-col items-center pb-20">
       <Navbar profile={profile} />

      <main className="w-full max-w-6xl px-6 mt-12">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <div className="text-xs font-mono text-primary mb-2 tracking-widest uppercase">
              // CHARACTER PROFILE • REGISTRY STATUS: IN GOOD STANDING
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Member Dossier & Record</h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-gray-400 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            Last Synced: Day {Math.floor(Date.now() / 86400000) % 365}, {new Date().toISOString().substring(11, 16)} UTC
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Character Profile & Core Attributes */}
          <div className="flex flex-col gap-6">
            
            {/* Identity Card */}
            <div className="bg-[#121b24] p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-20"></div>
              
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl bg-[#0b1219] border border-white/10 p-1 flex-shrink-0">
                  <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} className="w-full h-full rounded-xl object-cover" />
                </div>
                <div className="absolute -bottom-3 -right-3 bg-primary text-black text-xs font-bold px-3 py-1 rounded-lg border-2 border-[#121b24]">
                  LV.{profile.level}
                </div>
              </div>
              
              <div className="flex-grow text-center sm:text-left mt-2 sm:mt-0">
                <div className="flex justify-between items-start w-full">
                  <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">ARCHIVIST CLASS</div>
                  <div className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 hidden sm:block">#{profile.id.substring(0,8)}-REG</div>
                </div>
                <h2 className="text-3xl font-bold mb-1">{profile.display_name}</h2>
                <div className="text-sm text-primary mb-6">Lv. {profile.level} Codex Archivist</div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-auto">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">AFFILIATION</div>
                    <div className="text-xs font-bold text-gray-300">Royal Ledger</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">ENROLLED</div>
                    <div className="text-xs font-bold text-gray-300">Ledger Cycle 741</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Attributes */}
            <div className="bg-[#121b24] p-6 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold uppercase tracking-wider">CORE ATTRIBUTES</h3>
                <span className="text-xs font-mono text-primary">Total XP: {profile.total_xp.toLocaleString()}</span>
              </div>
              
              <div className="flex flex-col gap-6">
                {attributes.map(attr => {
                  const req = Math.floor(100 * Math.pow(attr.level, 1.5));
                  const progress = Math.min(100, (attr.attribute_xp / req) * 100);
                  
                  return (
                    <div key={attr.id} className="group">
                      <div className="flex justify-between items-end mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold uppercase tracking-wider">{attr.attribute_name}</span>
                          <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-400">{getTier(attr.level)}</span>
                        </div>
                        <div className="text-xs font-mono">
                          <span className="text-primary font-bold mr-2">Lv. {attr.level}</span>
                          <span className="text-gray-500">({attr.attribute_xp} / {req} XP)</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>

          {/* Right Column: Security & Danger Zone */}
          <div className="flex flex-col gap-6">

            {/* Danger Zone */}
            <div className="bg-[#121b24] p-6 rounded-2xl border border-red-500/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50"></div>
              
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-red-400 font-bold flex items-center gap-2"><Trash2 size={18} /> Danger Zone</h3>
                <div className="text-[10px] font-mono bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded uppercase tracking-widest">Irreversible</div>
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                  <div>
                    <div className="text-sm font-bold text-gray-200 mb-1">Log Out of Guild Session</div>
                    <div className="text-xs text-gray-500 leading-relaxed max-w-sm">Clears local credentials, encrypted codex cache, and concludes this attendance session.</div>
                  </div>
                  <button onClick={handleLogout} className="flex-shrink-0 bg-transparent hover:bg-white/5 text-gray-300 text-xs font-mono border border-white/20 px-4 py-2 rounded-lg uppercase tracking-wider transition-colors">Log Out</button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-red-400 mb-1">Delete Account</div>
                    <div className="text-xs text-gray-500 leading-relaxed max-w-sm">Permanently expunges this ledger index, along with all accumulated XP, {profile.level} levels of archival progress, uncompleted quests, and active streak metrics. This act cannot be rescinded.</div>
                  </div>
                  <button onClick={() => alert('Account deletion requires guild master approval in current version.')} className="flex-shrink-0 bg-transparent hover:bg-red-500/10 text-red-400 text-xs font-mono border border-red-500/30 hover:border-red-500/50 px-4 py-2 rounded-lg uppercase tracking-wider transition-colors">Revoke Codex</button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 12-Day Active Streak */}
        <div className="w-full bg-[#121b24] p-6 rounded-2xl border border-white/5 mt-6 mb-12">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary"><Target size={12} /></div>
              12-Day Active Streak
            </h3>
            <div className="text-[10px] text-gray-400 font-mono border border-white/10 px-2 py-0.5 rounded">Unbroken</div>
          </div>
          
          <p className="text-xs text-gray-500 mb-8 max-w-md">Daily ledger compliance recorded at guild sanctuary bells. Perfect attendance past 12 cycles.</p>
          
          <div className="flex justify-between items-end gap-2 px-2 overflow-x-auto pb-4">
            {streakDays.map((isActive, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className={`w-8 h-12 sm:w-12 sm:h-16 rounded shadow-lg ${isActive ? 'bg-primary shadow-primary/20 border border-primary/50' : 'bg-white/5 border border-white/10'}`}></div>
                <span className="text-[10px] font-mono text-gray-500">Day {i+1}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-2">
            <div className="text-xs font-mono text-gray-400">Weekly Rate: <span className="text-white font-bold">{Math.round((streakDays.filter(Boolean).length / 12) * 100)}%</span></div>
            <div className="text-xs font-mono text-primary">Record: 28 Days</div>
          </div>
        </div>

      </main>
    </div>
  );
}
