
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Memory } from '../types';

export const MemoryPanel: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [memoryText, setMemoryText] = useState(JSON.stringify(state.memory, null, 2));
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    useEffect(() => {
        setMemoryText(JSON.stringify(state.memory, null, 2));
    }, [state.memory]);

    const handleSave = () => {
        try {
            setSaveStatus('saving');
            setError(null);
            const parsedMemory: Memory = JSON.parse(memoryText);
            dispatch({ type: 'UPDATE_MEMORY', payload: parsedMemory });
            setTimeout(() => setSaveStatus('saved'), 500);
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (e) {
            setError("Invalid JSON format. Please correct it before saving.");
            setSaveStatus('idle');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <p className="text-sm text-text-secondary mb-4">
                This is the AI's long-term memory. You can edit the JSON directly to influence its personality and knowledge.
            </p>
            <textarea
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                className="flex-grow w-full bg-tertiary border border-border-color rounded-lg p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none custom-scrollbar"
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            <button
                onClick={handleSave}
                className="mt-4 w-full bg-accent text-primary-dark font-bold py-2 rounded-lg transition-colors hover:bg-accent-hover disabled:opacity-50"
                disabled={saveStatus === 'saving'}
            >
                {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Memory'}
            </button>
        </div>
    );
};