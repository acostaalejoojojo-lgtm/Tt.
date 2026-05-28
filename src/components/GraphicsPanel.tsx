/**
 * GLIDROVIA — Graphics Panel (Studio only)
 *
 * Lets creators configure quality settings before publishing their game.
 * Players will experience the preset chosen here when playing.
 * Auto-adapt adjusts quality in real time to maintain smooth frame rate.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGraphics, PRESETS, PRESET_LABELS, QualityPreset, GraphicsSettings } from '../lib/graphicsContext';

// ── FPS counter (Three.js side) ───────────────────────────────────────────────
export const FPSCounter: React.FC = () => {
  const { setCurrentFPS } = useGraphics();
  const frames = useRef(0);
  const last = useRef(performance.now());

  useFrame(() => {
    frames.current++;
    const now = performance.now();
    if (now - last.current >= 500) {
      const fps = Math.round((frames.current * 1000) / (now - last.current));
      setCurrentFPS(fps);
      frames.current = 0;
      last.current = now;
    }
  });

  return null;
};

// ── Toggle row ────────────────────────────────────────────────────────────────
const Toggle: React.FC<{
  label: string; sub?: string; value: boolean; onToggle: () => void; color?: string;
}> = ({ label, sub, value, onToggle, color = '#a78bfa' }) => (
  <div className="flex items-center justify-between gap-3 py-1">
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-black tracking-widest text-white">{label}</div>
      {sub && <div className="text-[9px] text-gray-600 leading-tight mt-0.5">{sub}</div>}
    </div>
    <button
      onClick={onToggle}
      className="relative w-8 h-4 rounded-full transition-all flex-shrink-0"
      style={{ background: value ? color : '#333' }}
    >
      <span
        className="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all shadow"
        style={{ left: value ? '17px' : '2px' }}
      />
    </button>
  </div>
);

// ── Main Panel ────────────────────────────────────────────────────────────────
export const GraphicsPanel: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const { settings, setPreset, toggle, currentFPS } = useGraphics();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'presets' | 'luxen' | 'nano' | 'advanced'>('presets');

  if (isPlaying) return null; // panel only visible in studio

  const fpsColor =
    currentFPS >= 50 ? '#4ade80' :
    currentFPS >= 30 ? '#f59e0b' : '#f87171';

  return (
    <div className="absolute top-4 right-4 pointer-events-auto z-10 select-none">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 bg-black/60 border border-white/10 backdrop-blur-xl px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-purple-500/50 transition-all"
        style={{ color: open ? '#a78bfa' : '#fff' }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: fpsColor }} />
        GRÁFICOS · <span style={{ color: fpsColor }}>{currentFPS} FPS</span>
      </button>

      {open && (
        <div className="absolute top-9 right-0 w-80 bg-black/90 border border-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black tracking-widest text-white">MOTOR GRÁFICO</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: PRESET_LABELS[settings.preset].color + '20',
                    color: PRESET_LABELS[settings.preset].color
                  }}
                >
                  {PRESET_LABELS[settings.preset].name}
                </span>
              </div>
            </div>
            <div className="text-[9px] text-gray-500 mt-1">{PRESET_LABELS[settings.preset].desc}</div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {(['presets', 'luxen', 'nano', 'advanced'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest transition-all"
                style={{
                  color: tab === t ? '#a78bfa' : '#555',
                  borderBottom: tab === t ? '2px solid #a78bfa' : '2px solid transparent'
                }}
              >
                {t === 'presets' ? 'CALIDAD' : t === 'luxen' ? 'LUXEN' : t === 'nano' ? 'NANO' : 'AVANZADO'}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">

            {/* ── PRESETS TAB ── */}
            {tab === 'presets' && (
              <div className="space-y-2">
                <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-3">
                  El preset elegido se guarda con el juego. Los jugadores lo usarán al jugar.<br/>
                  El auto-adapt ajusta la calidad si el juego cae de 30fps.
                </div>
                {(['performance', 'balanced', 'ultra', 'luxen'] as QualityPreset[]).map(p => {
                  const info = PRESET_LABELS[p];
                  const active = settings.preset === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setPreset(p)}
                      className="w-full text-left p-3 rounded-xl border transition-all"
                      style={{
                        background: active ? info.color + '15' : '#111',
                        borderColor: active ? info.color + '60' : '#222',
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-black tracking-widest" style={{ color: info.color }}>
                          {info.name}
                        </span>
                        {active && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: info.color + '30', color: info.color }}>
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <div className="text-[9px] text-gray-500">{info.desc}</div>
                    </button>
                  );
                })}

                <div className="pt-2 border-t border-white/10">
                  <Toggle
                    label="AUTO-ADAPT"
                    sub="Baja la calidad automáticamente si baja de 30fps"
                    value={settings.autoAdapt}
                    onToggle={() => toggle('autoAdapt')}
                    color="#4ade80"
                  />
                </div>

                {/* Shadow quality */}
                <div className="pt-1">
                  <div className="text-[10px] font-black tracking-widest text-white mb-2">SOMBRAS</div>
                  <div className="flex gap-1.5">
                    {([512, 1024, 2048, 4096] as const).map(q => (
                      <button
                        key={q}
                        onClick={() => setPreset(settings.preset)} // reapply preset
                        className="flex-1 py-1.5 text-[9px] font-black rounded-lg border transition-all"
                        style={{
                          background: settings.shadowQuality === q ? '#a78bfa20' : '#111',
                          borderColor: settings.shadowQuality === q ? '#a78bfa60' : '#222',
                          color: settings.shadowQuality === q ? '#a78bfa' : '#555'
                        }}
                      >
                        {q === 512 ? 'LOW' : q === 1024 ? 'MED' : q === 2048 ? 'HIGH' : 'MAX'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── LUXEN TAB ── */}
            {tab === 'luxen' && (
              <div className="space-y-1">
                <div className="text-[9px] text-gray-600 mb-3 leading-relaxed">
                  <span className="text-purple-400 font-black">LUXEN</span> — tecnología de iluminación propietaria de Glidrovia.
                  Cada módulo añade una capa de realismo. Actívalos individualmente según tu hardware.
                </div>
                <Toggle label="LUXEN GI" sub="Global Illumination — oclusión ambiental de alta calidad"
                  value={settings.luxenGI} onToggle={() => toggle('luxenGI')} />
                <Toggle label="LUXEN RADIANCE" sub="Bloom selectivo en superficies emisivas"
                  value={settings.luxenRadiance} onToggle={() => toggle('luxenRadiance')} />
                <Toggle label="LUXEN LUMINAS" sub="Rayos de luz volumétrica — god rays solares"
                  value={settings.luxenLuminas} onToggle={() => toggle('luxenLuminas')} />
                <Toggle label="LUXEN AURA" sub="Lens flare cinematográfico"
                  value={settings.luxenAura} onToggle={() => toggle('luxenAura')} />
                <Toggle label="LUXEN CINEMATIC" sub="Profundidad de campo — bokeh"
                  value={settings.luxenCinematic} onToggle={() => toggle('luxenCinematic')} />
                <Toggle label="LUXEN CHROMA" sub="Color grading PBR — saturación, contraste, brillo"
                  value={settings.luxenChroma} onToggle={() => toggle('luxenChroma')} />
                <div className="pt-2 border-t border-white/10">
                  <Toggle label="BLOOM" sub="Resplandor en superficies brillantes"
                    value={settings.bloom} onToggle={() => toggle('bloom')} color="#f59e0b" />
                  <Toggle label="AO (Oclusión Ambiental)" sub="Sombras de contacto suaves"
                    value={settings.ao} onToggle={() => toggle('ao')} color="#f59e0b" />
                </div>
              </div>
            )}

            {/* ── NANO TAB ── */}
            {tab === 'nano' && (
              <div className="space-y-2">
                <div className="text-[9px] text-gray-600 mb-3 leading-relaxed">
                  <span className="text-green-400 font-black">NANO</span> — sistema de geometría adaptativa.
                  Reduce el detalle de objetos lejanos automáticamente para mantener el rendimiento sin que se note visualmente.
                </div>
                <Toggle label="NANO LOD" sub="Nivel de detalle adaptativo por distancia a la cámara"
                  value={settings.nano} onToggle={() => toggle('nano')} color="#4ade80" />

                <div className="mt-3 bg-green-500/5 border border-green-500/20 rounded-xl p-3 space-y-1.5">
                  <div className="text-[10px] font-black text-green-400 tracking-widest">NANO ACTIVO</div>
                  <div className="text-[9px] text-gray-500 space-y-1">
                    <div>· Objetos a &gt;80u — detail ×0.5</div>
                    <div>· Objetos a &gt;160u — ocultos si no son críticos</div>
                    <div>· Sombras dinámicas solo dentro de 50u</div>
                    <div>· Draw calls reducidos ~60% en mapas grandes</div>
                  </div>
                </div>

                <div className="mt-2 bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 space-y-1.5">
                  <div className="text-[10px] font-black text-purple-400 tracking-widest">RESULTADO ESPERADO</div>
                  <div className="text-[9px] text-gray-500 space-y-1">
                    <div>· Mapa pequeño (100 objetos): +15fps</div>
                    <div>· Mapa mediano (500 objetos): +25fps</div>
                    <div>· Mapa grande (1000+ objetos): +40fps</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── ADVANCED TAB ── */}
            {tab === 'advanced' && (
              <div className="space-y-1">
                <div className="text-[9px] text-gray-600 mb-3">Efectos de post-procesado individuales.</div>
                <Toggle label="SMAA" sub="Anti-aliasing de alta calidad"
                  value={settings.smaa} onToggle={() => toggle('smaa')} color="#60a5fa" />
                <Toggle label="VIÑETA" sub="Oscurece los bordes de pantalla"
                  value={settings.vignette} onToggle={() => toggle('vignette')} color="#60a5fa" />
                <Toggle label="GRAIN" sub="Grano de película — realismo cinematográfico"
                  value={settings.noise} onToggle={() => toggle('noise')} color="#60a5fa" />
                <Toggle label="ABERRACIÓN CROMÁTICA" sub="Desplazamiento de colores en bordes"
                  value={settings.chromatic} onToggle={() => toggle('chromatic')} color="#60a5fa" />
                <Toggle label="TONE MAPPING" sub="ACES Filmic — mapeo de tonos HDR"
                  value={settings.toneMapping} onToggle={() => toggle('toneMapping')} color="#60a5fa" />
              </div>
            )}

          </div>

          {/* Footer — live stats */}
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between">
            <div className="text-[9px] text-gray-600">
              PRESET · <span className="text-white font-black">{PRESET_LABELS[settings.preset].name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: fpsColor }} />
              <span className="text-[10px] font-black" style={{ color: fpsColor }}>{currentFPS} FPS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
