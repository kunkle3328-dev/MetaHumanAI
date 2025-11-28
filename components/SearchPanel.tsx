
import React from 'react';
import { useAppContext } from '../context/AppContext';

export const SearchPanel: React.FC = () => {
    const { state } = useAppContext();
    const { isLoading, result, error } = state.searchState;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-t-accent border-r-accent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 bg-red-900/20 p-4 rounded-lg">
                <p className="font-bold">Search Failed</p>
                <p>{error}</p>
            </div>
        );
    }

    if (!result) {
        return (
            <div className="text-center text-text-secondary">
                <p>Ask a question to see search results here.</p>
                <p className="text-sm mt-2">Try asking about recent news or current events.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-accent mb-2">Answer</h3>
                <p className="text-text-primary whitespace-pre-wrap">{result.text}</p>
            </div>
            
            {result.sources && result.sources.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-accent mb-2">Sources</h3>
                    <ul className="space-y-2">
                        {result.sources.map((source, index) => (
                            <li key={index} className="bg-tertiary/50 p-3 rounded-lg hover:bg-tertiary/70 transition-colors">
                                <a
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3"
                                >
                                    <span className="flex-shrink-0 w-6 h-6 bg-secondary text-accent rounded-full flex items-center justify-center text-xs font-mono">{index + 1}</span>
                                    <span className="truncate text-blue-400 hover:underline">{source.title || source.uri}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};