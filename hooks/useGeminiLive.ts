
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState } from '../types';
import { useAppContext } from '../context/AppContext';
import { useAgentRouter } from './useAgentRouter';

// --- Audio Encoding/Decoding Utilities ---

function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


export const useGeminiLive = () => {
    const { state, dispatch } = useAppContext();
    const { routeIntent } = useAgentRouter();
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [isMuted, setIsMuted] = useState(false);
    
    // Amplitudes for UI visualization (waveform, avatar movement)
    const [userAmplitude, setUserAmplitude] = useState(0);
    const [modelAmplitude, setModelAmplitude] = useState(0);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    
    const userAnalyzerRef = useRef<AnalyserNode | null>(null);
    const modelAnalyzerRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number>(0);
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');
    
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

    const aiRef = useRef<GoogleGenAI | null>(null);

    const stopSession = useCallback(async () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        if (sessionPromiseRef.current) {
            const session = await sessionPromiseRef.current;
            session.close();
            sessionPromiseRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            await inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            await outputAudioContextRef.current.close();
        }
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;
        setConnectionState('disconnected');
        setUserAmplitude(0);
        setModelAmplitude(0);
    }, []);

    const analyzeAudio = useCallback(() => {
        if (userAnalyzerRef.current) {
            const dataArray = new Uint8Array(userAnalyzerRef.current.frequencyBinCount);
            userAnalyzerRef.current.getByteTimeDomainData(dataArray);
            const avg = dataArray.reduce((acc, val) => acc + Math.abs(val - 128), 0) / dataArray.length;
            setUserAmplitude(avg / 128);
        }
        if (modelAnalyzerRef.current) {
            const dataArray = new Uint8Array(modelAnalyzerRef.current.frequencyBinCount);
            modelAnalyzerRef.current.getByteTimeDomainData(dataArray);
            const avg = dataArray.reduce((acc, val) => acc + Math.abs(val - 128), 0) / dataArray.length;
            setModelAmplitude(avg / 128);
        }
        animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }, []);

    const startSession = useCallback(async () => {
        // Allow retry if state is error
        if ((connectionState !== 'disconnected' && connectionState !== 'error') || !process.env.API_KEY) {
            console.error("Cannot start session. State:", connectionState, "API Key available:", !!process.env.API_KEY);
            return;
        }
        
        setConnectionState('connecting');
        dispatch({ type: 'CLEAR_TRANSCRIPT' });

        try {
            // Always create a new instance to ensure fresh state
            aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Initialize Audio Contexts
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            if (inputAudioContextRef.current.state === 'suspended') {
                await inputAudioContextRef.current.resume();
            }

            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            if (outputAudioContextRef.current.state === 'suspended') {
                await outputAudioContextRef.current.resume();
            }
            
            const outputNode = outputAudioContextRef.current.createGain();
            outputNode.connect(outputAudioContextRef.current.destination);

            modelAnalyzerRef.current = outputAudioContextRef.current.createAnalyser();
            modelAnalyzerRef.current.fftSize = 256;
            outputNode.connect(modelAnalyzerRef.current);

            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const toolsInstruction = state.settings.googleSearchEnabled 
                ? "You have access to Google Search, Tasks, Notes, and Calendar tools. If the user asks for these, confirm you can do it. Do not say you cannot access them." 
                : "You have access to Tasks, Notes, and Calendar tools. If the user asks for these, confirm you can do it.";

            sessionPromiseRef.current = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: state.settings.voice } } },
                    systemInstruction: `You are Aura, an advanced, friendly AI companion. 
                    Your personality is based on: ${JSON.stringify(state.memory.profile)}. 
                    ${toolsInstruction}
                    The system will handle the actual execution of these tools after you respond. 
                    Keep your responses concise and conversational.`,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        setConnectionState('connected');
                        const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        userAnalyzerRef.current = inputAudioContextRef.current!.createAnalyser();
                        userAnalyzerRef.current.fftSize = 256;
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            
                            if (sessionPromiseRef.current) {
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination); // Connect to destination to keep it alive
                        source.connect(userAnalyzerRef.current);
                        
                        analyzeAudio();
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle transcription
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.outputTranscription) {
                             currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }

                        if (message.serverContent?.turnComplete) {
                            const userInput = currentInputTranscriptionRef.current.trim();
                            const modelOutput = currentOutputTranscriptionRef.current.trim();
                            
                            if (userInput) {
                                dispatch({ 
                                    type: 'ADD_TRANSCRIPT_ENTRY', 
                                    payload: { id: crypto.randomUUID(), speaker: 'user', text: userInput, timestamp: Date.now()} 
                                });
                                routeIntent(userInput);
                            }
                             if (modelOutput) {
                                dispatch({ 
                                    type: 'ADD_TRANSCRIPT_ENTRY', 
                                    payload: { id: crypto.randomUUID(), speaker: 'model', text: modelOutput, timestamp: Date.now()} 
                                });
                            }
                            
                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }
                        
                        // Handle audio playback
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && !isMuted) {
                            const audioBuffer = await decodeAudioData(
                                decode(base64Audio),
                                outputAudioContextRef.current!,
                                24000,
                                1
                            );
                            
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current!.currentTime);
                            
                            const source = outputAudioContextRef.current!.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => {
                                sourcesRef.current.delete(source);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            sourcesRef.current.add(source);
                        }

                        if(message.serverContent?.interrupted){
                             for (const source of sourcesRef.current.values()) {
                                source.stop();
                                sourcesRef.current.delete(source);
                            }
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Gemini Live Error:', e);
                        setConnectionState('error');
                        stopSession();
                    },
                    onclose: (e: CloseEvent) => {
                        stopSession();
                    },
                },
            });

        } catch (error) {
            console.error("Failed to start session:", error);
            setConnectionState('error');
            await stopSession();
        }
    }, [connectionState, stopSession, analyzeAudio, state.settings.voice, state.memory, state.settings.googleSearchEnabled, isMuted, routeIntent, dispatch]);

    useEffect(() => {
        return () => {
            stopSession();
        };
    }, [stopSession]);
    
    const toggleMute = () => setIsMuted(prev => !prev);
    
    return {
        connectionState,
        startSession,
        stopSession,
        transcript: state.transcript,
        isMuted,
        toggleMute,
        userAmplitude,
        modelAmplitude
    };
};
