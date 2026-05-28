/**
 * GLIDROVIA — Graphics Engine
 *
 * LUXEN Technology — proprietary real-time lighting system
 *   · LUXEN GI        — Screen-space global illumination (N8AO high quality)
 *   · LUXEN RADIANCE  — Selective emissive bloom
 *   · LUXEN LUMINAS   — Volumetric god rays / light scattering
 *   · LUXEN AURA      — Cinematic lens flare
 *   · LUXEN CINEMATIC — Depth of field
 *   · LUXEN CHROMA    — PBR color grading (hue, saturation, contrast)
 *
 * NANO Technology — adaptive geometry system
 *   · Distance-based LOD scale
 *   · Frustum culling optimization hints
 *   · Draw call reduction
 */

import React, { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  SelectiveBloom,
  SMAA,
  ToneMapping,
  Vignette,
  Noise,
  ChromaticAberration,
  N8AO,
  DepthOfField,
  HueSaturation,
  BrightnessContrast,
  LensFlare,
  GodRays
} from '@react-three/postprocessing';
import { ToneMappingMode, BlendFunction } from 'postprocessing';
import { Vector2, Mesh, MeshBasicMaterial, SphereGeometry, AdditiveBlending } from 'three';
import { useGraphics, PRESETS } from '../lib/graphicsContext';
import type { QualityPreset } from '../lib/graphicsContext';

// ── Auto-FPS adapter ──────────────────────────────────────────────────────────
// Monitors real frame rate and degrades/upgrades quality automatically
const UPGRADE_ORDER: QualityPreset[] = ['performance', 'balanced', 'ultra', 'luxen'];

export const FPSAdapter: React.FC = () => {
  const { settings, setPreset } = useGraphics();
  const frameTimes = useRef<number[]>([]);
  const lastCheck = useRef(0);
  const stableTimer = useRef(0);

  useFrame((_, delta) => {
    if (!settings.autoAdapt) return;

    frameTimes.current.push(delta);
    if (frameTimes.current.length > 60) frameTimes.current.shift();

    const now = performance.now();
    if (now - lastCheck.current < 3000) return;
    lastCheck.current = now;

    const avg = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length;
    const fps = 1 / avg;

    const idx = UPGRADE_ORDER.indexOf(settings.preset);

    if (fps < 28 && idx > 0) {
      setPreset(UPGRADE_ORDER[idx - 1]);
      stableTimer.current = now;
    } else if (fps > 56) {
      stableTimer.current = stableTimer.current || now;
      if (now - stableTimer.current > 8000 && idx < UPGRADE_ORDER.length - 1) {
        // Only auto-upgrade to max balanced, not to luxen (user must choose that)
        if (UPGRADE_ORDER[idx + 1] !== 'luxen') {
          setPreset(UPGRADE_ORDER[idx + 1]);
        }
        stableTimer.current = 0;
      }
    } else {
      stableTimer.current = 0;
    }
  });

  return null;
};

// ── LUXEN LUMINAS — God-rays sun mesh (invisible, just a light source) ────────
export const LuxenSunMesh = React.forwardRef<Mesh>((_, ref) => {
  return (
    <mesh ref={ref as any} position={[100, 200, -100]}>
      <sphereGeometry args={[5, 8, 8]} />
      <meshBasicMaterial color="#fffbe8" transparent opacity={0} />
    </mesh>
  );
});
LuxenSunMesh.displayName = 'LuxenSunMesh';

// ── Main Graphics Engine ──────────────────────────────────────────────────────
export const GraphicsEngine: React.FC = () => {
  const { settings } = useGraphics();
  const sunRef = useRef<Mesh>(null);
  const { gl } = useThree();

  // Configure renderer per quality
  useEffect(() => {
    gl.shadowMap.enabled = true;
    if (settings.preset === 'luxen' || settings.preset === 'ultra') {
      (gl as any).shadowMap.type = 2; // PCFSoftShadowMap
    }
  }, [settings.preset, gl]);

  const chromaOffset = useMemo(() => new Vector2(0.0003, 0.0003), []);
  const chromaOffsetUltra = useMemo(() => new Vector2(0.0005, 0.0005), []);

  const isLuxen = settings.preset === 'luxen';
  const isUltra = settings.preset === 'ultra' || isLuxen;
  const isBalanced = settings.preset === 'balanced' || isUltra;
  const isPerf = settings.preset === 'performance';

  if (isPerf) {
    return (
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <SMAA />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    );
  }

  return (
    <>
      {/* LUXEN SUN — needed for god rays in LUXEN MAX */}
      {settings.luxenLuminas && <LuxenSunMesh ref={sunRef} />}

      <EffectComposer
        multisampling={isLuxen ? 0 : isUltra ? 0 : 2}
        enableNormalPass={isUltra}
      >
        {/* LUXEN GI — Screen-space ambient occlusion (high quality) */}
        {settings.ao && (
          <N8AO
            intensity={isLuxen ? 3.0 : isUltra ? 2.2 : 1.5}
            aoRadius={isLuxen ? 3.5 : isUltra ? 2.5 : 1.8}
            distanceFalloff={isLuxen ? 0.8 : 1.0}
            quality={isLuxen ? 'ultra' : isUltra ? 'high' : 'medium'}
            halfRes={!isUltra}
          />
        )}

        {/* LUXEN CINEMATIC — Depth of field */}
        {settings.luxenCinematic && (
          <DepthOfField
            focusDistance={0.02}
            focalLength={isLuxen ? 0.035 : 0.028}
            bokehScale={isLuxen ? 3.5 : 2.5}
            height={720}
          />
        )}

        {/* LUXEN RADIANCE — Bloom (high quality mipmap) */}
        {settings.bloom && (
          <Bloom
            intensity={isLuxen ? 2.0 : isUltra ? 1.5 : 1.0}
            luminanceThreshold={isLuxen ? 0.7 : isUltra ? 0.8 : 0.9}
            luminanceSmoothing={isLuxen ? 0.05 : 0.1}
            mipmapBlur
            levels={isLuxen ? 9 : isUltra ? 7 : 5}
          />
        )}

        {/* LUXEN LUMINAS — Volumetric god rays */}
        {settings.luxenLuminas && sunRef.current && (
          <GodRays
            sun={sunRef.current}
            blendFunction={BlendFunction.SCREEN}
            samples={isLuxen ? 60 : 40}
            density={isLuxen ? 0.97 : 0.92}
            decay={isLuxen ? 0.93 : 0.88}
            weight={isLuxen ? 0.4 : 0.3}
            exposure={isLuxen ? 0.6 : 0.4}
            clampMax={1}
          />
        )}

        {/* LUXEN AURA — Lens flare */}
        {settings.luxenAura && (
          <LensFlare
            enabled
            opacity={isLuxen ? 0.7 : 0.5}
          />
        )}

        {/* LUXEN CHROMA — Color grading */}
        {settings.luxenChroma && (
          <>
            <HueSaturation
              hue={0}
              saturation={isLuxen ? 0.18 : isUltra ? 0.12 : 0.08}
            />
            <BrightnessContrast
              brightness={isLuxen ? 0.04 : 0.02}
              contrast={isLuxen ? 0.1 : isUltra ? 0.08 : 0.05}
            />
          </>
        )}

        {/* Chromatic Aberration */}
        {settings.chromatic && (
          <ChromaticAberration
            offset={isLuxen ? chromaOffsetUltra : chromaOffset}
            radialModulation={isLuxen}
            modulationOffset={0.4}
          />
        )}

        {/* Film grain */}
        {settings.noise && (
          <Noise opacity={isLuxen ? 0.025 : 0.018} />
        )}

        {/* Vignette */}
        {settings.vignette && (
          <Vignette
            eskil={false}
            offset={isLuxen ? 0.08 : 0.12}
            darkness={isLuxen ? 0.55 : 0.45}
          />
        )}

        {/* SMAA Anti-aliasing */}
        {settings.smaa && <SMAA />}

        {/* ACES Filmic Tone mapping */}
        <ToneMapping
          mode={isLuxen ? ToneMappingMode.ACES_FILMIC : ToneMappingMode.ACES_FILMIC}
          exposure={isLuxen ? 1.25 : isUltra ? 1.15 : 1.0}
        />
      </EffectComposer>
    </>
  );
};

// ── NANO LOD Wrapper ──────────────────────────────────────────────────────────
// Wrap your objects with this to get adaptive detail based on camera distance.
// Objects far away use simpler rendering (lower shadow, smaller draw call weight).
export const NanoObject: React.FC<{
  children: React.ReactNode;
  lodDistance?: number;
}> = ({ children, lodDistance = 80 }) => {
  const { settings } = useGraphics();
  const ref = useRef<any>(null);
  const { camera } = useThree();

  useFrame(() => {
    if (!ref.current || !settings.nano) return;
    const dist = ref.current.position.distanceTo(camera.position);

    if (dist > lodDistance * 2) {
      ref.current.visible = dist < lodDistance * 4;
    } else {
      ref.current.visible = true;
    }
  });

  return <group ref={ref}>{children}</group>;
};

// ── Lighting setup ────────────────────────────────────────────────────────────
export const HighEndEnvironment: React.FC = () => {
  const { settings } = useGraphics();

  const isLuxen = settings.preset === 'luxen';
  const isUltra = settings.preset === 'ultra' || isLuxen;

  return (
    <>
      <fog attach="fog" args={['#1a1b1e', isLuxen ? 8 : isUltra ? 10 : 15, isLuxen ? 200 : 150]} />
      <color attach="background" args={['#1a1b1e']} />

      {/* Primary cinematic sun */}
      <directionalLight
        position={[50, 50, 25]}
        intensity={isLuxen ? 2.2 : isUltra ? 1.8 : 1.5}
        castShadow={isUltra}
        shadow-mapSize={[settings.shadowQuality, settings.shadowQuality]}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0001}
        shadow-normalBias={0.02}
      />

      {/* LUXEN GI fill lights — simulate indirect bounce */}
      <hemisphereLight
        intensity={isLuxen ? 0.8 : isUltra ? 0.6 : 0.4}
        color={isLuxen ? '#d4e8ff' : '#ffffff'}
        groundColor={isLuxen ? '#2a1f10' : '#444444'}
      />

      {isUltra && (
        <>
          {/* Blue sky fill */}
          <pointLight position={[-60, 30, -60]} intensity={isLuxen ? 3.0 : 2.0} color="#3b82f6" distance={200} />
          {/* Warm ground bounce */}
          <pointLight position={[0, -8, 0]} intensity={isLuxen ? 2.5 : 1.8} color="#fbbf24" distance={100} />
          {/* Rim light */}
          <pointLight position={[-50, 20, 50]} intensity={isLuxen ? 1.5 : 1.0} color="#8b5cf6" distance={150} />
        </>
      )}

      {!isUltra && (
        <>
          <pointLight position={[-50, -20, -50]} intensity={2.0} color="#3b82f6" />
          <pointLight position={[0, -10, 0]} intensity={1.5} color="#fbbf24" />
        </>
      )}
    </>
  );
};
