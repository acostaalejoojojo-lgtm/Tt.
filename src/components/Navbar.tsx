import React from 'react';
import { Search, Bell, Settings, Menu, Hammer, Wind, Rss } from 'lucide-react';
import { User, Page } from '../types';

interface NavbarProps {
  user: User;
  onToggleSidebar: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  onNavigate: (page: Page) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onToggleSidebar, onLogout, onSearch, onNavigate }) => {
  return (
    <nav className="sticky top-0 z-50 flex h-[60px] w-full items-center justify-between bg-gradient-to-b from-[#2a2c2e] to-[#232527] border-b border-[#393b3d] px-6 shadow-2xl">
      {/* Left - Logo and Brand */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onNavigate(Page.HOME)}>
           <div className="w-10 h-10 bg-blue-600 rounded-xl border-2 border-white/80 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)] relative group-hover:scale-110 transition-transform">
             <Hammer size={20} className="text-white absolute -top-1.5 -left-1.5 transform -rotate-12 drop-shadow-md" />
             <Wind size={20} className="text-white absolute -bottom-1.5 -right-1.5 transform rotate-12 drop-shadow-md" />
           </div>
           <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white font-sans leading-none uppercase">Glidrovia</span>
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em] italic opacity-80">Universal Mesh</span>
           </div>
        </div>
      </div>

      {/* Center - MAIN MENU BUTTON (The "Rallas" specified as top) */}
      <div className="absolute left-1/2 -translate-x-1/2 top-2">
         <button 
           onClick={onToggleSidebar}
           className="flex flex-col items-center justify-center gap-1 group bg-[#111213] border border-white/10 hover:border-blue-500/50 p-2.5 rounded-2xl transition-all hover:bg-[#1a1b1e] hover:shadow-[0_0_30px_rgba(37,99,235,0.2)]"
         >
           <div className="flex flex-col gap-1 w-6">
              <div className="h-0.5 w-full bg-white rounded-full group-hover:bg-blue-400 transition-colors"></div>
              <div className="h-0.5 w-full bg-white rounded-full group-hover:bg-blue-400 transition-colors"></div>
              <div className="h-0.5 w-full bg-white rounded-full group-hover:bg-blue-400 transition-colors"></div>
           </div>
           <span className="text-[10px] font-black text-gray-500 group-hover:text-blue-400 uppercase tracking-widest mt-1">Menu</span>
         </button>
      </div>

      {/* Right - Profile and Stats */}
      <div className="flex items-center gap-3 md:gap-4">
        <button className="text-white hover:bg-white/10 p-1 rounded-full hidden sm:block">
           <div className="flex items-center gap-1 bg-[#393b3d] px-3 py-1 rounded-full">
              <span className="w-4 h-4 bg-blue-500 rounded-sm rotate-45 flex items-center justify-center text-[8px] font-bold text-white">V</span>
              <span className="text-xs font-bold">{user.robux}</span>
           </div>
        </button>

        <button className="text-white hover:bg-white/10 p-1 rounded-full hidden sm:block" onClick={() => onNavigate(Page.STORE)}>
           <div className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/30 px-3 py-1 rounded-full">
              <span className="text-blue-400 text-[10px] font-black">D</span>
              <span className="text-xs font-bold text-blue-400">{user.drovis || 0}</span>
           </div>
        </button>
        
        <button className="text-white hover:bg-white/10 p-2 rounded-full relative" onClick={() => onNavigate(Page.FEED)}>
          <Rss size={22} />
        </button>
        
        <button className="text-white hover:bg-white/10 p-2 rounded-full relative">
          <Bell size={22} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#232527]"></span>
        </button>
        
        <button 
            onClick={() => onNavigate(Page.SETTINGS)}
            className="text-white hover:bg-white/10 p-2 rounded-full" 
            title="Ajustes"
        >
          <Settings size={22} />
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-white text-xs font-bold hidden lg:block">{user.displayName}</span>
          <div className="w-8 h-8 rounded-full bg-gray-500 overflow-hidden border border-gray-600 cursor-pointer" onClick={() => onNavigate(Page.PROFILE)}>
             {/* Placeholder for user avatar in nav */}
             <div className="w-full h-full bg-gradient-to-tr from-yellow-400 to-yellow-200"></div>
          </div>
          <button 
              onClick={onLogout}
              className="text-xs text-gray-400 hover:text-white font-bold ml-1"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
};