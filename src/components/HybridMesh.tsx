import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Zap, Wifi, Server, Gauge, Clock, ShieldAlert } from 'lucide-react';

interface PerformanceStats {
  fps: number;
  ping: number;
  mode: 'LAN' | 'CLOUD' | 'MESH';
  latency: number;
}

export const PerformanceOverlay: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats>({ fps: 60, ping: 0, mode: 'CLOUD', latency: 4 });
  const frames = useRef(0);
  const prevTime = useRef(performance.now());

  useEffect(() => {
    const updateStats = () => {
      const time = performance.now();
      frames.current++;

      if (time >= prevTime.current + 1000) {
        const fps = Math.round((frames.current * 1000) / (time - prevTime.current));
        setStats(prev => ({ 
          ...prev, 
          fps, 
          // Simulate dynamic ping based on network state
          ping: prev.mode === 'LAN' ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 15) + 12
        }));
        frames.current = 0;
        prevTime.current = time;
      }
      requestAnimationFrame(updateStats);
    };

    const animId = requestAnimationFrame(updateStats);
    
    // Simulate LAN discovery (Check if peers are on same subnet usually, but here we simulate)
    const checkLAN = () => {
       const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
       setStats(prev => ({ ...prev, mode: isLocal ? 'LAN' : 'MESH' }));
    };
    checkLAN();

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-1 pointer-events-none">
       <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg shadow-2xl">
          <div className="flex flex-col">
             <div className="flex items-center gap-1.5">
                <Gauge size={12} className={stats.fps > 55 ? "text-green-400" : "text-yellow-400"} />
                <span className="text-[10px] font-black font-mono text-white tracking-widest">{stats.fps} FPS</span>
             </div>
             <div className="flex items-center gap-1.5">
                <Activity size={12} className="text-blue-400" />
                <span className="text-[10px] font-black font-mono text-blue-200 tracking-widest">{stats.ping}ms PING</span>
             </div>
          </div>
          <div className="h-6 w-[1px] bg-white/10"></div>
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-1.5">
                {stats.mode === 'LAN' ? <Wifi size={12} className="text-green-400" /> : <Server size={12} className="text-blue-400" />}
                <span className={`text-[10px] font-black uppercase tracking-tighter ${stats.mode === 'LAN' ? 'text-green-400' : 'text-blue-400'}`}>
                  {stats.mode} ACTIVE
                </span>
             </div>
             <span className="text-[8px] text-white/40 font-bold uppercase italic">Syncing via Hyper-Flux v5.5</span>
          </div>
       </div>
    </div>
  );
};

export const QueueOverlay: React.FC<{ position: number; total: number }> = ({ position, total }) => {
  if (position <= 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-xl p-6"
    >
      <div className="max-w-md w-full bg-[#1a1b1e] border border-red-500/30 rounded-3xl p-8 shadow-[0_0_100px_rgba(239,68,68,0.2)] text-center relative overflow-hidden">
        {/* Warning pulse */}
        <div className="absolute inset-0 bg-red-600/5 animate-pulse"></div>

        <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <ShieldAlert size={40} className="text-red-500 animate-bounce" />
        </div>

        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Cluster en Capacidad Máxima</h2>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          La malla global de Glidrovia está experimentando un tráfico sin precedentes. Estás en la fila de espera para entrar a un nodo estable.
        </p>

        <div className="bg-black/40 rounded-2xl p-6 border border-white/5 mb-8">
           <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Tu posición en la fila</div>
           <div className="text-5xl font-black text-white font-mono tracking-tighter">#{position}</div>
           <div className="mt-4 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Procesando malla regional...</span>
           </div>
        </div>

        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">
          Nodos Activos: {total} | Latencia de Malla: 4ms
        </div>
      </div>
    </motion.div>
  );
};
