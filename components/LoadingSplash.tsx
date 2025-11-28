
import React from 'react';

interface LoadingSplashProps {
    message: string;
}

export const LoadingSplash: React.FC<LoadingSplashProps> = ({ message }) => {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-primary text-text-primary font-mono">
            <div className="w-24 h-24 border-4 border-t-accent border-r-accent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <h1 className="text-2xl mt-8 font-bold text-accent animate-pulse">LIVE AI ASSISTANT</h1>
            <p className="mt-2 text-text-secondary">{message}</p>
        </div>
    );
};