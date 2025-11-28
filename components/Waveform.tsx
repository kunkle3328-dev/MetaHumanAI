
import React, { useRef, useEffect } from 'react';

interface WaveformProps {
    amplitude: number;
}

export const Waveform: React.FC<WaveformProps> = ({ amplitude }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const parent = canvas.parentElement;
        if (!parent) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = parent.offsetWidth * dpr;
        canvas.height = parent.offsetHeight * dpr;
        ctx.scale(dpr, dpr);
        const { width, height } = canvas;

        const midY = height / 2;
        const barWidth = 4;
        const gap = 2;
        const numBars = Math.floor(width / (barWidth + gap));

        ctx.clearRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(1, '#ff00ff');
        ctx.fillStyle = gradient;
        
        for (let i = 0; i < numBars; i++) {
            const noise = (Math.random() - 0.5) * 0.2 + 1;
            const barHeight = Math.max(2, amplitude * height * 0.8 * noise);
            
            const x = (width / 2) - (numBars / 2 * (barWidth + gap)) + i * (barWidth + gap);
            const y = midY - barHeight / 2;

            ctx.fillRect(x, y, barWidth, barHeight);
        }

    }, [amplitude]);

    return <canvas ref={canvasRef} className="w-full h-full" />;
};
