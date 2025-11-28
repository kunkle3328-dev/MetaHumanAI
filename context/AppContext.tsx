

import React, { createContext, useReducer, useContext, useEffect, ReactNode } from 'react';
import { AppState, AppAction, Memory, Settings, ToolTab } from '../types';

const defaultMemory: Memory = {
    profile: { name: 'User', interests: [] },
    preferences: { theme: 'dark', voice: 'Zephyr' },
    projects: [],
    pastConversations: [],
};

const defaultSettings: Settings = {
    theme: 'dark',
    avatarStyle: 'default',
    continuousListening: true,
    googleSearchEnabled: true,
    voice: 'Zephyr',
    voiceSpeed: 1,
    voicePitch: 1,
};

const initialState: AppState = {
    tasks: [],
    notes: [],
    calendarEvents: [],
    memory: defaultMemory,
    settings: defaultSettings,
    activePanel: null,
    activeToolTab: 'tasks',
    transcript: [],
    searchState: {
        isLoading: false,
        result: null,
        error: null,
    },
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'ADD_TASK':
            return { ...state, tasks: [...state.tasks, action.payload] };
        case 'TOGGLE_TASK':
            return {
                ...state,
                tasks: state.tasks.map(task =>
                    task.id === action.payload ? { ...task, completed: !task.completed } : task
                ),
            };
        case 'DELETE_TASK':
            return { ...state, tasks: state.tasks.filter(task => task.id !== action.payload) };
        case 'ADD_NOTE':
            return { ...state, notes: [...state.notes, action.payload] };
        case 'UPDATE_NOTE':
             return {
                ...state,
                notes: state.notes.map(note =>
                    note.id === action.payload.id ? action.payload : note
                ),
            };
        case 'DELETE_NOTE':
            return { ...state, notes: state.notes.filter(note => note.id !== action.payload) };
        case 'ADD_EVENT':
             return { ...state, calendarEvents: [...state.calendarEvents, action.payload] };
        case 'UPDATE_MEMORY':
            return { ...state, memory: { ...state.memory, ...action.payload } };
        case 'UPDATE_SETTINGS':
            return { ...state, settings: { ...state.settings, ...action.payload } };
        case 'SET_ACTIVE_PANEL':
            return { ...state, activePanel: state.activePanel === action.payload ? null : action.payload };
        case 'SET_ACTIVE_TOOL_TAB':
            return { ...state, activeToolTab: action.payload };
        case 'SEARCH_START':
            return { ...state, searchState: { isLoading: true, result: null, error: null } };
        case 'SEARCH_SUCCESS':
            return { ...state, searchState: { isLoading: false, result: action.payload, error: null } };
        case 'SEARCH_ERROR':
            return { ...state, searchState: { isLoading: false, result: null, error: action.payload } };
        case 'ADD_TRANSCRIPT_ENTRY':
            return { ...state, transcript: [...state.transcript, action.payload] };
        case 'CLEAR_TRANSCRIPT':
            return { ...state, transcript: [] };
        case 'LOAD_STATE':
            return { ...state, ...action.payload };
        default:
            return state;
    }
};

const AppContext = createContext<{
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
}>({
    state: initialState,
    dispatch: () => null,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        try {
            const storedState = localStorage.getItem('aiAssistantState');
            if (storedState) {
                const parsedState = JSON.parse(storedState);
                dispatch({ type: 'LOAD_STATE', payload: { ...initialState, ...parsedState } });
            }
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
        }
    }, []);
    
    useEffect(() => {
        // This is the single source of truth for applying the theme class.
        document.documentElement.className = state.settings.theme;
    }, [state.settings.theme]);

    useEffect(() => {
        try {
            // Save state, excluding transient state like activePanel
            const stateToSave = { ...state, activePanel: null };
            localStorage.setItem('aiAssistantState', JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [state]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);