import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { api } from '@/services/rpc';
import { type PromptSession, type PromptVersion, type DebugInfo } from '@shared/types';
import { EMPTY_VALIDATION, type ValidationResult } from '@shared/validation';
import { buildChatMessages, type ChatMessage } from '@/lib/chat-utils';

export type GeneratingAction = 'none' | 'generate' | 'remix' | 'remixInstruments' | 'remixGenre' | 'remixMood';

interface AppContextType {
    sessions: PromptSession[];
    currentSession: PromptSession | null;
    validation: ValidationResult;
    isGenerating: boolean;
    generatingAction: GeneratingAction;
    chatMessages: ChatMessage[];
    settingsOpen: boolean;
    currentModel: string;
    debugInfo: DebugInfo | undefined;
    lockedPhrase: string;
    
    setSettingsOpen: (open: boolean) => void;
    setValidation: (v: ValidationResult) => void;
    setLockedPhrase: (phrase: string) => void;
    loadHistory: (retries?: number) => Promise<void>;
    selectSession: (session: PromptSession) => void;
    newProject: () => void;
    saveSession: (session: PromptSession) => Promise<void>;
    deleteSession: (id: string) => Promise<void>;
    handleGenerate: (input: string) => Promise<void>;
    handleCopy: () => void;
    handleRemix: () => Promise<void>;
    handleRemixInstruments: () => Promise<void>;
    handleRemixGenre: () => Promise<void>;
    handleRemixMood: () => Promise<void>;
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

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [sessions, setSessions] = useState<PromptSession[]>([]);
    const [currentSession, setCurrentSession] = useState<PromptSession | null>(null);
    const [validation, setValidation] = useState<ValidationResult>({ ...EMPTY_VALIDATION });
    const [generatingAction, setGeneratingAction] = useState<GeneratingAction>('none');
    const [settingsOpen, setSettingsOpen] = useState(false);
    
    const isGenerating = useMemo(() => generatingAction !== 'none', [generatingAction]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [currentModel, setCurrentModel] = useState("");
    const [debugInfo, setDebugInfo] = useState<DebugInfo | undefined>(undefined);
    const [lockedPhrase, setLockedPhrase] = useState("");

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
            setSessions(history);
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
    }, []);

    const newProject = useCallback(() => {
        setCurrentSession(null);
        setChatMessages([]);
        setValidation({ ...EMPTY_VALIDATION });
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

    const handleGenerate = useCallback(async (input: string) => {
        if (isGenerating) return;
        
        const currentPrompt = currentSession?.currentPrompt || "";
        const isInitial = !currentPrompt;
        const phraseToLock = lockedPhrase.trim() || undefined;

        try {
            setGeneratingAction('generate');

            let result;
            if (isInitial) {
                result = await api.generateInitial(input, phraseToLock);
            } else {
                setChatMessages((prev) => [...prev, { role: "user", content: input }]);
                result = await api.refinePrompt(currentPrompt, input, phraseToLock);
            }

            if (!result?.prompt) {
                throw new Error("Invalid result received from generation");
            }

            setDebugInfo(result.debugInfo);
            const now = new Date().toISOString();
            const newVersion: PromptVersion = {
                    id: result.versionId,
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
        } catch (error) {
            console.error("Generation failed:", error);
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content: `Error: ${error instanceof Error ? error.message : "Failed to generate prompt"}.`,
                },
            ]);
        } finally {
            setGeneratingAction('none');
        }
    }, [isGenerating, currentSession, saveSession, lockedPhrase]);

    const handleCopy = useCallback(() => {
        const prompt = currentSession?.currentPrompt || "";
        navigator.clipboard.writeText(prompt);
    }, [currentSession?.currentPrompt]);

    const handleRemix = useCallback(async () => {
        if (isGenerating || !currentSession?.originalInput) return;
        const phraseToLock = lockedPhrase.trim() || undefined;

        try {
            setGeneratingAction('remix');
            const result = await api.generateInitial(currentSession.originalInput, phraseToLock);

            if (!result?.prompt) {
                throw new Error("Invalid result received from remix");
            }

            setDebugInfo(result.debugInfo);
            const now = new Date().toISOString();
            const newVersion: PromptVersion = {
                id: result.versionId,
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
        } catch (error) {
            console.error("Remix failed:", error);
            setChatMessages((prev) => [
                ...prev,
                { role: "ai", content: `Error: ${error instanceof Error ? error.message : "Failed to remix prompt"}.` },
            ]);
        } finally {
            setGeneratingAction('none');
        }
    }, [isGenerating, currentSession, saveSession, lockedPhrase]);

    const handleRemixInstruments = useCallback(async () => {
        if (isGenerating || !currentSession?.currentPrompt || !currentSession?.originalInput) return;

        try {
            setGeneratingAction('remixInstruments');
            const result = await api.remixInstruments(
                currentSession.currentPrompt,
                currentSession.originalInput
            );

            if (!result?.prompt) {
                throw new Error("Invalid result received from instrument remix");
            }

            const now = new Date().toISOString();
            const newVersion: PromptVersion = {
                id: result.versionId,
                content: result.prompt,
                feedback: "[instruments remix]",
                timestamp: now,
            };

            const updatedSession: PromptSession = {
                ...currentSession,
                currentPrompt: result.prompt,
                versionHistory: [...currentSession.versionHistory, newVersion],
                updatedAt: now,
            };

            setChatMessages((prev) => [...prev, { role: "ai", content: "Instruments remixed." }]);
            setValidation(result.validation);
            await saveSession(updatedSession);
        } catch (error) {
            console.error("Instrument remix failed:", error);
            setChatMessages((prev) => [
                ...prev,
                { role: "ai", content: `Error: ${error instanceof Error ? error.message : "Failed to remix instruments"}.` },
            ]);
        } finally {
            setGeneratingAction('none');
        }
    }, [isGenerating, currentSession, saveSession]);

    const handleRemixGenre = useCallback(async () => {
        if (isGenerating || !currentSession?.currentPrompt) return;

        try {
            setGeneratingAction('remixGenre');
            const result = await api.remixGenre(currentSession.currentPrompt);

            if (!result?.prompt) {
                throw new Error("Invalid result received from genre remix");
            }

            const now = new Date().toISOString();
            const newVersion: PromptVersion = {
                id: result.versionId,
                content: result.prompt,
                feedback: "[genre remix]",
                timestamp: now,
            };

            const updatedSession: PromptSession = {
                ...currentSession,
                currentPrompt: result.prompt,
                versionHistory: [...currentSession.versionHistory, newVersion],
                updatedAt: now,
            };

            setChatMessages((prev) => [...prev, { role: "ai", content: "Genre remixed." }]);
            setValidation(result.validation);
            await saveSession(updatedSession);
        } catch (error) {
            console.error("Genre remix failed:", error);
            setChatMessages((prev) => [
                ...prev,
                { role: "ai", content: `Error: ${error instanceof Error ? error.message : "Failed to remix genre"}.` },
            ]);
        } finally {
            setGeneratingAction('none');
        }
    }, [isGenerating, currentSession, saveSession]);

    const handleRemixMood = useCallback(async () => {
        if (isGenerating || !currentSession?.currentPrompt) return;

        try {
            setGeneratingAction('remixMood');
            const result = await api.remixMood(currentSession.currentPrompt);

            if (!result?.prompt) {
                throw new Error("Invalid result received from mood remix");
            }

            const now = new Date().toISOString();
            const newVersion: PromptVersion = {
                id: result.versionId,
                content: result.prompt,
                feedback: "[mood remix]",
                timestamp: now,
            };

            const updatedSession: PromptSession = {
                ...currentSession,
                currentPrompt: result.prompt,
                versionHistory: [...currentSession.versionHistory, newVersion],
                updatedAt: now,
            };

            setChatMessages((prev) => [...prev, { role: "ai", content: "Mood remixed." }]);
            setValidation(result.validation);
            await saveSession(updatedSession);
        } catch (error) {
            console.error("Mood remix failed:", error);
            setChatMessages((prev) => [
                ...prev,
                { role: "ai", content: `Error: ${error instanceof Error ? error.message : "Failed to remix mood"}.` },
            ]);
        } finally {
            setGeneratingAction('none');
        }
    }, [isGenerating, currentSession, saveSession]);

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
            generatingAction,
            chatMessages,
            settingsOpen,
            currentModel,
            debugInfo,
            lockedPhrase,
            setSettingsOpen,
            setValidation,
            setLockedPhrase,
            loadHistory,
            selectSession,
            newProject,
            saveSession,
            deleteSession,
            handleGenerate,
            handleCopy,
            handleRemix,
            handleRemixInstruments,
            handleRemixGenre,
            handleRemixMood
        }}>
            {children}
        </AppContext.Provider>
    );
};
