import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function LandingPage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen bg-background text-white font-sans flex flex-col items-center">
      
      {/* Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5">
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
          <button className="text-gray-400 hover:text-white transition-colors">
           
          </button>
          <Link to="/login" className="px-5 py-2 text-sm font-medium rounded-md border border-white/10 hover:bg-white/5 transition-colors">
            Sign In
          </Link>
           <Link to="/signup" className="px-5 py-2 text-sm font-medium rounded-md bg-primary text-black hover:bg-primary/90 transition-colors">
            Register
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full max-w-5xl mx-auto px-6 mt-16 flex flex-col items-center text-center">
        
        

        {/* Hero Section */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
          Turn your tasks into a <br />
          <span className="text-primary">character sheet</span>.
        </h1>

        <p className="max-w-2xl text-lg text-gray-400 mb-12 leading-relaxed">
          Real-world discipline converted into immutable attributes. Verified through anti-cheat timer gating, strict server proof, and zero infantalizing gamification tropes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-24">
          <button className="px-8 py-3 bg-primary text-black font-semibold rounded-md flex items-center gap-2 hover:bg-primary/90 transition-colors">
            Enter your Quest <span className="ml-1">→</span>
          </button>
          
        </div>

        

      </main>

    </div>
  );
}

export default LandingPage;
