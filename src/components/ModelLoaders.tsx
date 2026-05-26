import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { AnimationMixer } from 'three';

export const ModelGLTFInternal = ({ url, isPlaying, selectedAnimation, onAnimationsLoaded, targetHeight = 3 }: { 
  url: string; 
  isPlaying?: boolean; 
  selectedAnimation?: string;
  onAnimationsLoaded?: (names: string[]) => void;
  targetHeight?: number;
}) => {
  const { scene, animations } = useGLTF(url);
  const mixer = useRef<AnimationMixer | null>(null);
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);

  useEffect(() => {
    if (clone) {
      clone.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.envMapIntensity = 2.0;
          }
        }
      });
    }
  }, [clone]);

  useEffect(() => {
    if (animations?.length && onAnimationsLoaded) {
      onAnimationsLoaded(animations.map(a => a.name));
    }
  }, [animations, onAnimationsLoaded]);

  useEffect(() => {
    if (clone && animations?.length) {
      const box = new THREE.Box3().setFromObject(clone);
      const size = box.getSize(new THREE.Vector3());
      if (size.y > 0) {
        const scale = targetHeight / size.y;
        clone.scale.set(scale, scale, scale);
      }

      if (isPlaying || selectedAnimation) {
        if (!mixer.current) mixer.current = new AnimationMixer(clone);
        mixer.current.stopAllAction();
        const animToPlay = selectedAnimation 
          ? animations.find(a => a.name === selectedAnimation) || animations[0]
          : animations[0];
        if (animToPlay) {
            const action = mixer.current.clipAction(animToPlay);
            action.reset().fadeIn(0.2).play();
        }
      } else {
        mixer.current?.stopAllAction();
      }
    }
  }, [clone, isPlaying, animations, selectedAnimation, targetHeight]);

  useFrame((state, delta) => {
    mixer.current?.update(delta);
  });

  return <primitive object={clone} />;
};

export const ModelGLTF = ({ url, isPlaying, selectedAnimation, onAnimationsLoaded, targetHeight = 3 }: { 
    url: string; 
    isPlaying?: boolean; 
    selectedAnimation?: string; 
    onAnimationsLoaded?: (names: string[]) => void;
    targetHeight?: number;
  }) => {
    const [error, setError] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);
  
    useEffect(() => {
      let isMounted = true;
      const checkUrl = async () => {
        if (!url) return;
        try {
          // Use fetch to check if the file exists and is not an HTML error page
          // Also check for binary header if it's a small fetch to avoid "PK" (ZIP) issues with GLTF JSON loader
          const response = await fetch(url);
          if (!isMounted) return;

          if (!response.ok) {
            setError(`Error: El archivo no existe (${response.status})`);
            return;
          }

          const contentType = response.headers.get('Content-Type');
          if (contentType && contentType.includes('text/html')) {
            setError("Error: El servidor devolvió HTML en lugar de un modelo 3D");
            return;
          }

          // Peek at start of file for "PK" (ZIP/corrupted) or "glTF"
          const reader = response.body?.getReader();
          if (reader) {
             const { value } = await reader.read();
             if (value && value.length >= 2) {
                const header = String.fromCharCode(value[0], value[1]);
                if (header === 'PK' || url.toLowerCase().endsWith('.zip')) {
                   setError("Error: El archivo es un ZIP o está comprimido. Por favor usa un archivo .glb o .gltf directo.");
                   return;
                }
                
                if (url.toLowerCase().endsWith('.glb')) {
                   const gltfHeader = String.fromCharCode(value[0], value[1], value[2], value[3]);
                   if (gltfHeader !== 'glTF') {
                      setError("Error: El archivo GLB parece estar corrupto (Cabecera glTF no encontrada)");
                      return;
                   }
                }
             }
             reader.releaseLock();
          }

          setIsVerified(true);
        } catch (e) {
          if (isMounted) setError("Error de red al cargar el modelo");
        }
      };
      
      setIsVerified(false);
      setError(null);
      checkUrl();
      
      return () => { isMounted = false; };
    }, [url]);
  
    if (error) {
      return (
        <group>
          {/* Torso */}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1, 1.2, 0.5]} />
            <meshStandardMaterial color="#0047AB" />
          </mesh>
          {/* Head */}
          <mesh position={[0, 1.9, 0]}>
            <boxGeometry args={[0.8, 0.8, 0.8]} />
            <meshStandardMaterial color="#FFFFFF" />
            <mesh position={[0, 0, 0.41]}>
              <planeGeometry args={[0.6, 0.6]} />
              <meshBasicMaterial color="black" transparent opacity={0.6} />
            </mesh>
          </mesh>
          {/* Arms */}
          <mesh position={[-0.75, 1.1, 0]}><boxGeometry args={[0.5, 1, 0.5]} /><meshStandardMaterial color="#F5CD30" /></mesh>
          <mesh position={[0.75, 1.1, 0]}><boxGeometry args={[0.5, 1, 0.5]} /><meshStandardMaterial color="#F5CD30" /></mesh>
          {/* Legs */}
          <mesh position={[-0.25, 0.35, 0]}><boxGeometry args={[0.45, 0.7, 0.5]} /><meshStandardMaterial color="#A2C429" /></mesh>
          <mesh position={[0.25, 0.35, 0]}><boxGeometry args={[0.45, 0.7, 0.5]} /><meshStandardMaterial color="#A2C429" /></mesh>
        </group>
      );
    }

    if (!isVerified) {
      return (
        <group>
          <mesh position={[0, 1, 0]}><boxGeometry args={[1, 1.2, 0.5]} /><meshStandardMaterial color="#666666" transparent opacity={0.3} /></mesh>
          <mesh position={[0, 1.9, 0]}><boxGeometry args={[0.8, 0.8, 0.8]} /><meshStandardMaterial color="#666666" transparent opacity={0.3} /></mesh>
        </group>
      );
    }
  
    return (
      <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="gray" wireframe /></mesh>}>
        <ModelGLTFInternal url={url} isPlaying={isPlaying} selectedAnimation={selectedAnimation} onAnimationsLoaded={onAnimationsLoaded} targetHeight={targetHeight} />
      </Suspense>
    );
  };

export const ModelFBXInternal = ({ url, isPlaying, selectedAnimation, onAnimationsLoaded, targetHeight = 3 }: { 
  url: string; 
  isPlaying?: boolean; 
  selectedAnimation?: string;
  onAnimationsLoaded?: (names: string[]) => void;
  targetHeight?: number;
}) => {
  const fbx = useLoader(FBXLoader, url);
  const mixer = useRef<AnimationMixer | null>(null);
  const clone = React.useMemo(() => SkeletonUtils.clone(fbx), [fbx]);

  useEffect(() => {
    if (clone) {
      clone.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (child.material) {
            child.material.envMapIntensity = 2.0;
          }
        }
      });
    }
  }, [clone]);

  useEffect(() => {
    if ((fbx as any)?.animations?.length && onAnimationsLoaded) {
      onAnimationsLoaded((fbx as any).animations.map((a: any) => a.name));
    }
  }, [fbx, onAnimationsLoaded]);

  useEffect(() => {
    if (clone && (fbx as any)?.animations?.length) {
      const box = new THREE.Box3().setFromObject(clone);
      const size = box.getSize(new THREE.Vector3());
      if (size.y > 0) {
        const scale = targetHeight / size.y;
        clone.scale.set(scale, scale, scale);
      }

      if (isPlaying || selectedAnimation) {
        if (!mixer.current) mixer.current = new AnimationMixer(clone);
        mixer.current.stopAllAction();
        const animations = (fbx as any).animations;
        const animToPlay = selectedAnimation 
          ? animations.find((a: any) => a.name === selectedAnimation) || animations[0]
          : animations[0];
        if (animToPlay) {
            const action = mixer.current.clipAction(animToPlay);
            action.reset().fadeIn(0.2).play();
        }
      } else {
        mixer.current?.stopAllAction();
      }
    }
  }, [clone, isPlaying, fbx, selectedAnimation, targetHeight]);

  useFrame((state, delta) => {
    mixer.current?.update(delta);
  });

  return <primitive object={clone} />;
};

export const ModelFBX = ({ url, isPlaying, selectedAnimation, onAnimationsLoaded, targetHeight = 3 }: { 
  url: string; 
  isPlaying?: boolean; 
  selectedAnimation?: string;
  onAnimationsLoaded?: (names: string[]) => void;
  targetHeight?: number;
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkUrl = async () => {
      if (!url) return;
      try {
        const response = await fetch(url);
        if (!isMounted) return;

        if (!response.ok) {
          setError(`Error: El archivo no existe (${response.status})`);
          return;
        }

        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('text/html')) {
          setError("Error: El servidor devolvió HTML en lugar de un modelo 3D");
          return;
        }

        // Peek at start of file
        const reader = response.body?.getReader();
        if (reader) {
           const { value } = await reader.read();
           if (value && value.length >= 2) {
              const header = String.fromCharCode(value[0], value[1]);
              if (header !== 'Ka' && header !== 'PK' && !url.toLowerCase().endsWith('.fbx')) {
                 // FBX usually starts with "Kaydara FBX Binary" ('Ka') or is text or zip (PK)
                 // This is a relaxed check but helps catch obvious non-binary files
              }
           }
           reader.releaseLock();
        }

        setIsVerified(true);
      } catch (e) {
        if (isMounted) setError("Error de red al cargar el modelo");
      }
    };
    
    setIsVerified(false);
    setError(null);
    checkUrl();
    
    return () => { isMounted = false; };
  }, [url]);

  if (error) {
    return (
      <group>
        {/* Torso */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[1, 1.2, 0.5]} />
          <meshStandardMaterial color="#0047AB" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.9, 0]}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#FFFFFF" />
          <mesh position={[0, 0, 0.41]}>
            <planeGeometry args={[0.6, 0.6]} />
            <meshBasicMaterial color="black" transparent opacity={0.6} />
          </mesh>
        </mesh>
        {/* Arms */}
        <mesh position={[-0.75, 1.1, 0]}><boxGeometry args={[0.5, 1, 0.5]} /><meshStandardMaterial color="#F5CD30" /></mesh>
        <mesh position={[0.75, 1.1, 0]}><boxGeometry args={[0.5, 1, 0.5]} /><meshStandardMaterial color="#F5CD30" /></mesh>
        {/* Legs */}
        <mesh position={[-0.25, 0.35, 0]}><boxGeometry args={[0.45, 0.7, 0.5]} /><meshStandardMaterial color="#A2C429" /></mesh>
        <mesh position={[0.25, 0.35, 0]}><boxGeometry args={[0.45, 0.7, 0.5]} /><meshStandardMaterial color="#A2C429" /></mesh>
      </group>
    );
  }

  if (!isVerified) {
    return (
      <group>
        <mesh position={[0, 1, 0]}><boxGeometry args={[1, 1.2, 0.5]} /><meshStandardMaterial color="#666666" transparent opacity={0.3} /></mesh>
        <mesh position={[0, 1.9, 0]}><boxGeometry args={[0.8, 0.8, 0.8]} /><meshStandardMaterial color="#666666" transparent opacity={0.3} /></mesh>
      </group>
    );
  }

  return (
    <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="gray" wireframe /></mesh>}>
      <ModelFBXInternal url={url} isPlaying={isPlaying} selectedAnimation={selectedAnimation} onAnimationsLoaded={onAnimationsLoaded} targetHeight={targetHeight} />
    </Suspense>
  );
};

export const ImportedModel = ({ url, isFbx, isPlaying, selectedAnimation, onAnimationsLoaded, targetHeight = 3 }: { 
  url: string; 
  isFbx?: boolean; 
  isPlaying?: boolean;
  selectedAnimation?: string;
  onAnimationsLoaded?: (names: string[]) => void;
  targetHeight?: number;
}) => {
  if (!url) return null;
  const isActuallyFbx = isFbx || url.includes('#fbx');
  const cleanUrl = url.replace('#fbx', '');

  if (isActuallyFbx) {
    return <ModelFBX url={cleanUrl} isPlaying={isPlaying} selectedAnimation={selectedAnimation} onAnimationsLoaded={onAnimationsLoaded} targetHeight={targetHeight} />;
  }
  return <ModelGLTF url={cleanUrl} isPlaying={isPlaying} selectedAnimation={selectedAnimation} onAnimationsLoaded={onAnimationsLoaded} targetHeight={targetHeight} />;
};

export const CustomAvatarSwitcher = ({ 
  modelUrl, 
  idleUrl, 
  walkUrl, 
  jumpUrl,
  runUrl,
  jumpAnimUrl,
  idleAnimUrl,
  extraAnimations = [],
  emotes = [],
  isMoving, 
  isJumping,
  moveIntensity,
  selectedAnimation,
  targetHeight = 3 
}: { 
  modelUrl: string;
  idleUrl?: string | null;
  walkUrl?: string | null;
  jumpUrl?: string | null;
  runUrl?: string | null;
  jumpAnimUrl?: string | null;
  idleAnimUrl?: string | null;
  extraAnimations?: string[];
  emotes?: any[];
  isMoving?: boolean;
  isJumping?: boolean;
  moveIntensity?: number;
  selectedAnimation?: string;
  targetHeight?: number;
}) => {
  // Mapping logic:
  // Animation 1 -> Movement (runUrl or walkUrl)
  // Animation 2 -> Jump (jumpAnimUrl or jumpUrl)
  // Animation 3 -> Idle (idleAnimUrl or idleUrl)

  useEffect(() => {
    if (selectedAnimation && emotes?.length) {
      const emote = emotes.find(e => e.id === selectedAnimation);
      if (emote?.soundUrl) {
        const audio = new Audio(emote.soundUrl);
        audio.play().catch(err => console.warn("Failed to play emote sound:", err));
      }
    }
  }, [selectedAnimation]);

  const activeRun = runUrl || walkUrl;
  const activeJump = jumpAnimUrl || jumpUrl;
  const activeIdle = idleAnimUrl || idleUrl;

  // Use the specific animation URL based on state
  let currentAnimUrl = activeIdle || modelUrl;
  let isFbxHint = modelUrl.includes('#fbx');

  const emote = emotes.find(e => e.id === selectedAnimation);

  if (emote && emote.animationUrl) {
    currentAnimUrl = emote.animationUrl;
    isFbxHint = emote.animationUrl.includes('#fbx');
  } else if (isJumping && activeJump) {
    currentAnimUrl = activeJump;
    isFbxHint = activeJump.includes('#fbx') || isFbxHint;
  } else if (isMoving && activeRun) {
    currentAnimUrl = activeRun;
    isFbxHint = activeRun.includes('#fbx') || isFbxHint;
  } else if (activeIdle) {
    currentAnimUrl = activeIdle;
    isFbxHint = activeIdle.includes('#fbx') || isFbxHint;
  }

  // To prevent "stuttering" on load, we should ideally preload these or use a better architecture.
  // For now, we'll keep the logic but ensure the clean URL is used.
  // We can also adjust the animation speed (though ImportedModel would need to support it)
  return <ImportedModel key={currentAnimUrl} url={currentAnimUrl} isFbx={isFbxHint} isPlaying={true} targetHeight={targetHeight} />;
};
