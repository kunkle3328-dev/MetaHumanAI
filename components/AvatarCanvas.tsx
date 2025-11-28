import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import Avatar from './Avatar';
import { ConnectionState } from '../types';

interface AvatarCanvasProps {
    modelAmplitude: number;
    userSpeaking: boolean;
    connectionState: ConnectionState;
}

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
    modelAmplitude,
    userSpeaking,
    connectionState,
}) => {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none">
            <Canvas
                camera={{
                    position: [0, 1.55, 2.1],   // PERFECT EYE LEVEL + DISTANCE
                    fov: 30,
                }}
            >
                {/* Lighting Setup */}
                <ambientLight intensity={0.9} />
                <directionalLight position={[3, 5, 2]} intensity={1.4} />
                <pointLight position={[0, 1.3, 1.2]} intensity={1.1} />

                <Suspense fallback={null}>
                    {/* Avatar Position (tuned for full-screen canvas) */}
                    <group position={[0, -0.7, 0]}>
                        <Avatar
                            modelAmplitude={modelAmplitude}
                            userSpeaking={userSpeaking}
                            connectionState={connectionState}
                        />
                    </group>

                    <Environment preset="studio" />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default AvatarCanvas;
