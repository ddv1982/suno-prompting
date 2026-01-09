import { Settings } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createLogger } from "@/lib/logger";
import { api } from "@/services/rpc";
import { APP_CONSTANTS } from "@shared/constants";
import { type AIProvider, type APIKeys, DEFAULT_API_KEYS } from "@shared/types";

import { ApiKeySection } from "./api-key-section";
import { FeatureToggles } from "./feature-toggles";
import { LLMProviderToggle } from "./llm-provider-toggle";
import { ModelSection } from "./model-section";
import { OllamaSettings } from "./ollama-settings";

const log = createLogger('SettingsModal');

type SettingsModalProps = { isOpen: boolean; onClose: () => void };
const MODELS_BY_PROVIDER = APP_CONSTANTS.AI.MODELS_BY_PROVIDER;

export function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.ReactElement {
  const [provider, setProvider] = useState<AIProvider>(APP_CONSTANTS.AI.DEFAULT_PROVIDER);
  const [apiKeys, setApiKeys] = useState<APIKeys>({ ...DEFAULT_API_KEYS });
  const [model, setModel] = useState("");
  const [useSunoTags, setUseSunoTags] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS);
  const [debugMode, setDebugMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE);
  const [maxMode, setMaxMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_MAX_MODE);
  const [lyricsMode, setLyricsMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE);
  const [useLocalLLM, setUseLocalLLM] = useState<boolean>(true); // Default to local
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadSettings = async (): Promise<void> => {
      setError(null); setLoading(true);
      try {
        const settings = await api.getAllSettings();
        setProvider(settings.provider); setApiKeys(settings.apiKeys);
        const providerModels = MODELS_BY_PROVIDER[settings.provider];
        const modelExists = providerModels.some(m => m.id === settings.model);
        setModel(modelExists ? settings.model : providerModels[0].id);
        setUseSunoTags(settings.useSunoTags); setDebugMode(settings.debugMode);
        setMaxMode(settings.maxMode); setLyricsMode(settings.lyricsMode);
        setUseLocalLLM(settings.useLocalLLM ?? true); // Default to true if not set
      } catch (err: unknown) { log.error("fetchSettings:failed", err); setError("Unable to load settings."); }
      finally { setLoading(false); }
    };
    void loadSettings();
  }, [isOpen]);

  const handleProviderChange = (newProvider: AIProvider): void => {
    setProvider(newProvider); setShowKey(false);
    const models = MODELS_BY_PROVIDER[newProvider];
    if (models.length > 0) setModel(models[0].id);
  };
  const handleApiKeyChange = (value: string): void => { setApiKeys(prev => ({ ...prev, [provider]: value || null })); };

  const handleSave = async (): Promise<void> => {
    setSaving(true); setError(null);
    try {
      await api.saveAllSettings({
        provider, model, useSunoTags, debugMode, maxMode, lyricsMode, useLocalLLM,
        apiKeys: { groq: apiKeys.groq?.trim() || null, openai: apiKeys.openai?.trim() || null, anthropic: apiKeys.anthropic?.trim() || null },
      });
      onClose();
    } catch (e: unknown) { log.error("saveSettings:failed", e); setError("Failed to save settings. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25 bg-card border shadow-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Application Settings
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2 is-scrolling">
          <ApiKeySection
            provider={provider}
            apiKeys={apiKeys}
            showKey={showKey}
            loading={loading}
            error={error}
            onProviderChange={handleProviderChange}
            onApiKeyChange={handleApiKeyChange}
            onToggleShowKey={() => { setShowKey(!showKey); }}
          />

          <ModelSection
            provider={provider}
            model={model}
            loading={loading}
            onModelChange={setModel}
          />

          <LLMProviderToggle
            useLocalLLM={useLocalLLM}
            hasApiKey={apiKeys[provider] !== null && apiKeys[provider] !== ''}
            loading={loading}
            onToggle={setUseLocalLLM}
          />

          <FeatureToggles
            useSunoTags={useSunoTags}
            maxMode={maxMode}
            lyricsMode={lyricsMode}
            debugMode={debugMode}
            loading={loading}
            onUseSunoTagsChange={setUseSunoTags}
            onMaxModeChange={setMaxMode}
            onLyricsModeChange={setLyricsMode}
            onDebugModeChange={setDebugMode}
          />

          <OllamaSettings />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
