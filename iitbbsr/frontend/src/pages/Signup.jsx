import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Turnstile } from '@marsidev/react-turnstile';
import { useAuth } from '../AuthContext';

function Signup() {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    
    // In local development, you might not have Turnstile fully enforcing if keys are dummy.
    // Uncomment the check below if you strictly want to block submission without token.
    /*
    if (!captchaToken) {
      alert("Please complete the bot verification.");
      return;
    }
    */

    setLoading(true);
    
    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken,
        data: {
          display_name: fullName,
          username: username,
        }
      },
    });

    if (authError) {
      alert(authError.message);
      setLoading(false);
      return;
    }

    // 2. Call our backend to initialize the user profile (if not using Supabase triggers)
    // The backend route will need the JWT to verify identity
    if (authData.session) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/users/init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.session.access_token}`
          },
          body: JSON.stringify({
            username: username,
            display_name: fullName
          })
        });
        
        if (!response.ok) {
          const errData = await response.json();
          console.error("Backend init error:", errData);
        }
        
        // Navigate directly to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error("Failed to reach backend:", err);
      }
    } else {
      // If session is null, Supabase still requires email confirmation.
      // We will tell them to turn it off, but fallback gracefully if they didn't.
      alert('Signup successful! (Note: If you want instant login, please disable "Confirm email" in your Supabase Auth settings).');
      navigate('/login');
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
          
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow w-full flex flex-col items-center justify-center relative py-12">
        <div className="w-full max-w-md bg-card p-10 rounded-2xl border border-white/5 relative z-10 shadow-2xl flex flex-col items-start">
          
          <h2 className="text-2xl font-bold mb-2">Create your account</h2>
          <p className="text-gray-400 text-sm mb-8">Enter the registrar rolls and begin tracking your attributes.</p>


          <form onSubmit={handleSignup} className="w-full flex flex-col gap-5">
            
            {/* Full Name Field */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alistair Vance"
                className="w-full bg-[#0b1219] border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-primary transition-colors text-sm"
                required
              />
            </div>

            {/* Username Field */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vance_the_scribe"
                className="w-full bg-[#0b1219] border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-primary transition-colors text-sm"
                required
              />
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alistair@guildhall.realm"
                className="w-full bg-[#0b1219] border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-primary transition-colors text-sm"
                required
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Password</label>
                <span className="text-xs text-gray-500">Min. 8 characters</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0b1219] border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-gray-700 focus:outline-none focus:border-primary transition-colors text-sm font-mono tracking-widest"
                required
                minLength={8}
              />
            </div>

            {/* Turnstile Widget - Only rendered if site key exists to avoid layout break in dev */}
            {import.meta.env.VITE_TURNSTILE_SITE_KEY && (
              <div className="w-full flex justify-center mt-2">
                <Turnstile 
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY} 
                  onSuccess={(token) => setCaptchaToken(token)}
                  options={{ theme: 'dark' }}
                />
              </div>
            )}

            {/* Signup Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? 'Registering...' : 'Register User'} <span className="font-bold ml-1">→</span>
            </button>
          </form>

          <div className="w-full text-center mt-6 pt-6 border-t border-white/5">
            <p className="text-sm text-gray-400">
              Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Log in.</Link>
            </p>
          </div>

        </div>

      </main>

    
     
    </div>
  );
}

export default Signup;
