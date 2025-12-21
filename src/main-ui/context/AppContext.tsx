import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api, setStreamCallback, setCondensingCallback } from '@/services/rpc';
import { type PromptSession, type PromptVersion, type DebugInfo } from '@shared/types';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';
import { buildChatMessages, type ChatMessage } from '@/lib/chat-utils';
import { sortByUpdated } from '@shared/session-utils';

interface AppContextType {
    sessions: PromptSession[];
    currentSession: PromptSession | null;
    validation: ValidationResult;
    isGenerating: boolean;
    isCondensing: boolean;
    chatMessages: ChatMessage[];
    settingsOpen: boolean;
    streamingPrompt: string;
    currentModel: string;
    debugInfo: DebugInfo | undefined;
    
    setSettingsOpen: (open: boolean) => void;
    setValidation: (v: ValidationResult) => void;
    loadHistory: (retries?: number) => Promise<void>;
    selectSession: (session: PromptSession) => void;
    newProject: () => void;
    saveSession: (session: PromptSession) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    handleGenerate: (input: string) => Promise<void>;
    handleCopy: () => void;
    handleRemix: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within AppProvider');
    return context;
};

function generateId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return (
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
    );
}

type StreamingState = {
    setIsGenerating: (v: boolean) => void;
    setIsCondensing: (v: boolean) => void;
    setStreamingPrompt: (v: string | ((prev: string) => string)) => void;
};

async function withStreamingCallbacks<T>(
    state: StreamingState,
    operation: () => Promise<T>
): Promise<T> {
    state.setIsGenerating(true);
    state.setIsCondensing(false);
    state.setStreamingPrompt("");
    
    setStreamCallback((chunk) => {
        state.setStreamingPrompt((prev) => prev + chunk);
    });
    
    setCondensingCallback((status) => {
        if (status === 'start') {
            state.setIsCondensing(true);
            state.setStreamingPrompt("");
        } else {
            state.setIsCondensing(false);
        }
    });

    try {
        return await operation();
    } finally {
        state.setIsGenerating(false);
        state.setIsCondensing(false);
        state.setStreamingPrompt("");
        setStreamCallback(null);
        setCondensingCallback(null);
    }
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [sessions, setSessions] = useState<PromptSession[]>([]);
    const [currentSession, setCurrentSession] = useState<PromptSession | null>(null);
    const [validation, setValidation] = useState<ValidationResult>({ ...EMPTY_VALIDATION });
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCondensing, setIsCondensing] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [streamingPrompt, setStreamingPrompt] = useState("");
    const [currentModel, setCurrentModel] = useState("");
    const [debugInfo, setDebugInfo] = useState<DebugInfo | undefined>(undefined);

    const loadModel = useCallback(async () => {
        try {
            const model = await api.getModel();
            setCurrentModel(model);
        } catch (error) {
            console.error("Failed to load model", error);
        }
    }, []);

    const loadHistory = useCallback(async (retries = 1) => {
        try {
            const history = await api.getHistory();
            setSessions(sortByUpdated(history));
        } catch (error) {
            if (retries > 0) {
                await new Promise((resolve) => setTimeout(resolve, 400));
                return loadHistory(retries - 1);
            }
            console.error("Failed to load history", error);
        }
    }, []);

    const selectSession = useCallback((session: PromptSession) => {
        setCurrentSession(session);
        setChatMessages(buildChatMessages(session));
        setValidation({ ...EMPTY_VALIDATION });
        setStreamingPrompt("");
    }, []);

    const newProject = useCallback(() => {
        setCurrentSession(null);
        setChatMessages([]);
        setValidation({ ...EMPTY_VALIDATION });
        setStreamingPrompt("");
    }, []);

    const saveSession = useCallback(async (session: PromptSession) => {
        setSessions((prev) => {
            const filtered = prev.filter(s => s.id !== session.id);
            return [session, ...filtered];
        });
        setCurrentSession(session);
        try {
            await api.saveSession(session);
        } catch (error) {
            console.error("Failed to save session", error);
        }
    }, []);

    const deleteSession = useCallback(async (id: string) => {
        try {
            await api.deleteSession(id);
            setSessions((prev) => prev.filter(s => s.id !== id));
            if (currentSession?.id === id) {
                newProject();
            }
        } catch (error) {
            console.error("Delete failed", error);
        }
    }, [currentSession?.id, newProject]);

    const streamingState: StreamingState = {
        setIsGenerating,
        setIsCondensing,
        setStreamingPrompt,
    };

    const handleGenerate = useCallback(async (input: string) => {
        if (isGenerating) return;
        
        const currentPrompt = currentSession?.currentPrompt || "";
        const isInitial = !currentPrompt;

        try {
            await withStreamingCallbacks(streamingState, async () => {
                let result;
                if (isInitial) {
                    result = await api.generateInitial(input);
                } else {
                    setChatMessages((prev) => [...prev, { role: "user", content: input }]);
                    result = await api.refinePrompt(currentPrompt, input);
                }

                if (!result?.prompt) {
                    throw new Error("Invalid result received from generation");
                }

                setDebugInfo(result.debugInfo);
                const now = new Date().toISOString();
                const newVersion: PromptVersion = {
                    id: result.versionId || generateId(),
                    content: result.prompt,
                    feedback: !isInitial ? input : undefined,
                    timestamp: now,
                };

                let updatedSession: PromptSession;
                if (isInitial || !currentSession) {
                    updatedSession = {
                        id: generateId(),
                        originalInput: input,
                        currentPrompt: result.prompt,
                        versionHistory: [newVersion],
                        createdAt: now,
                        updatedAt: now,
                    };
                    setChatMessages(buildChatMessages(updatedSession));
                } else {
                    updatedSession = {
                        ...currentSession,
                        currentPrompt: result.prompt,
                        versionHistory: [...currentSession.versionHistory, newVersion],
                        updatedAt: now,
                    };
                    setChatMessages((prev) => [...prev, { role: "ai", content: "Updated prompt generated." }]);
                }

                setValidation(result.validation);
                await saveSession(updatedSession);
                await loadHistory(0);
            });
        } catch (error) {
            console.error("Generation failed:", error);
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content: `Error: ${error instanceof Error ? error.message : "Failed to generate prompt"}.`,
                },
            ]);
        }
    }, [isGenerating, currentSession, saveSession, loadHistory]);

    const handleCopy = useCallback(() => {
        const prompt = currentSession?.currentPrompt || "";
        navigator.clipboard.writeText(prompt);
    }, [currentSession?.currentPrompt]);

    const handleRemix = useCallback(async () => {
        if (isGenerating || !currentSession?.originalInput) return;

        try {
            await withStreamingCallbacks(streamingState, async () => {
                const result = await api.generateInitial(currentSession.originalInput);

                if (!result?.prompt) {
                    throw new Error("Invalid result received from remix");
                }

                setDebugInfo(result.debugInfo);
                const now = new Date().toISOString();
                const newVersion: PromptVersion = {
                    id: result.versionId || generateId(),
                    content: result.prompt,
                    feedback: "[remix]",
                    timestamp: now,
                };

                const updatedSession: PromptSession = {
                    ...currentSession,
                    currentPrompt: result.prompt,
                    versionHistory: [...currentSession.versionHistory, newVersion],
                    updatedAt: now,
                };

                setChatMessages((prev) => [...prev, { role: "ai", content: "Remixed prompt generated." }]);
                setValidation(result.validation);
                await saveSession(updatedSession);
                await loadHistory(0);
            });
        } catch (error) {
            console.error("Remix failed:", error);
            setChatMessages((prev) => [
                ...prev,
                { role: "ai", content: `Error: ${error instanceof Error ? error.message : "Failed to remix prompt"}.` },
            ]);
        }
    }, [isGenerating, currentSession, saveSession, loadHistory]);

    useEffect(() => {
        loadHistory();
        loadModel();
    }, [loadHistory, loadModel]);

    // Reload model when settings modal closes
    useEffect(() => {
        if (!settingsOpen) {
            loadModel();
        }
    }, [settingsOpen, loadModel]);

    return (
        <AppContext.Provider value={{
            sessions,
            currentSession,
            validation,
            isGenerating,
            isCondensing,
            chatMessages,
            settingsOpen,
            streamingPrompt,
            currentModel,
            debugInfo,
            setSettingsOpen,
            setValidation,
            loadHistory,
            selectSession,
            newProject,
            saveSession,
            deleteSession,
            handleGenerate,
            handleCopy,
            handleRemix
        }}>
            {children}
        </AppContext.Provider>
    );
};
