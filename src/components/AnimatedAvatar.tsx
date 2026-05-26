import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Text, Float } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarConfig } from '../types';

interface AnimatedAvatarProps {
  config: AvatarConfig;
  name?: string;
  animation?: 'idle' | 'walk' | 'jump' | string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  showNameTag?: boolean;
  emoteSoundUrl?: string; // New: added for sounds
}

// Procedural Block Avatar (The "Noob" style)
const BlockAvatar = ({ config, animation }: { config: AvatarConfig, animation: string }) => {
  const group = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Mesh>(null);
  const rightArm = useRef<THREE.Mesh>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.getElapsedTime();
    
    if (animation === 'walk') {
      const walkSpeed = 10;
      const walkAmount = 0.5;
      if (leftArm.current) leftArm.current.rotation.x = Math.sin(t * walkSpeed) * walkAmount;
      if (rightArm.current) rightArm.current.rotation.x = -Math.sin(t * walkSpeed) * walkAmount;
      if (leftLeg.current) leftLeg.current.rotation.x = -Math.sin(t * walkSpeed) * walkAmount;
      if (rightLeg.current) rightLeg.current.rotation.x = Math.sin(t * walkSpeed) * walkAmount;
    } else {
      // Idle breathing
      group.current.position.y = Math.sin(t * 2) * 0.05;
      if (leftArm.current) leftArm.current.rotation.z = Math.sin(t * 2) * 0.1 + 0.1;
      if (rightArm.current) rightArm.current.rotation.z = -Math.sin(t * 2) * 0.1 - 0.1;
    }
  });

  const colors = config.bodyColors || {
    head: '#F5CD30',
    torso: '#0047AB',
    leftArm: '#F5CD30',
    rightArm: '#F5CD30',
    leftLeg: '#A2C429',
    rightLeg: '#A2C429'
  };

  return (
    <group ref={group}>
      {/* Torso */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 1.2, 0.5]} />
        <meshStandardMaterial color={colors.torso} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#FFFFFF" />
        {/* Simple Face */}
        {!config.hideFace && (
          <group position={[0, 0, 0.41]}>
             {/* Left Eye */}
             <mesh position={[-0.15, 0.1, 0]}>
                <planeGeometry args={[0.08, 0.15]} />
                <meshBasicMaterial color="black" />
             </mesh>
             {/* Right Eye */}
             <mesh position={[0.15, 0.1, 0]}>
                <planeGeometry args={[0.08, 0.15]} />
                <meshBasicMaterial color="black" />
             </mesh>
             {/* Smile */}
             <mesh position={[0, -0.15, 0]}>
                <ringGeometry args={[0.15, 0.2, 32, 1, Math.PI, Math.PI]} />
                <meshBasicMaterial color="black" side={THREE.DoubleSide} />
             </mesh>
          </group>
        )}
      </mesh>
      {/* Left Arm */}
      <mesh ref={leftArm} position={[-0.75, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 1, 0.5]} />
        <meshStandardMaterial color={colors.leftArm} />
      </mesh>
      {/* Right Arm */}
      <mesh ref={rightArm} position={[0.75, 1.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 1, 0.5]} />
        <meshStandardMaterial color={colors.rightArm} />
      </mesh>
      {/* Left Leg */}
      <mesh ref={leftLeg} position={[-0.25, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.7, 0.5]} />
        <meshStandardMaterial color={colors.leftLeg} />
      </mesh>
      {/* Right Leg */}
      <mesh ref={rightLeg} position={[0.25, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.7, 0.5]} />
        <meshStandardMaterial color={colors.rightLeg} />
      </mesh>
    </group>
  );
};

export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({ 
  config, 
  name, 
  animation = 'idle',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  showNameTag = true
}) => {
  const group = useRef<THREE.Group>(null);
  const [modelUrl, setModelUrl] = useState<string>(config.base === 'default' ? 'https://cdn.glidrovia.com/avatars/standard_glidrovia.glb' : config.base);
  
  // Use GLTF loader for the base avatar
  // For this implementation, we use a placeholder logic if URLs are broken
  if (config.base === 'default' || !config.base) {
    return (
      <group position={position} rotation={rotation} scale={scale}>
         <BlockAvatar config={config} animation={animation} />
         {showNameTag && name && (
            <Text
              position={[0, 2.4, 0]}
              fontSize={0.18}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="black"
            >
              {name}
            </Text>
         )}
      </group>
    );
  }

  return (
    <Suspense fallback={<BlockAvatar config={config} animation={animation} />}>
      <ModelRenderer 
        config={config} 
        name={name} 
        animation={animation} 
        position={position} 
        rotation={rotation} 
        scale={scale} 
        showNameTag={showNameTag} 
      />
    </Suspense>
  );
};

const ModelRenderer: React.FC<AnimatedAvatarProps> = ({ 
  config, 
  name, 
  animation = 'idle',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  showNameTag = true,
  emoteSoundUrl
}) => {
  const group = useRef<THREE.Group>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const modelUrl = config.base === 'default' ? 'https://cdn.glidrovia.com/avatars/standard_glidrovia.glb' : config.base;
  
  const { scene, animations: modelAnims } = useGLTF(modelUrl);
  const { actions, names } = useAnimations(modelAnims, group);

  useEffect(() => {
    // 1. MOVING OVERRIDES EMOTES: If we are walking/jumping, priority is movement
    const isMovement = animation === 'walk' || animation === 'jump';
    
    // 2. Play Sound for Emotes/Animations
    if (emoteSoundUrl && !isMovement) {
       if (audioRef.current) {
           audioRef.current.pause();
           audioRef.current.currentTime = 0;
       }
       audioRef.current = new Audio(emoteSoundUrl);
       audioRef.current.play().catch(e => console.warn("Emote sound play failed", e));
    } else if (isMovement && audioRef.current) {
       audioRef.current.pause();
       audioRef.current = null;
    }

    // Stop all current animations logic
    Object.values(actions).forEach(action => {
        if (!action) return;
        // Faster transition for movement
        if (isMovement) action.stop();
        else action.fadeOut(0.3);
    });

    let animToPlay = animation;
    
    // Priority mapping
    if (animation === 'idle' && config.animations?.idle) animToPlay = 'idle';
    if (animation === 'walk' && config.animations?.walk) animToPlay = 'walk';
    if (animation === 'jump' && config.animations?.jump) animToPlay = 'jump';

    if (actions[animToPlay]) {
      actions[animToPlay]?.reset().fadeIn(isMovement ? 0.1 : 0.4).play();
    } else if (names.length > 0) {
      actions[names[0]]?.reset().fadeIn(0.5).play();
    }

    return () => {
      Object.values(actions).forEach(action => action?.fadeOut(0.5));
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
      }
    };
  }, [animation, actions, names, config, emoteSoundUrl]);

  // Apply body colors or textures if the model supports it
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          // Apply basic tint if materials have specific names
          if (mesh.name.toLowerCase().includes('skin') && config.bodyColors?.head) {
            (mesh.material as THREE.MeshStandardMaterial).color.set(config.bodyColors.head);
          }
        }
      });
    }
  }, [scene, config]);

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      <primitive object={scene} />
      
      {showNameTag && name && (
        <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
          <Text
            position={[0, 2.4, 0]}
            fontSize={0.18}
            color="white"
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/robotomonocondensed/v7/L0xeDFM9_th2s8_DnyX_R3Xf.woff"
            outlineWidth={0.02}
            outlineColor="black"
          >
            {name}
          </Text>
        </Float>
      )}
    </group>
  );
};

// Preload standard model
useGLTF.preload('https://cdn.glidrovia.com/avatars/standard_glidrovia.glb');
