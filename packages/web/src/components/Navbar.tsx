import React, { useState } from 'react';
import { 
  Terminal, 
  Activity, 
  Layers, 
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'landing' | 'dashboard';
  setActiveTab: (tab: 'landing' | 'dashboard') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090d16]/85 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 shadow-glow-orange">
              <Terminal className="w-5 h-5 text-slate-950 font-bold" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">
                  Debug<span className="text-orange-500">Forge</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded-full">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Autonomous AI Debugging Harness
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'landing'
                  ? 'bg-slate-800 text-orange-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Overview
            </button>
            <a
              href="#paradox"
              className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              2026 Paradox
            </a>
            <a
              href="#pipeline"
              className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors flex items-center space-x-1"
            >
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              <span>5-Stage Loop</span>
            </a>
            <a
              href="#simulator"
              className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors flex items-center space-x-1"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Terminal</span>
            </a>
            <a
              href="#comparison"
              className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              Comparison
            </a>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-glow-emerald'
                  : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-500/10'
              }`}
            >
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              <span>Live Triage HUD</span>
            </button>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-mono text-[11px] text-slate-300">Daytona Ready</span>
            </div>

            <a
              href="#install"
              className="inline-flex items-center space-x-2 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-950 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 hover:from-orange-500 hover:to-amber-500 rounded-lg shadow-glow-orange transition-all transform hover:-translate-y-0.5"
            >
              <span>Install CLI</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-slate-900 border-b border-slate-800 space-y-2">
          <button
            onClick={() => { setActiveTab('landing'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded-lg"
          >
            Overview
          </button>
          <a
            href="#paradox"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded-lg"
          >
            2026 Developer Paradox
          </a>
          <a
            href="#pipeline"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded-lg"
          >
            5-Stage ReAct Loop
          </a>
          <a
            href="#simulator"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded-lg"
          >
            Live Terminal Simulator
          </a>
          <a
            href="#comparison"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 rounded-lg"
          >
            Comparison Matrix
          </a>
          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg"
          >
            Live Triage HUD & Telemetry
          </button>
          <div className="pt-2">
            <a
              href="#install"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-semibold text-slate-950 bg-orange-400 hover:bg-orange-500 rounded-lg shadow-glow-orange"
            >
              <span>Install CLI (1-Line)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
