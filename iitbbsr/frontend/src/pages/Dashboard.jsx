import React, { useState, useEffect } from 'react';
import { Bell, Brain, Dumbbell, ShieldCheck, Target, Play, Pause, RotateCcw, CheckSquare, Square, Plus, Trash2, User } from 'lucide-react';

const INITIAL_ATTRIBUTES = [
  { attribute_name: 'Strength', level: 1, attribute_xp: 0 },
  { attribute_name: 'Focus', level: 1, attribute_xp: 0 },
  { attribute_name: 'Intellect', level: 1, attribute_xp: 0 },
  { attribute_name: 'Discipline', level: 1, attribute_xp: 0 }
];

export default function Dashboard() {
  // LocalStorage State
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('questup_profile')) || null);
  const [attributes, setAttributes] = useState(() => JSON.parse(localStorage.getItem('questup_attributes')) || INITIAL_ATTRIBUTES);
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('questup_tasks')) || []);

  // Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAttr, setNewTaskAttr] = useState('Focus');
  const [newTaskDuration, setNewTaskDuration] = useState(25 * 60);

  // Identity Modal State
  const [identityName, setIdentityName] = useState('');
  const [identityUsername, setIdentityUsername] = useState('');

  // Timer State
  const [activeTask, setActiveTask] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // Sync to LocalStorage
  useEffect(() => { if (profile) localStorage.setItem('questup_profile', JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('questup_attributes', JSON.stringify(attributes)); }, [attributes]);
  useEffect(() => { localStorage.setItem('questup_tasks', JSON.stringify(tasks)); }, [tasks]);

  // Timer Effect
  useEffect(() => {
    const running = tasks.find(t => t.status === 'in_progress');
    if (!running) {
      setActiveTask(null);
      setRemainingSeconds(0);
      return;
    }

    setActiveTask(running);
    const interval = setInterval(() => {
      const started = new Date(running.timer_started_at).getTime();
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const remaining = Math.max(0, running.timer_duration - elapsed);
      setRemainingSeconds(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  // Actions
  const handleSaveIdentity = (e) => {
    e.preventDefault();
    if (!identityName.trim() || !identityUsername.trim()) return;
    setProfile({
      display_name: identityName,
      username: identityUsername,
      level: 1,
      total_xp: 0
    });
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!profile) return; // Prevent adding if no profile
    if (!newTaskTitle.trim()) {
      alert("Please enter a quest title.");
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      attribute_type: newTaskAttr,
      timer_duration: newTaskDuration,
      status: 'pending',
      timer_started_at: null
    };
    setTasks([newTask, ...tasks]);
    setNewTaskTitle('');
  };

  const handleStartTask = (taskId) => {
    if (tasks.some(t => t.status === 'in_progress')) {
      alert("You already have an active quest. Complete or abandon it first.");
      return;
    }
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'in_progress', timer_started_at: new Date().toISOString() } : t));
  };

  const handleCancelTask = (taskId) => {
    if (!confirm("Are you sure you want to abandon this quest? Progress will be lost.")) return;
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: 'pending', timer_started_at: null } : t));
  };

  const handleDeleteTask = (taskId) => {
    if (!confirm("Are you sure you want to delete this quest? (Costs 1 XP)")) return;
    setTasks(tasks.filter(t => t.id !== taskId));
    setProfile(p => ({ ...p, total_xp: Math.max(0, p.total_xp - 1) }));
  };

  const handleCompleteTask = (task) => {
    if (task.status === 'completed') return;
    
    const started = new Date(task.timer_started_at).getTime();
    const elapsed = Math.floor((Date.now() - started) / 1000);
    if (elapsed < task.timer_duration) {
      alert(`Timer not finished. ${task.timer_duration - elapsed} seconds remaining!`);
      return;
    }

    // Give XP (1 minute = 0.5XP locally)
    const gainedXp = Math.round((task.timer_duration / 60) * 0.5);

    // Update Profile Leveling
    setProfile(p => {
      let newXp = p.total_xp + gainedXp;
      let newLevel = p.level;
      let threshold = Math.floor(500 * Math.pow(newLevel, 1.5));
      while (newXp >= threshold) {
        newXp -= threshold;
        newLevel += 1;
        threshold = Math.floor(500 * Math.pow(newLevel, 1.5));
      }
      return { ...p, total_xp: newXp, level: newLevel };
    });

    // Update Attribute Leveling
    setAttributes(attrs => attrs.map(a => {
      if (a.attribute_name !== task.attribute_type) return a;
      let newXp = a.attribute_xp + gainedXp;
      let newLevel = a.level;
      let threshold = Math.floor(100 * Math.pow(newLevel, 1.5));
      while (newXp >= threshold) {
        newXp -= threshold;
        newLevel += 1;
        threshold = Math.floor(100 * Math.pow(newLevel, 1.5));
      }
      return { ...a, attribute_xp: newXp, level: newLevel };
    }));

    // Mark completed
    setTasks(tasks.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
  };

  // Helpers
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getAttrIcon = (attr, size=16) => {
    switch(attr) {
      case 'Intellect': return <Brain size={size} className="text-blue-400" />;
      case 'Strength': return <Dumbbell size={size} className="text-red-400" />;
      case 'Discipline': return <ShieldCheck size={size} className="text-green-400" />;
      case 'Focus': return <Target size={size} className="text-purple-400" />;
      default: return <Target size={size} className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-white font-sans flex flex-col relative pb-24">
      
      {/* Identity Modal Overlay */}
      {!profile && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#121b24] p-8 rounded-2xl border border-primary/30 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent"></div>
            <h2 className="text-2xl font-bold mb-2">Initialize Codex</h2>
            <p className="text-gray-400 text-sm mb-6">Establish your identity before beginning your quests.</p>
            <form onSubmit={handleSaveIdentity} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={identityName}
                  onChange={e => setIdentityName(e.target.value)}
                  placeholder="e.g. Alistair Vance"
                  className="w-full bg-[#0b1219] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Username</label>
                <input
                  type="text"
                  value={identityUsername}
                  onChange={e => setIdentityUsername(e.target.value)}
                  placeholder="vance_the_scribe"
                  className="w-full bg-[#0b1219] border border-white/10 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-primary text-black font-bold py-3 rounded-lg mt-4 hover:bg-primary/90 transition-colors">
                Begin Journey
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Navbar (Search removed, Auth removed) */}
      <nav className="w-full px-6 py-4 flex justify-between items-center z-10 border-b border-white/5 bg-[#0b1219]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-black font-bold">Q</div>
            <span className="font-bold text-lg tracking-wide">QuestUp</span>
            <span className="text-xs text-gray-500 ml-2 hidden sm:inline-block border-l border-white/10 pl-2">GLACIER PROTOCOL</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white border border-white/10">
            <Bell size={14} />
          </button>
          {profile && (
            <div className="px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
              <span className="text-xs font-bold text-primary tracking-wide">Lv. {profile.level} {profile.display_name}</span>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-6 mt-8 flex flex-col gap-6">
        
        {/* Top Grid: Player Card & Add Quest */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Add Quest Card */}
          <div className="lg:col-span-2 bg-[#121b24] p-6 rounded-2xl border border-white/5 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-20"></div>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
              <Plus size={16} className="text-primary"/> Define New Quest
            </h2>
            <form onSubmit={handleAddTask} className="flex flex-col h-full gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Directive</label>
                <input 
                  type="text" 
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Complete Advanced System Architecture" 
                  className="bg-[#0b1219] border border-white/10 rounded-lg py-3 px-4 text-white text-sm focus:border-primary focus:outline-none transition-colors w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Attribute Target</label>
                  <div className="relative">
                    <select 
                      value={newTaskAttr}
                      onChange={(e) => setNewTaskAttr(e.target.value)}
                      className="w-full bg-[#0b1219] border border-white/10 rounded-lg py-3 px-4 text-white text-sm appearance-none focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="Focus">Focus</option>
                      <option value="Intellect">Intellect</option>
                      <option value="Strength">Strength</option>
                      <option value="Discipline">Discipline</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      {getAttrIcon(newTaskAttr, 14)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Duration (Timer)</label>
                  <select 
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="w-full bg-[#0b1219] border border-white/10 rounded-lg py-3 px-4 text-white text-sm appearance-none focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value={10}>10 Seconds (Demo)</option>
                    <option value={25 * 60}>25 Minutes (Standard)</option>
                    <option value={45 * 60}>45 Minutes (Deep Work)</option>
                    <option value={90 * 60}>90 Minutes (Flow State)</option>
                  </select>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center">
                <div className="text-xs text-gray-500 font-mono">
                  Reward: <span className="text-primary font-bold">{Math.round((newTaskDuration / 60) * 0.5)} XP</span>
                </div>
                <button type="submit" disabled={!profile} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider py-2 px-6 rounded-md transition-colors disabled:opacity-50">
                  Initialize Quest
                </button>
              </div>
            </form>
          </div>

          {/* Profile Overview Card */}
          {profile && (
            <div className="bg-[#121b24] p-6 rounded-2xl border border-white/5 flex flex-col relative overflow-hidden">
              <div className="absolute -bottom-12 -right-12 text-white/5 pointer-events-none">
                <Target size={160} strokeWidth={1} />
              </div>
              <div className="flex items-center gap-4 mb-8 relative z-10">
                <div className="w-16 h-16 rounded-xl bg-[#0b1219] border border-white/10 p-1">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} alt="Avatar" className="w-full h-full rounded-lg object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{profile.display_name}</h3>
                  <div className="text-xs text-primary font-mono mt-1">LV. {profile.level} • {profile.total_xp} XP</div>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 relative z-10 mt-auto">
                {attributes.map(attr => (
                  <div key={attr.attribute_name} className="flex justify-between items-center bg-[#0b1219] p-3 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center">
                        {getAttrIcon(attr.attribute_name, 12)}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">{attr.attribute_name}</span>
                    </div>
                    <span className="text-xs font-mono text-gray-400">Lv. {attr.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Active Quest Section */}
        {activeTask && (
          <div className="w-full bg-[#121b24] rounded-2xl border border-primary/30 p-1 relative overflow-hidden mt-2">
            <div className="absolute top-0 left-0 h-full bg-primary/10 transition-all duration-1000 ease-linear" 
                 style={{ width: `${((activeTask.timer_duration - remainingSeconds) / activeTask.timer_duration) * 100}%` }}></div>
            
            <div className="bg-[#0b1219] rounded-xl p-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 rounded-full border border-primary/50 flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                  {getAttrIcon(activeTask.attribute_type, 24)}
                </div>
                <div>
                  <div className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">Active Quest Protocol</div>
                  <h2 className="text-lg font-bold">{activeTask.title}</h2>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-4xl font-light tracking-tighter tabular-nums">
                  {formatTime(remainingSeconds)}
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => handleCancelTask(activeTask.id)} className="w-10 h-10 rounded-full border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-colors">
                    <RotateCcw size={16} />
                  </button>
                  {remainingSeconds === 0 ? (
                    <button onClick={() => handleCompleteTask(activeTask)} className="px-6 h-10 rounded-full bg-primary text-black font-bold text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                      Complete
                    </button>
                  ) : (
                    <button disabled className="px-6 h-10 rounded-full bg-white/5 border border-white/10 text-gray-500 font-bold text-sm uppercase tracking-wider cursor-not-allowed">
                      In Progress
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="mt-2">
          <h2 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Quest Log</h2>
          <div className="flex flex-col gap-3">
            {tasks.filter(t => t.status !== 'in_progress').map(task => (
              <div key={task.id} className={`w-full p-4 rounded-xl border flex items-center justify-between ${
                task.status === 'completed' ? 'bg-[#0b1219] border-white/5 opacity-60' : 'bg-[#121b24] border-white/10 hover:border-white/20'
              } transition-colors`}>
                
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                    task.status === 'completed' ? 'bg-primary/5 border-primary/20' : 'bg-[#0b1219] border-white/10'
                  }`}>
                    {task.status === 'completed' ? <CheckSquare size={18} className="text-primary"/> : getAttrIcon(task.attribute_type, 18)}
                  </div>
                  
                  <div className="flex flex-col">
                    <span className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-white'}`}>
                      {task.title}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mt-1">
                      {task.attribute_type} • {task.timer_duration / 60} Min
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {task.status === 'pending' && (
                    <>
                      <button onClick={() => handleDeleteTask(task.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                      <button onClick={() => handleStartTask(task.id)} className="w-10 h-10 rounded-full border border-white/10 hover:bg-primary hover:text-black flex items-center justify-center transition-all disabled:opacity-50" disabled={activeTask !== null}>
                        <Play size={14} className="ml-1" />
                      </button>
                    </>
                  )}
                  {task.status === 'completed' && (
                    <span className="text-[10px] font-bold text-primary border border-primary/20 bg-primary/10 px-2 py-1 rounded uppercase tracking-wider">
                      +{Math.round((task.timer_duration / 60) * 0.5)} XP
                    </span>
                  )}
                </div>

              </div>
            ))}
            {tasks.length === 0 && (
              <div className="w-full p-8 rounded-xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center text-gray-500">
                <Square size={24} className="mb-3 opacity-20" />
                <p className="text-sm">Your quest log is empty.</p>
                <p className="text-xs font-mono mt-1">Define a new directive above.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
