
import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConnectionState } from '../types';

const AVATAR_URL =
  "https://models.readyplayer.me/69189159786317131c5bb99a.glb?morphTargets=ARKit,Oculus%20Visemes";
  
// Mapping of Oculus Visemes
const visemeMap: { [key: string]: string } = {
  sil: "viseme_sil",
  PP: "viseme_PP",
  FF: "viseme_FF",
  TH: "viseme_TH",
  DD: "viseme_DD",
  kk: "viseme_kk",
  CH: "viseme_CH",
  SS: "viseme_SS",
  nn: "viseme_nn",
  RR: "viseme_RR",
  aa: "viseme_aa",
  E: "viseme_E",
  I: "viseme_I",
  O: "viseme_O",
  U: "viseme_U",
};

// Vowel shapes for random speech generation
const vowels = ['viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U'];

interface AvatarProps {
  modelAmplitude: number;
  userSpeaking: boolean;
  connectionState: ConnectionState;
}

const Avatar: React.FC<AvatarProps> = ({
  modelAmplitude,
  userSpeaking,
  connectionState,
}) => {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(AVATAR_URL) as any;

  const headMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const leftEyeRef = useRef<THREE.Object3D | null>(null);
  const rightEyeRef = useRef<THREE.Object3D | null>(null);
  
  // Bones for natural movement
  const headBoneRef = useRef<THREE.Object3D | null>(null);
  const neckBoneRef = useRef<THREE.Object3D | null>(null);
  const spineBoneRef = useRef<THREE.Object3D | null>(null);
  
  const smoothedAmplitude = useRef(0);
  const mouthOpenRef = useRef(0);
  const targetVisemeRef = useRef<string>('viseme_sil');
  const visemeTimerRef = useRef(0);
  const seed = useRef(Math.random() * 100);
  
  // Noding Logic
  const nodTimerRef = useRef(0);
  const isNoddingRef = useRef(false);
  const nodDurationRef = useRef(0);
  const nodStartTimeRef = useRef(0);

  // ------------------------------------------------------------
  // IDENTIFY NODES
  // ------------------------------------------------------------
  useEffect(() => {
    scene.traverse((child: any) => {
      // Hide body parts to show only head/upper torso if desired.
      if (
        child.name.includes("Wolf3D_Body") || child.name.includes("Outfit") ||
        child.name.includes("Bottom") || child.name.includes("Top") || child.name.includes("Footwear")
      ) {
        child.visible = false;
      }
      if (child.isSkinnedMesh && (child.name.includes("Head") || child.name.includes("Wolf3D_Head"))) {
        headMeshRef.current = child;
      }
      
      // Identify bones for animation
      if (child.isBone) {
          if (child.name === 'Head') headBoneRef.current = child;
          if (child.name === 'Neck') neckBoneRef.current = child;
          if (child.name === 'Spine2') spineBoneRef.current = child;
      }
      
      if (child.name === "EyeLeft" || child.name === "LeftEye") leftEyeRef.current = child;
      if (child.name === "EyeRight" || child.name === "RightEye") rightEyeRef.current = child;
    });
  }, [scene]);

  // ------------------------------------------------------------
  // FRAME LOOP
  // ------------------------------------------------------------
  useFrame(({ camera, clock }) => {
    const time = clock.getElapsedTime();
    const t = time + seed.current;
    
    // Smooth the amplitude for fluid movement
    smoothedAmplitude.current = THREE.MathUtils.lerp(smoothedAmplitude.current, modelAmplitude, 0.25);
    const amp = smoothedAmplitude.current;

    // --- FACIAL ANIMATION ---
    if (headMeshRef.current) {
      const dict = headMeshRef.current.morphTargetDictionary;
      const infl = headMeshRef.current.morphTargetInfluences;

      if (dict && infl) {
        // Reset all visemes slowly
        Object.values(visemeMap).forEach(key => {
            const index = dict[key];
            if (index !== undefined) {
                infl[index] = THREE.MathUtils.lerp(infl[index], 0, 0.2); 
            }
        });

        // 1. ADVANCED LIP SYNC ENGINE
        if (amp > 0.02) {
            // Update target viseme periodically to simulate syllables
            if (time > visemeTimerRef.current) {
                // Pick a new vowel based on noise or randomness
                const randIndex = Math.floor(Math.random() * vowels.length);
                targetVisemeRef.current = vowels[randIndex];
                // Set next update time (100ms - 200ms)
                visemeTimerRef.current = time + 0.1 + Math.random() * 0.1;
            }

            // Apply opening base on amplitude
            const mouthOpen = Math.min(amp * 4.0, 1.0); // Boost amplitude effect
            mouthOpenRef.current = THREE.MathUtils.lerp(mouthOpenRef.current, mouthOpen, 0.3);
            
            // Blend to target viseme
            const targetIndex = dict[targetVisemeRef.current];
            if (targetIndex !== undefined) {
                 infl[targetIndex] = THREE.MathUtils.lerp(infl[targetIndex], mouthOpenRef.current, 0.5);
            }
            
            // Occasionally blend in closed mouth consonants (P, M, B) for realism
            // If amplitude drops momentarily or randomly
            if (Math.sin(t * 20) > 0.8 || amp < 0.05) {
                 const ppIndex = dict['viseme_PP'];
                 if (ppIndex !== undefined) infl[ppIndex] = THREE.MathUtils.lerp(infl[ppIndex], 0.5, 0.4);
            }

        } else {
             mouthOpenRef.current = THREE.MathUtils.lerp(mouthOpenRef.current, 0, 0.2);
        }

        // 2. MICRO-EXPRESSIONS & IDLE
        // Blinking
        const blinkTrigger = Math.sin(t * 0.5) > 0.99 || Math.random() > 0.995;
        const blinkVal = blinkTrigger ? 1 : 0;
        if (dict["eyeBlinkLeft"] !== undefined) infl[dict["eyeBlinkLeft"]] = THREE.MathUtils.lerp(infl[dict["eyeBlinkLeft"]], blinkVal, 0.4);
        if (dict["eyeBlinkRight"] !== undefined) infl[dict["eyeBlinkRight"]] = THREE.MathUtils.lerp(infl[dict["eyeBlinkRight"]], blinkVal, 0.4);

        // Brows - Expressiveness
        // Lift brows slightly when user speaks (Listening/Interest)
        // Furrow brows slightly if avatar is thinking (silence + high randomness)
        let browInnerUpTarget = 0;
        let browDownTarget = 0;

        if (userSpeaking) {
             browInnerUpTarget = 0.4; // Interested
        } else if (amp > 0.1) {
             browInnerUpTarget = amp * 0.5; // Animated speaking
        }
        
        if (dict["browInnerUp"] !== undefined) infl[dict["browInnerUp"]] = THREE.MathUtils.lerp(infl[dict["browInnerUp"]], browInnerUpTarget, 0.1);
        
        // Slight Smile
        let smileTarget = 0.05;
        if (userSpeaking) smileTarget = 0.2; // Polite listening smile
        if (amp > 0.1) smileTarget = 0.1 + (Math.sin(t * 5) * 0.1); // Dynamic talking smile
        
        if (dict["mouthSmile"] !== undefined) {
             infl[dict["mouthSmile"]] = THREE.MathUtils.lerp(infl[dict["mouthSmile"]], smileTarget, 0.05);
        }
      }
    }

    // --- HEAD TRACKING & BODY LANGUAGE ---
    if (headBoneRef.current) {
        // Calculate direction to camera
        const headPos = headBoneRef.current.position;
        const lookVector = new THREE.Vector3().subVectors(camera.position, headPos).normalize();
        
        let targetYaw = Math.atan2(lookVector.x, lookVector.z); 
        let targetPitch = -Math.asin(lookVector.y);

        // -- IDLE NOISE --
        const idleYaw = Math.sin(t * 0.5) * 0.05 + Math.sin(t * 1.2) * 0.02;
        const idlePitch = Math.cos(t * 0.3) * 0.03;
        const idleRoll = Math.sin(t * 0.7) * 0.02;

        // -- NODDING LOGIC (Active Listening) --
        let nodOffsetPitch = 0;
        if (userSpeaking) {
            // Randomly trigger a nod
            if (!isNoddingRef.current && time > nodTimerRef.current) {
                if (Math.random() > 0.7) { // 30% chance to start nodding when timer expires
                    isNoddingRef.current = true;
                    nodStartTimeRef.current = time;
                    nodDurationRef.current = 0.5 + Math.random() * 0.5; // Short single or double nod
                }
                nodTimerRef.current = time + 2 + Math.random() * 3; // Cooldown 2-5s
            }
            
            if (isNoddingRef.current) {
                const nodProgress = (time - nodStartTimeRef.current) / nodDurationRef.current;
                if (nodProgress >= 1) {
                    isNoddingRef.current = false;
                } else {
                    // Sine wave for nodding (down then up)
                    nodOffsetPitch = Math.sin(nodProgress * Math.PI * 2) * 0.15; 
                }
            }
        }

        // -- LISTENING BEHAVIOR --
        if (userSpeaking) {
            targetYaw += idleYaw * 0.3; 
            targetPitch += idlePitch * 0.3 + nodOffsetPitch; // Add nod
            
            // Listening Tilt
            const listenTilt = -0.05; 
            headBoneRef.current.rotation.z = THREE.MathUtils.lerp(headBoneRef.current.rotation.z, listenTilt, 0.05);
        } else {
            targetYaw += idleYaw;
            targetPitch += idlePitch;
            headBoneRef.current.rotation.z = THREE.MathUtils.lerp(headBoneRef.current.rotation.z, idleRoll, 0.05);
        }

        // -- TALKING BEHAVIOR --
        if (amp > 0.1) {
            // Emphatic head movements
            targetPitch += Math.sin(t * 12) * amp * 0.05;
            targetYaw += Math.sin(t * 4) * amp * 0.03;
            // Slight forward lean (simulated via pitch)
            targetPitch -= 0.05; 
        }

        // Apply Rotations with damping
        const MAX_YAW = 1.0; 
        const MAX_PITCH = 0.6;
        
        targetYaw = THREE.MathUtils.clamp(targetYaw, -MAX_YAW, MAX_YAW);
        targetPitch = THREE.MathUtils.clamp(targetPitch, -MAX_PITCH, MAX_PITCH);

        headBoneRef.current.rotation.y = THREE.MathUtils.lerp(headBoneRef.current.rotation.y, targetYaw, 0.1);
        headBoneRef.current.rotation.x = THREE.MathUtils.lerp(headBoneRef.current.rotation.x, targetPitch, 0.1);
    }
    
    // Spine follows head
    if (spineBoneRef.current && headBoneRef.current) {
        spineBoneRef.current.rotation.y = THREE.MathUtils.lerp(spineBoneRef.current.rotation.y, headBoneRef.current.rotation.y * 0.2, 0.05);
        spineBoneRef.current.rotation.x = THREE.MathUtils.lerp(spineBoneRef.current.rotation.x, headBoneRef.current.rotation.x * 0.2, 0.05);
    }

    // Eyes Tracking
    const saccadeX = (Math.random() - 0.5) * 0.02;
    const saccadeY = (Math.random() - 0.5) * 0.02;
    const doSaccade = Math.random() > 0.95; 

    const eyeTarget = camera.position.clone();
    if (doSaccade && !userSpeaking) {
        eyeTarget.x += saccadeX;
        eyeTarget.y += saccadeY;
    }

    if (leftEyeRef.current) leftEyeRef.current.lookAt(eyeTarget);
    if (rightEyeRef.current) rightEyeRef.current.lookAt(eyeTarget);

  });

  return (
    <group ref={group} scale={1.35}>
      <primitive object={scene} />
    </group>
  );
};

export default Avatar;
useGLTF.preload(AVATAR_URL);
