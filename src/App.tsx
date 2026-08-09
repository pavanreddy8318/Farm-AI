/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Sprout, Bot, Calendar, Sparkles, HelpCircle, 
  Activity, ArrowRight, ShieldAlert, BookOpen, AlertCircle, RefreshCw, CheckCircle2, Lock,
  Scan, LogIn, LogOut
} from 'lucide-react';
import { clearAuthToken, getAuthToken, setAuthToken } from './auth';
import { firebaseSignInAndPersist, firebaseSignOut, onFirebaseAuthState } from './firebase';
import DiseaseDiagnostics from './components/DiseaseDiagnostics';
import FarmingCalendar from './components/FarmingCalendar';
import AgronomistChat from './components/AgronomistChat';
import WeatherWidget from './components/WeatherWidget';
import NotificationCenter, { NotificationToast } from './components/NotificationCenter';
import YOLOv8Connector from './components/YOLOv8Connector';
import LoginPage from './components/LoginPage';

export default function App() {
  const [activeTab, setActiveTab] = useState<'diagnose' | 'yolo' | 'calendar' | 'chat'>('diagnose');
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);
  const [isCheckingServer, setIsCheckingServer] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'guest' | 'firebase'>('guest');
  const [showLogin, setShowLogin] = useState(() => !getAuthToken());

  const bootstrapGuestSession = async () => {
    if (getAuthToken()) {
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'guest_farmer', password: 'guest_local_hash' })
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data.token) {
        setAuthToken(data.token);
      }
    } catch {
      // Ignore auth bootstrap failures; the guest fallback still works.
    }
  };

  // Check backend server health on mount
  useEffect(() => {
    checkServerHealth();

    const unsubscribe = onFirebaseAuthState((user: any) => {
      setFirebaseUser(user);
      setAuthMode(user ? 'firebase' : 'guest');
      if (user) setShowLogin(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFirebaseLogin = async () => {
    const user = await firebaseSignInAndPersist();
    if (!user) {
      setAuthMode('guest');
      return;
    }

    setFirebaseUser(user);
    setAuthMode('firebase');
    setShowLogin(false);
  };

  const handleFirebaseLogout = async () => {
    await firebaseSignOut();
    clearAuthToken();
    setFirebaseUser(null);
    setAuthMode('guest');
    setShowLogin(true);
  };

  const checkServerHealth = async () => {
    setIsCheckingServer(true);
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setServerHealthy(true);
      } else {
        setServerHealthy(false);
      }
    } catch (err) {
      console.error('Server health check failed:', err);
      setServerHealthy(false);
    } finally {
      setIsCheckingServer(false);
    }
  };

  return (
    <div id="farmai-app" className="min-h-screen bg-editorial-cream text-editorial-dark flex flex-col font-serif antialiased">
      
      {/* Upper Brand / Navigation Header (Masthead Style) */}
      <header id="farmai-header" className="bg-editorial-cream border-b border-editorial-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div id="brand-container" className="flex items-center gap-4">
            <div id="brand-logo" className="w-10 h-10 bg-editorial-forest rounded-sm flex items-center justify-center text-white shadow-xs">
              <Sprout className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h1 id="brand-title" className="font-serif font-bold text-editorial-dark text-2xl tracking-tighter uppercase">
                  FarmAI
                </h1>
                <span id="brand-badge" className="px-2 py-0.5 border border-editorial-dark/15 text-editorial-sage text-[9px] font-sans uppercase tracking-widest">
                  v1.3.0 • Active
                </span>
              </div>
              <p id="brand-tagline" className="text-[10px] uppercase tracking-[0.15em] font-sans text-editorial-sage font-bold mt-0.5">
                AI Companion for Crop Pathology & Growth Planning
              </p>
            </div>
          </div>

          {/* Health status & Notification control */}
          <div id="header-status-flex" className="flex items-center gap-4 flex-wrap justify-center">
            <div id="server-status-card" className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-sans bg-editorial-sand/60 border border-editorial-border px-3 py-1.5 font-semibold text-editorial-sage">
              {isCheckingServer ? (
                <>
                  <RefreshCw className="w-3 h-3 text-editorial-sage animate-spin" />
                  <span>Connecting Node...</span>
                </>
              ) : serverHealthy ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-editorial-forest"></span>
                  <span>Pathology Node: Connected</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>
                  <span className="text-rose-800">Node Offline</span>
                  <button 
                    onClick={checkServerHealth}
                    className="p-1 hover:bg-rose-100/50 rounded text-rose-800 transition-all ml-1"
                    title="Retry connection"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>

            <div id="auth-status-card" className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-sans bg-editorial-sand/60 border border-editorial-border px-3 py-1.5 font-semibold text-editorial-sage">
              {firebaseUser ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                  <span>{firebaseUser.email || 'Firebase user'}</span>
                  <button
                    onClick={handleFirebaseLogout}
                    className="ml-1 flex items-center gap-1 rounded border border-editorial-border px-2 py-0.5 text-[9px] hover:bg-editorial-dark hover:text-white transition-all"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                  <span>{authMode === 'guest' ? 'Guest session' : 'Firebase unavailable'}</span>
                  <button
                    onClick={handleFirebaseLogin}
                    className="ml-1 flex items-center gap-1 rounded border border-editorial-border px-2 py-0.5 text-[9px] hover:bg-editorial-dark hover:text-white transition-all"
                  >
                    <LogIn className="w-3 h-3" />
                    Firebase login
                  </button>
                  <button
                    onClick={() => setShowLogin(true)}
                    className="ml-1 flex items-center gap-1 rounded border border-editorial-border px-2 py-0.5 text-[9px] hover:bg-editorial-dark hover:text-white transition-all"
                  >
                    <Lock className="w-3 h-3" />
                    Login
                  </button>
                </>
              )}
            </div>

            <NotificationCenter />
          </div>

        </div>
      </header>

      {/* Primary Dashboard Area */}
      <main id="farmai-main" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* Main Dashboard Workspace */}
        <div className="space-y-10 animate-fade-in">
          
          {/* Real-time Weather Integration Advisory */}
          <div id="dashboard-weather-section">
            <WeatherWidget />
          </div>

          {/* Navigation Tabs Bar */}
          <div id="dashboard-tabs-container" className="border-b border-editorial-border">
            <nav id="dashboard-tabs" className="flex flex-wrap gap-2 sm:gap-8 -mb-px">
              
              <button
                onClick={() => setActiveTab('diagnose')}
                id="tab-btn-diagnose"
                className={`pb-4 px-1 text-[11px] uppercase tracking-[0.2em] font-sans font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'diagnose'
                    ? 'border-editorial-dark text-editorial-dark'
                    : 'border-transparent text-editorial-dark/50 hover:text-editorial-dark hover:border-editorial-dark/20'
                }`}
              >
                <Activity className="w-4 h-4" /> Disease Diagnostics
              </button>

              <button
                onClick={() => setActiveTab('yolo')}
                id="tab-btn-yolo"
                className={`pb-4 px-1 text-[11px] uppercase tracking-[0.2em] font-sans font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'yolo'
                    ? 'border-editorial-dark text-editorial-dark'
                    : 'border-transparent text-editorial-dark/50 hover:text-editorial-dark hover:border-editorial-dark/20'
                }`}
              >
                <Scan className="w-4 h-4 text-emerald-600" /> YOLOv8 Vision Engine
                <span className="px-1.5 py-0.5 text-[9px] bg-emerald-100 text-emerald-800 rounded font-mono font-normal">Active</span>
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                id="tab-btn-calendar"
                className={`pb-4 px-1 text-[11px] uppercase tracking-[0.2em] font-sans font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'calendar'
                    ? 'border-editorial-dark text-editorial-dark'
                    : 'border-transparent text-editorial-dark/50 hover:text-editorial-dark hover:border-editorial-dark/20'
                }`}
              >
                <Calendar className="w-4 h-4" /> Customized Calendars
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                id="tab-btn-chat"
                className={`pb-4 px-1 text-[11px] uppercase tracking-[0.2em] font-sans font-bold flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === 'chat'
                    ? 'border-editorial-dark text-editorial-dark'
                    : 'border-transparent text-editorial-dark/50 hover:text-editorial-dark hover:border-editorial-dark/20'
                }`}
              >
                <Bot className="w-4 h-4" /> Expert Agronomist Chat
              </button>

            </nav>
          </div>

          {/* Tab Contents Frame */}
          <div id="tab-content-frame" className="transition-all duration-300">
            
            {activeTab === 'diagnose' && (
              <div id="tab-pane-diagnose">
                <DiseaseDiagnostics />
              </div>
            )}

            {activeTab === 'yolo' && (
              <div id="tab-pane-yolo">
                <YOLOv8Connector />
              </div>
            )}

            {activeTab === 'calendar' && (
              <div id="tab-pane-calendar">
                <FarmingCalendar />
              </div>
            )}

            {activeTab === 'chat' && (
              <div id="tab-pane-chat">
                <AgronomistChat />
              </div>
            )}

          </div>
        </div>

      </main>

      <footer id="farmai-footer" className="bg-editorial-sand text-editorial-dark border-t border-editorial-border py-14 font-serif">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-editorial-dark font-serif font-bold text-lg tracking-tight uppercase">
              <Sprout className="w-5 h-5 text-editorial-forest" /> FarmAI Platform
            </div>
            <p className="text-xs text-editorial-dark/70 leading-relaxed max-w-xs">
              Dedicated to equipping farmers, horticulturalists, and backyard growers with premium agrotech pathology guidance and custom multi-crop seasonal calendars powered by Gemini.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-editorial-sage font-sans font-bold text-xs uppercase tracking-widest">Core Insights</h4>
            <ul className="space-y-2 text-xs text-editorial-dark/75">
              <li className="italic">“Inspect lower leaves meticulously for rust nodes.”</li>
              <li className="italic">“Maintain dynamic irrigation patterns during initial bloom.”</li>
              <li className="italic">“Test local NPK and pH values twice per seasonal crop cycle.”</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-editorial-sage font-sans font-bold text-xs uppercase tracking-widest">Botanical Science Source</h4>
            <p className="text-xs text-editorial-dark/70 leading-relaxed">
              Diagnostic indexes and biological suggestions align with verified agricultural extension frameworks, climate-resilient field guidelines, and eco-friendly soil-building practices.
            </p>
            <div className="pt-2 text-[10px] text-editorial-sage/80 font-mono uppercase tracking-wider">
              © 2026 FarmAI Systems 
            </div>
          </div>

        </div>
      </footer>

      {showLogin && (
        <LoginPage onClose={() => { setShowLogin(false); if (!getAuthToken() && !firebaseUser) void bootstrapGuestSession(); }} />
      )}

      <NotificationToast />
    </div>
  );
}
