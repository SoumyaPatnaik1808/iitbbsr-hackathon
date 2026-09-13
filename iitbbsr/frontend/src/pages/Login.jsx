import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Eye, Lock } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else {
      navigate('/dashboard');
    }
    setLoading(false);
  };



  return (
    <div className="min-h-screen bg-background text-white font-sans flex flex-col items-center">
      
      {/* Top Navbar */}
      <nav className="w-full px-8 py-6 flex justify-between items-center border-b border-white/5 bg-[#0b1219]">
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.5 9.5L19.5 4.5" stroke="#4db8ff" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9.5 14.5L4.5 19.5" stroke="#4db8ff" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 2L15 5L19 5L19 9L22 12L19 15L19 19L15 19L12 22L9 19L5 19L5 15L2 12L5 9L5 5L9 5L12 2Z" stroke="#4db8ff" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight">Quest Up</span>
        </div>

        <div className="flex items-center gap-6">
          
          <Link to="/" className="px-4 py-2 text-sm font-medium rounded-md border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 text-gray-300">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full flex flex-col items-center justify-center relative">
        {/* Subtle Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-md bg-card p-10 rounded-2xl border border-white/5 relative z-10 shadow-2xl flex flex-col items-center">
          
          {/* Logo / Icon */}
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.5 9.5L19.5 4.5" stroke="#4db8ff" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9.5 14.5L4.5 19.5" stroke="#4db8ff" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 2L15 5L19 5L19 9L22 12L19 15L19 19L15 19L12 22L9 19L5 19L5 15L2 12L5 9L5 5L9 5L12 2Z" stroke="#4db8ff" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
          <p className="text-gray-400 text-sm mb-8 text-center">Sign in to resume your quests and earn XP</p>

          <form onSubmit={handleLogin} className="w-full flex flex-col gap-5">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Email or Username</label>
              <div className="relative">
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adventurer@questup.gg"
                  className="w-full bg-[#0b1219] border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors text-sm"
                  required
                />
                <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-300">Password</label>
              
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-[#0b1219] border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary transition-colors text-sm font-mono tracking-widest"
                  required
                />
                <Eye size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer hover:text-gray-300" />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? 'Logging in...' : 'Log In'} <span className="font-bold ml-1">→</span>
            </button>
          </form>



          <p className="text-sm text-gray-400">
            Don't have an account? <Link to="/signup" className="text-primary hover:underline">Create one now</Link>
          </p>

        </div>

       

      </main>

      

    </div>
  );
}

export default Login;
