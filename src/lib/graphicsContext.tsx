import React, { createContext, useContext, useState, useCallback } from 'react';

export type QualityPreset = 'performance' | 'balanced' | 'ultra' | 'luxen';

export interface GraphicsSettings {
  preset: QualityPreset;
  // Core
  bloom: boolean;
  ao: boolean;
  smaa: boolean;
  toneMapping: boolean;
  // LUXEN modules
  luxenGI: boolean;        // LUXEN GI — enhanced ambient occlusion + irradiance
  luxenRadiance: boolean;  // LUXEN RADIANCE — selective bloom on emissives
  luxenLuminas: boolean;   // LUXEN LUMINAS — volumetric god rays
  luxenAura: boolean;      // LUXEN AURA — lens flare
  luxenCinematic: boolean; // LUXEN CINEMATIC — depth of field
  luxenChroma: boolean;    // LUXEN CHROMA — color grading + hue/saturation
  luxenFocus: boolean;     // LUXEN FOCUS — tilt shift
  // NANO module
  nano: boolean;           // NANO — adaptive LOD + frustum culling
  // Performance
  vignette: boolean;
  noise: boolean;
  chromatic: boolean;
  shadowQuality: 512 | 1024 | 2048 | 4096;
  dpr: [number, number];
  autoAdapt: boolean;
}

export const PRESETS: Record<QualityPreset, GraphicsSettings> = {
  performance: {
    preset: 'performance',
    bloom: false,  ao: false,   smaa: true,  toneMapping: true,
    luxenGI: false, luxenRadiance: false, luxenLuminas: false,
    luxenAura: false, luxenCinematic: false, luxenChroma: false, luxenFocus: false,
    nano: true,
    vignette: false, noise: false, chromatic: false,
    shadowQuality: 512, dpr: [0.5, 1], autoAdapt: true
  },
  balanced: {
    preset: 'balanced',
    bloom: true,   ao: true,    smaa: true,  toneMapping: true,
    luxenGI: false, luxenRadiance: false, luxenLuminas: false,
    luxenAura: false, luxenCinematic: false, luxenChroma: true, luxenFocus: false,
    nano: true,
    vignette: true, noise: true, chromatic: false,
    shadowQuality: 1024, dpr: [1, 1.5], autoAdapt: true
  },
  ultra: {
    preset: 'ultra',
    bloom: true,   ao: true,    smaa: true,  toneMapping: true,
    luxenGI: true,  luxenRadiance: true,  luxenLuminas: false,
    luxenAura: false, luxenCinematic: true, luxenChroma: true, luxenFocus: false,
    nano: true,
    vignette: true, noise: true, chromatic: true,
    shadowQuality: 2048, dpr: [1, 2], autoAdapt: true
  },
  luxen: {
    preset: 'luxen',
    bloom: true,   ao: true,    smaa: true,  toneMapping: true,
    luxenGI: true,  luxenRadiance: true,  luxenLuminas: true,
    luxenAura: true, luxenCinematic: true, luxenChroma: true, luxenFocus: false,
    nano: true,
    vignette: true, noise: true, chromatic: true,
    shadowQuality: 4096, dpr: [1, 2], autoAdapt: true
  }
};

export const PRESET_LABELS: Record<QualityPreset, { name: string; color: string; desc: string }> = {
  performance: { name: 'RENDIMIENTO',  color: '#4ade80', desc: 'Sin efectos · 60fps garantizado' },
  balanced:    { name: 'BALANCEADO',   color: '#60a5fa', desc: 'Bloom · AO · Niebla · 45-60fps' },
  ultra:       { name: 'ULTRA',        color: '#f59e0b', desc: 'LUXEN GI + Radiance + DoF · 30-60fps' },
  luxen:       { name: 'LUXEN MAX',    color: '#a78bfa', desc: 'Todos los módulos · GPU alta gama' }
};

interface GraphicsCtx {
  settings: GraphicsSettings;
  setPreset: (p: QualityPreset) => void;
  toggle: (key: keyof GraphicsSettings) => void;
  setSettings: React.Dispatch<React.SetStateAction<GraphicsSettings>>;
  currentFPS: number;
  setCurrentFPS: (fps: number) => void;
}

export const GraphicsContext = createContext<GraphicsCtx>({
  settings: PRESETS.balanced,
  setPreset: () => {},
  toggle: () => {},
  setSettings: () => {},
  currentFPS: 60,
  setCurrentFPS: () => {}
});

export const GraphicsProvider: React.FC<{
  children: React.ReactNode;
  initial?: QualityPreset;
}> = ({ children, initial = 'balanced' }) => {
  const [settings, setSettings] = useState<GraphicsSettings>(PRESETS[initial]);
  const [currentFPS, setCurrentFPS] = useState(60);

  const setPreset = useCallback((p: QualityPreset) => {
    setSettings(PRESETS[p]);
  }, []);

  const toggle = useCallback((key: keyof GraphicsSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <GraphicsContext.Provider value={{ settings, setPreset, toggle, setSettings, currentFPS, setCurrentFPS }}>
      {children}
    </GraphicsContext.Provider>
  );
};

export const useGraphics = () => useContext(GraphicsContext);
