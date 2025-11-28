
import React, { useRef, useEffect } from 'react';
import { TranscriptEntry } from '../types';

interface TranscriptProps {
    transcript: TranscriptEntry[];
}

export const Transcript: React.FC<TranscriptProps> = ({ transcript }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    return (
        <div className="w-full max-w-4xl mx-auto h-full overflow-y-auto space-y-4 pr-4 custom-scrollbar">
            {transcript.map((entry) => {
                const isUser = entry.speaker === 'user';
                const isSystem = entry.speaker === 'system';
                
                let alignment = 'items-start';
                if (isUser) alignment = 'items-end';
                if (isSystem) alignment = 'items-center';

                let bubbleClass = 'bg-secondary rounded-bl-none';
                if (isUser) bubbleClass = 'bg-blue-600 text-white rounded-br-none';
                if (isSystem) bubbleClass = 'bg-red-500/20 text-red-200 border border-red-500/50 text-center text-sm';

                let label = 'Aura';
                if (isUser) label = 'User';
                if (isSystem) label = 'System';

                return (
                    <div key={entry.id} className={`flex flex-col ${alignment}`}>
                        <span className="px-3 pb-1 text-sm text-text-secondary">
                            {label}
                        </span>
                        <div className={`max-w-md md:max-w-lg p-3 rounded-2xl text-base ${bubbleClass}`}>
                            <p>{entry.text}</p>
                        </div>
                    </div>
                );
            })}
            <div ref={endOfMessagesRef} />
        </div>
    );
};