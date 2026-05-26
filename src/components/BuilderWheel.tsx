import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Box as BoxIcon, 
  Circle as CircleIcon, 
  Triangle as TriangleIcon, 
  Cylinder as CylinderIcon, 
  Square, 
  Type, 
  MousePointer2, 
  Image as ImageIcon,
  Video as VideoIcon,
  Mountain,
  Camera,
  X
} from 'lucide-react';

interface BuilderWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
}

export const BuilderWheel: React.FC<BuilderWheelProps> = ({ isOpen, onClose, onSelect }) => {
  const items = [
    { type: 'Part', icon: BoxIcon, label: 'Bloque', color: '#3b82f6' },
    { type: 'Sphere', icon: CircleIcon, label: 'Esfera', color: '#ef4444' },
    { type: 'Wedge', icon: TriangleIcon, label: 'Cuña', color: '#10b981' },
    { type: 'Cylinder', icon: CylinderIcon, label: 'Cilindro', color: '#f59e0b' },
    { type: 'Canvas', icon: Square, label: 'UI Canvas', color: '#8b5cf6' },
    { type: 'Text', icon: Type, label: 'Texto UI', color: '#ffffff' },
    { type: 'Button', icon: MousePointer2, label: 'Botón UI', color: '#f97316' },
    { type: 'Image', icon: ImageIcon, label: 'Imagen UI', color: '#06b6d4' },
    { type: 'Camera', icon: Camera, label: 'Cámara', color: '#ec4899' },
    { type: 'Terrain', icon: Mountain, label: 'Terreno', color: '#10b981' },
  ];

  const radius = 130;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        className="relative w-96 h-96 flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Background Decor */}
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/10 animate-[spin_30s_linear_infinite]" />
        <div className="absolute inset-4 rounded-full border border-white/5" />

        {/* Center Close */}
        <button 
          onClick={onClose}
          className="z-50 w-20 h-20 bg-[#2b2d31] hover:bg-red-600 rounded-full flex items-center justify-center border-4 border-[#111213] shadow-2xl transition-all group"
        >
          <X size={32} className="text-white group-hover:scale-110 transition-transform" />
        </button>

        {/* Radial Items */}
        {items.map((item, i) => {
          const angle = (i / items.length) * Math.PI * 2 - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={item.type}
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ opacity: 1, x, y }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 200 }}
              className="absolute"
            >
              <button
                onClick={() => {
                  onSelect(item.type);
                  onClose();
                }}
                className="group relative flex flex-col items-center justify-center w-20 h-20 bg-[#2b2d31]/90 hover:bg-blue-600 rounded-2xl border-2 border-white/5 hover:border-white/20 shadow-xl transition-all hover:scale-110 active:scale-90"
              >
                <item.icon size={28} style={{ color: item.color }} className="group-hover:text-white transition-colors" />
                <span className="mt-1 text-[8px] font-black uppercase tracking-tighter text-gray-400 group-hover:text-white">
                  {item.label}
                </span>

                {/* Glow on hover */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity blur-md"
                  style={{ backgroundColor: item.color }}
                />
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
