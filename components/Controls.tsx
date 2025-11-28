
import React from 'react';
import { ConnectionState } from '../types';
import { MicIcon, MicOffIcon, AppWindowIcon, BrainCircuitIcon, SlidersIcon, SearchIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import { ToolTab } from '../types';

interface ControlsProps {
    connectionState: ConnectionState;
    startSession: () => void;
    stopSession: () => void;
    isMuted: boolean;
    toggleMute: () => void;
    userAmplitude: number;
}

const ControlButton: React.FC<{ onClick: () => void, children: React.ReactNode, active?: boolean, title: string }> = ({ onClick, children, active, title }) => {
    return (
        <button 
            title={title}
            onClick={onClick} 
            className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${active ? 'bg-accent/20 text-accent' : 'bg-secondary/50 hover:bg-tertiary/70'}`}>
            {children}
        </button>
    )
}

export const Controls: React.FC<ControlsProps> = ({ connectionState, startSession, stopSession }) => {
    const isConnected = connectionState === 'connected';
    const isConnecting = connectionState === 'connecting';
    const { dispatch } = useAppContext();

    const handleMicClick = () => {
        if (isConnected) {
            stopSession();
        } else if (connectionState === 'disconnected' || connectionState === 'error') {
            startSession();
        }
    };

    const openTools = () => {
        dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'tools' });
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-4">
                 <ControlButton onClick={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'search' })} title="Search">
                    <SearchIcon className="w-6 h-6" />
                </ControlButton>
                <ControlButton onClick={openTools} title="Tools">
                    <AppWindowIcon className="w-6 h-6" />
                </ControlButton>

                <button
                    onClick={handleMicClick}
                    disabled={isConnecting}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg border-2 border-transparent
                    ${isConnecting ? 'cursor-not-allowed opacity-50 bg-gray-600' : ''}
                    ${isConnected ? 'bg-red-500/80 hover:bg-red-500' : 'bg-green-500/80 hover:bg-green-500'}`}
                >
                    {isConnected ? <MicIcon className="w-10 h-10 text-white" /> : <MicOffIcon className="w-10 h-10 text-white" />}
                </button>
                
                 <ControlButton onClick={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'memory' })} title="Memory">
                    <BrainCircuitIcon className="w-6 h-6" />
                </ControlButton>
                 <ControlButton onClick={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'settings' })} title="Settings">
                    <SlidersIcon className="w-6 h-6" />
                </ControlButton>
            </div>
        </div>
    );
};