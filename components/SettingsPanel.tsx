
import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Settings } from '../types';

const SettingRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex justify-between items-center py-3 border-b border-border-color">
        <label className="text-text-secondary">{label}</label>
        <div>{children}</div>
    </div>
);

const Select: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode }> = ({ value, onChange, children }) => (
    <select
        value={value}
        onChange={onChange}
        className="bg-tertiary border border-border-color rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-accent"
    >
        {children}
    </select>
);

export const SettingsPanel: React.FC = () => {
    const { state, dispatch } = useAppContext();

    const handleSettingChange = <K extends keyof Settings,>(key: K, value: Settings[K]) => {
        dispatch({ type: 'UPDATE_SETTINGS', payload: { [key]: value } });
    };
    
    const themeOptions = [
        { value: 'dark', label: 'Dark' },
        { value: 'light', label: 'Light' },
        { value: 'cyberpunk', label: 'Cyberpunk' },
        { value: 'holographic', label: 'Holographic' },
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-accent">Appearance</h3>
            <SettingRow label="Theme">
                <Select
                    value={state.settings.theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value as Settings['theme'])}
                >
                    {themeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </Select>
            </SettingRow>

            <h3 className="text-lg font-semibold text-accent mt-6">Voice</h3>
            <SettingRow label="Assistant Voice">
                 <Select
                    value={state.settings.voice}
                    onChange={(e) => handleSettingChange('voice', e.target.value)}
                >
                    <optgroup label="Standard Voices">
                        <option value="Puck">Puck (Male)</option>
                        <option value="Kore">Kore (Female)</option>
                    </optgroup>
                    <optgroup label="Premium Voices">
                        <option value="Zephyr">Zephyr (Female) ✨</option>
                        <option value="Charon">Charon (Male) ✨</option>
                        <option value="Fenrir">Fenrir (Male) ✨</option>
                    </optgroup>
                 </Select>
            </SettingRow>

            <h3 className="text-lg font-semibold text-accent mt-6">Behavior</h3>
             <SettingRow label="Continuous Listening">
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={state.settings.continuousListening}
                        onChange={(e) => handleSettingChange('continuousListening', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-tertiary rounded-full peer peer-focus:ring-2 peer-focus:ring-accent peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
            </SettingRow>
            
            <SettingRow label="Enable Google Search">
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={state.settings.googleSearchEnabled}
                        onChange={(e) => handleSettingChange('googleSearchEnabled', e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-tertiary rounded-full peer peer-focus:ring-2 peer-focus:ring-accent peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
            </SettingRow>
        </div>
    );
};