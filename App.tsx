

import React, { useState, useEffect } from 'react';
import { AvatarCanvas } from './components/AvatarCanvas';
import { UI } from './components/UI';
import { useGeminiLive } from './hooks/useGeminiLive';
import { LoadingSplash } from './components/LoadingSplash';

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("Initializing...");

    const {
        connectionState,
        startSession,
        stopSession,
        isMuted,
        toggleMute,
        transcript,
        userAmplitude,
        modelAmplitude
    } = useGeminiLive();

    useEffect(() => {
        const loadingSteps = [
            "Booting multi-agent core...",
            "Loading MetaHuman avatar...",
            "Calibrating lip-sync engine...",
            "Initializing memory matrix...",
            "Ready."
        ];
        let step = 0;
        const interval = setInterval(() => {
            if (step < loadingSteps.length) {
                setLoadingMessage(loadingSteps[step]);
                step++;
            } else {
                clearInterval(interval);
                setIsLoading(false);
            }
        }, 800);

        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return <LoadingSplash message={loadingMessage} />;
    }

    return (
        <main className={`relative w-screen h-screen overflow-hidden bg-primary text-text-primary font-sans transition-colors duration-500`}>
            {/* Avatar and Title in the background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-8 left-0 right-0 z-10 text-center pointer-events-none">
                    <h1 className="text-5xl font-extrabold tracking-widest text-text-primary animate-neon-pulse select-none" style={{ fontFamily: `'Orbitron', sans-serif`}}>AURA</h1>
                    <p className="text-lg text-text-secondary opacity-80 select-none">Your Personal AI Companion</p>
                </div>
                <AvatarCanvas 
                    modelAmplitude={modelAmplitude}
                    userSpeaking={userAmplitude > 0.05}
                    connectionState={connectionState}
                />
            </div>

            {/* UI on top with a gradient fade */}
            <div className="absolute inset-0 z-10 flex flex-col justify-end pointer-events-none">
                 <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary via-primary/80 to-transparent" />
                <div className="relative w-full max-h-[70vh] flex flex-col">
                    <UI 
                        connectionState={connectionState}
                        startSession={startSession}
                        stopSession={stopSession}
                        isMuted={isMuted}
                        toggleMute={toggleMute}
                        transcript={transcript}
                        userAmplitude={userAmplitude}
                    />
                </div>
            </div>
        </main>
    );
}