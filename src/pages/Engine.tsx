import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows, 
  useGLTF, 
  useAnimations,
  Html,
  Float,
  Text 
} from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Box, 
  Activity, 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Pause, 
  User as UserIcon,
  Monitor,
  Settings,
  Upload,
  ChevronRight,
  Database
} from 'lucide-react';
import { User, Page, AvatarConfig } from '../types';
import { AnimatedAvatar } from '../components/AnimatedAvatar';

interface EngineProps {
  user: User | null;
  onNavigate: (page: Page) => void;
  onUpdateAvatar?: (config: AvatarConfig) => void;
}

const PlayerPrefab = ({ name, config }: { name: string, config: any }) => {
  const group = useRef<THREE.Group>(null);
  // Default cube for the avatar prefab if no model is present
  
  return (
    <group ref={group}>
      {/* Name Tag */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <Text
          position={[0, 2.5, 0]}
          fontSize={0.2}
          color="white"
          font="https://fonts.gstatic.com/s/robotomonocondensed/v7/L0xeDFM9_th2s8_DnyX_R3Xf.woff"
          maxWidth={2}
          textAlign="center"
        >
          {name}
        </Text>
      </Float>

      {/* Basic Avatar Stand-in */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.5, 1, 4, 16]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      
      {/* Visual Direction Indicator */}
      <mesh position={[0, 1.8, 0.4]} castShadow>
        <boxGeometry args={[0.2, 0.2, 0.4]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <gridHelper args={[10, 10, 0x444444, 0x222222]} position={[0, 0, 0]} />
    </group>
  );
};

export const EnginePage: React.FC<EngineProps> = ({ user, onNavigate, onUpdateAvatar }) => {
  const [activeTab, setActiveTab] = useState<'view' | 'animations' | 'inspector' | 'graphics'>('view');
  const [config, setConfig] = useState<AvatarConfig>(user?.avatarConfig || {
    base: 'default',
    animations: { idle: '', walk: '', jump: '' },
    bodyColors: {
      head: '#F5CD30', torso: '#0047AB', leftArm: '#F5CD30',
      rightArm: '#F5CD30', leftLeg: '#A2C429', rightLeg: '#A2C429'
    },
    accessories: { hatModelUrl: null, shirtTextureUrl: null },
    faceTextureUrl: null,
    hideFace: false
  });
  const [animations, setAnimations] = useState<any[]>([
    { id: '1', name: 'Idle Original', type: 'idle', url: '/default_idle.glb' },
    { id: '2', name: 'Walk Standard', type: 'walk', url: '/default_walk.glb' },
    { id: '3', name: 'Jump Basic', type: 'jump', url: '/default_jump.glb' }
  ]);
  const [selectedAnim, setSelectedAnim] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.glb')) {
      const url = URL.createObjectURL(file);
      const newAnim = {
        id: Date.now().toString(),
        name: file.name.replace('.glb', ''),
        type: 'emote',
        url: url
      };
      setAnimations([...animations, newAnim]);
      alert("Animación GLB cargada con éxito al Motor");
    } else {
      alert("Error: Solo se permiten archivos .glb");
    }
  };

  if (!user || user.username !== 'glidrovia') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-10 text-center">
        <div>
          <h1 className="text-4xl font-black mb-4">ACCESO DENEGADO</h1>
          <p className="text-gray-500 max-w-md mx-auto">Esta es la terminal maestra de Glidrovia. Solo el creador oficial puede acceder a estas herramientas de motor.</p>
          <button onClick={() => onNavigate(Page.HOME)} className="mt-8 bg-blue-600 px-6 py-2 rounded-full font-bold">Volver al Inicio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase">Motor del Juego</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none">Cluster v5.5 | Glidrovia Kernel</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onNavigate(Page.HOME)} className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">Volver</button>
          <button className="text-[10px] font-black uppercase tracking-widest bg-blue-600 px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform">Publicar Engine</button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 border-r border-white/5 bg-black/20 flex flex-col p-4 gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('view')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'view' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-lg' : 'hover:bg-white/5 text-gray-500'}`}
          >
            <Monitor size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Vista Previa</span>
          </button>
          <button 
            onClick={() => setActiveTab('animations')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'animations' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-lg' : 'hover:bg-white/5 text-gray-500'}`}
          >
            <Activity size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Animaciones</span>
          </button>
          <button 
            onClick={() => setActiveTab('inspector')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inspector' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-lg' : 'hover:bg-white/5 text-gray-500'}`}
          >
            <UserIcon size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Inspector Prefab</span>
          </button>
          <button 
            onClick={() => setActiveTab('graphics')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'graphics' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-lg' : 'hover:bg-white/5 text-gray-500'}`}
          >
            <Settings size={18} />
            <span className="text-xs font-black uppercase tracking-widest">Gráficos</span>
          </button>

          <div className="mt-auto space-y-4">
             <div className="bg-black/60 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                   <Database size={12} className="text-blue-400" />
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Memory Mesh</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
                   <div className="w-[32%] h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                </div>
                <div className="flex justify-between text-[8px] font-bold text-gray-600 uppercase">
                   <span>3.2 GB</span>
                   <span>12 GB MAX</span>
                </div>
             </div>
          </div>
        </div>

        {/* Main Editor Zone */}
        <div className="flex-1 relative flex flex-col">
          {/* 3D Viewport */}
          <div className="flex-1 bg-[radial-gradient(circle_at_center,#111112,#000000)] relative">
             <Canvas shadows>
                <PerspectiveCamera makeDefault position={[5, 4, 5]} fov={50} />
                <OrbitControls makeDefault />
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} />
                
                <AnimatedAvatar 
                  config={config} 
                  name={user?.displayName || 'Player'} 
                  animation="idle" 
                  scale={2} 
                />

                <gridHelper args={[20, 20, 0x444444, 0x222222]} />
                <Environment preset="city" />
                <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
             </Canvas>

             {/* UI Overlays inside viewport */}
             <div className="absolute top-4 left-4 flex gap-2">
                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest">Rendering: Ultra</span>
                </div>
             </div>

             <div className="absolute bottom-4 right-4">
               <button className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
                 <Box size={20} />
               </button>
             </div>
          </div>

          {/* Bottom Animation Timeline / Sequence Area */}
          <AnimatePresence>
            {activeTab === 'animations' && (
              <motion.div 
                initial={{ y: 300 }}
                animate={{ y: 0 }}
                exit={{ y: 300 }}
                className="h-64 border-t border-white/5 bg-[#0d0d0e] flex flex-col p-6 z-10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xs font-black uppercase tracking-widest">Librería de Animaciones</h3>
                    <div className="flex gap-1">
                      <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">Idle</span>
                      <span className="bg-green-600/20 text-green-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">Walk</span>
                      <span className="bg-red-600/20 text-red-400 px-2 py-0.5 rounded text-[8px] font-black uppercase">Jump</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      accept=".glb" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white/5 p-2 rounded-lg hover:bg-white/10 border border-white/5 transition-all text-xs font-black uppercase flex items-center gap-2 px-4"
                    >
                      <Upload size={14} /> Importar .GLB
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                   {animations.map(anim => (
                     <div 
                       key={anim.id}
                       onClick={() => setSelectedAnim(anim.id)}
                       className={`min-w-[140px] h-32 rounded-2xl border transition-all cursor-pointer p-4 flex flex-col justify-between ${selectedAnim === anim.id ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                     >
                       <div className="flex items-center justify-between">
                          <Activity size={16} className={selectedAnim === anim.id ? 'text-blue-400' : 'text-gray-500'} />
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${anim.type === 'idle' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{anim.type}</span>
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest truncate">{anim.name}</p>
                          <p className="text-[8px] text-gray-500 mt-1">GLIDROVIA ASSET</p>
                       </div>
                       <div className="flex gap-1">
                          <button className="p-1.5 bg-white/5 rounded-md hover:bg-white/10 transition-colors"><Play size={10} /></button>
                          <button className="p-1.5 bg-white/5 rounded-md hover:bg-white/10 transition-colors text-red-400"><Trash2 size={10} /></button>
                       </div>
                     </div>
                   ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Inspector Panel */}
        <div className="w-80 border-l border-white/5 bg-black/40 flex flex-col overflow-y-auto shrink-0 custom-scrollbar">
           {activeTab === 'inspector' ? (
             <div className="p-6">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-gray-500 flex items-center gap-2">
                   <ChevronRight size={14} /> Inspector de Prefab
                </h3>

                <div className="space-y-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Avatar Base</label>
                      <div className="bg-black/60 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600/20 rounded-xl border border-blue-500/30 flex items-center justify-center">
                               <Box size={20} className="text-blue-400" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[10px] font-black uppercase tracking-widest">Standard_Mesh</span>
                               <span className="text-[8px] font-bold text-gray-600 uppercase">12.4k Tris</span>
                            </div>
                         </div>
                         <Plus size={16} className="text-gray-500 cursor-pointer" />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Name Tag Settings</label>
                      <div className="space-y-4">
                         <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-bold text-white/40 uppercase">Texto Display</span>
                            <input type="text" value="[username]" disabled className="bg-black/60 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-blue-400" />
                         </div>
                         <div className="flex flex-col gap-2">
                            <span className="text-[9px] font-bold text-white/40 uppercase">Color de Rango</span>
                            <div className="flex gap-2">
                               <div className="w-6 h-6 rounded-full bg-blue-500 border border-white/20"></div>
                               <div className="w-6 h-6 rounded-full bg-purple-500 border border-white/10 opacity-30"></div>
                               <div className="w-6 h-6 rounded-full bg-red-500 border border-white/10 opacity-30"></div>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Animation Mixers</label>
                      <div className="space-y-2">
                         {[
                           { label: 'Idle State', anim: 'Idle Original' },
                           { label: 'Walking State', anim: 'Walk Standard' },
                           { label: 'Jumping State', anim: 'Jump Basic' }
                         ].map(state => (
                           <div key={state.label} className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{state.label}</span>
                              <div className="flex items-center gap-2">
                                 <span className="text-[9px] font-black text-blue-400">{state.anim}</span>
                                 <ChevronRight size={12} className="text-gray-700" />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                <div 
                  onClick={() => {
                    if (onUpdateAvatar) {
                      onUpdateAvatar(config);
                      alert("Plantilla de Glidrovia guardada con éxito en la cuenta oficial");
                    }
                  }}
                  className="mt-12 bg-blue-600 p-4 rounded-2xl flex items-center justify-center gap-3 cursor-pointer hover:scale-105 transition-transform"
                >
                   <Save size={18} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Guardar Prefab</span>
                </div>
             </div>
           ) : (
             <div className="p-10 text-center text-gray-600">
                <Settings size={40} className="mx-auto mb-4 opacity-10" />
                <p className="text-[10px] font-black uppercase tracking-widest">Selecciona una pestaña para inspeccionar</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
