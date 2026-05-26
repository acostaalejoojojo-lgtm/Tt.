import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Rss, Play, Heart, MessageSquare, Share2, Upload, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface FeedProps {
  user: User | null;
}

export const FeedPage: React.FC<FeedProps> = ({ user }) => {
  const [videos, setVideos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/feed')
      .then(res => res.json())
      .then(setVideos)
      .catch(console.error);
  }, []);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError("El video supera el límite de 20MB permitido.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('userId', user?.uid || 'guest');
    formData.append('username', user?.username || 'Invitado');

    try {
      const res = await fetch('/api/feed/video', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setVideos([data, ...videos]);
      } else {
        setError(data.error || "Error al subir video");
      }
    } catch (err) {
      setError("Error de conexión al servidor mesh");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Rss size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Feed de la Malla</h1>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Sincronizado vía Cloudflare R2 & MUX</p>
            </div>
          </div>

          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-xl font-black uppercase text-xs transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20">
            <Upload size={16} />
            {isUploading ? 'Subiendo...' : 'Subir Video'}
            <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={isUploading} />
          </label>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 mb-6 animate-pulse">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-sm font-bold text-red-500 uppercase italic">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {videos.length === 0 ? (
            <div className="col-span-full border-2 border-dashed border-white/5 rounded-3xl p-20 text-center">
              <p className="text-gray-500 font-black uppercase tracking-widest">No hay videos en la malla todavía</p>
              <p className="text-[10px] text-gray-700 mt-2">Sé el primero en subir un clip de 20MB</p>
            </div>
          ) : (
            videos.map(video => (
              <motion.div 
                key={video.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#1a1b1e] rounded-3xl border border-white/5 overflow-hidden group hover:border-blue-500/30 transition-all shadow-2xl"
              >
                <div className="aspect-video bg-black relative flex items-center justify-center border-b border-white/5">
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                   <video src={video.url} className="w-full h-full object-cover" controls />
                   <div className="absolute bottom-4 left-4 z-20">
                      <p className="text-xs font-black uppercase">{video.username}</p>
                      <p className="text-[8px] text-blue-400 font-bold uppercase">{video.mesh?.mux?.playbackId ? 'Stream Activo' : 'Offline'}</p>
                   </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                   <div className="flex gap-4">
                      <button className="flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <Heart size={18} />
                        <span className="text-xs font-bold">{video.likes}</span>
                      </button>
                      <button className="flex items-center gap-1.5 text-gray-400 hover:text-blue-500 transition-colors">
                        <MessageSquare size={18} />
                        <span className="text-xs font-bold">0</span>
                      </button>
                   </div>
                   <div className="flex items-center gap-2">
                      <Play size={14} className="text-gray-600" />
                      <span className="text-xs font-bold font-mono text-gray-600">{video.views}</span>
                   </div>
                </div>
                <div className="px-4 pb-4">
                   <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                      <div className="flex justify-between text-[8px] font-black text-gray-500 uppercase mb-2">
                         <span>Redundancia Mesh</span>
                         <span className="text-blue-400">Activa</span>
                      </div>
                      <div className="flex gap-1">
                         <div className="h-1 flex-1 bg-blue-500/50 rounded-full"></div>
                         <div className="h-1 flex-1 bg-blue-500/50 rounded-full"></div>
                         <div className="h-1 flex-1 bg-gray-800 rounded-full"></div>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
