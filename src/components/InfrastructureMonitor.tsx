import React from 'react';
import { InfrastructureStatus, ShardInfo } from '../types';
import { Activity, Globe, Zap, Database, Cpu, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { playFab } from '../lib/playfab';
import { peerMesh } from '../lib/p2p';

interface Props {
  status: InfrastructureStatus | null;
  shard: ShardInfo | null;
}

export const InfrastructureMonitor: React.FC<Props> = ({ status, shard }) => {
  if (!status) return null;

  const pfStats = playFab.getInfraHealth();
  const meshStats = peerMesh.getMeshStats();

  return (
    <div className="bg-[#1a1b1e]/80 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-2">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse [animation-delay:200ms]"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse [animation-delay:400ms]"></div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Activity className="text-blue-400" size={18} />
        <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Glidrovia Scaling Engine</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-black/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase mb-1">
            <Globe size={10} /> Malla Activa
          </div>
          <div className="text-xl font-black text-blue-400 tabular-nums">
            {status.activeNodes || 0} NODOS
          </div>
        </div>
        <div className="bg-black/40 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase mb-1">
            <Wifi size={10} className="text-green-500" /> P2P Offload
          </div>
          <div className="text-xl font-black text-green-400 tabular-nums">
            {meshStats.offloadRate}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Carga del Mesh Cluster</span>
          <span className="text-[10px] font-mono text-blue-300">
            {status.totalUsers}/{status.capacity} JUGADORES
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(status.totalUsers / status.capacity) * 100}%` }}
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-[shimmer_2s_infinite]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-white/5">
           <div className="text-[9px] font-mono text-gray-500">
              PLAYFAB_TICKETS: {pfStats.activeTickets} <br/>
              PEERS: {meshStats.peerCount} ACTIVE
           </div>
           <div className="text-[9px] font-mono text-gray-500 text-right">
              LATENCY: {meshStats.edgeLatency} <br/>
              MESH: {meshStats.status}
           </div>
        </div>

        <div className="pt-2 border-t border-white/5 mt-2">
          <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-gray-500 mb-2">
            <span>Shards Activos</span>
            <span className="text-blue-500">{Object.keys(status.shards).length} Nodos Edge</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {Object.entries(status.shards).map(([id, info]) => (
              <div 
                key={id} 
                className={`h-6 rounded flex items-center justify-center text-[8px] font-bold ${id === shard?.shardId ? 'bg-blue-600 text-white border border-blue-400' : 'bg-white/5 text-gray-400'}`}
                title={`${id}: ${info.connections} players`}
              >
                {id}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {shard && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[9px] font-black text-blue-400 uppercase">Nodo Local: {shard.shardId}</span>
              </div>
              <span className="text-[9px] font-bold text-blue-300 italic">400+ Jugadores p/m</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
