import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Gamepad2, 
  User as UserIcon, 
  Users, 
  Shirt, 
  Hammer, 
  Settings as SettingsIcon, 
  Terminal,
  X,
  Shield,
  MonitorPlay,
  Zap,
  Rss
} from 'lucide-react';
import { Page, User, getRankInfo } from '../types';

interface CircularMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: User | null;
  t: any;
}

export const CircularMenu: React.FC<CircularMenuProps> = ({ 
  isOpen, 
  onClose, 
  currentPage, 
  onNavigate, 
  user,
  t 
}) => {
  const rankInfo = user ? getRankInfo(user.xp || 0) : null;
  
  const menuItems = [
    { id: Page.HOME, icon: Home, label: t?.home || 'Inicio', color: '#3b82f6' },
    { id: Page.PROFILE, icon: UserIcon, label: t?.profile || 'Perfil', color: '#10b981' },
    { id: Page.GAMES, icon: MonitorPlay, label: t?.experiences || 'Juegos', color: '#f59e0b' },
    { id: Page.AVATAR, icon: Shirt, label: t?.avatar || 'Avatar', color: '#8b5cf6' },
    { id: Page.STUDIO, icon: Hammer, label: t?.create || 'Crear', color: '#ef4444' },
    { id: Page.FEED, icon: Rss, label: 'Feed', color: '#f59e0b' },
    { id: Page.SOCIAL, icon: Users, label: t?.friends || 'Social', color: '#06b6d4' },
    { id: Page.SETTINGS, icon: SettingsIcon, label: t?.settings || 'Ajustes', color: '#6b7280' },
  ];

  if (user?.isAdmin) {
    menuItems.push({ id: Page.DEVELOPER, icon: Terminal, label: 'Admin', color: '#ec4899' });
    menuItems.push({ id: Page.ENGINE, icon: Zap, label: 'Motor', color: '#fbbf24' });
  }

  // Calculate coordinates for circle positioning
  const radius = 140; // distance from center
  const getPosition = (index: number, total: number) => {
    // We arrange them in a semi-circle or full circle
    // Starting from top (12 o'clock)
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md"
          />

          {/* Central Menu Content */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative p-20 pointer-events-auto"
            >
              {/* Outer Glow Ring - The "Wheel" */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-4 rounded-full border-2 border-blue-500/30 border-dashed shadow-[0_0_50px_rgba(37,99,235,0.2)]"
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-full border border-white/5 border-dashed"
              />

              {/* Central Close Button / Logo Area */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-800 shadow-[0_0_80px_rgba(37,99,235,0.6)] border-4 border-white flex items-center justify-center z-10 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_70%)] animate-pulse"></div>
                <X size={40} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
              </motion.button>

              {/* Menu Items arranged in circle */}
              {menuItems.map((item, index) => {
                const pos = getPosition(index, menuItems.length);
                const isActive = currentPage === item.id;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: -360 }}
                    animate={{ 
                      x: pos.x, 
                      y: pos.y, 
                      opacity: 1, 
                      scale: 1,
                      rotate: 0,
                      transition: { 
                        delay: index * 0.04, 
                        type: "spring",
                        stiffness: 150,
                        damping: 12
                      }
                    }}
                    exit={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 360 }}
                    className="absolute left-1/2 top-1/2 -ml-10 -mt-10"
                  >
                    <div className="group relative">
                      <motion.button
                        whileHover={{ scale: 1.2, rotate: 15 }}
                        whileTap={{ scale: 0.8 }}
                        onClick={() => {
                          onNavigate(item.id as Page);
                          onClose();
                        }}
                        style={{ backgroundColor: item.color }}
                        className={`w-20 h-20 rounded-full shadow-xl border-4 border-[#232527] flex items-center justify-center transition-all ${
                          isActive ? 'ring-4 ring-white ring-offset-4 ring-offset-[#232527]' : ''
                        }`}
                      >
                        <item.icon size={28} className="text-white" />
                      </motion.button>
                      
                      {/* Label tooltip */}
                      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded text-black text-[10px] font-black uppercase whitespace-nowrap z-20">
                        {item.label}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* User mini status at bottom of circle */}
              {user && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 200 }}
                  className="fixed left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                >
                   <div className="flex items-center gap-2 bg-[#232527] border border-[#393b3d] px-4 py-2 rounded-full shadow-2xl">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 border border-white/20"></div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{user.displayName}</span>
                        <div className="flex items-center gap-1.5 ">
                          <div className="w-24 h-1.5 bg-black/40 rounded-full border border-white/5 overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${rankInfo?.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-[8px] text-blue-400 font-bold uppercase">{rankInfo?.name}</span>
                        </div>
                      </div>
                   </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
