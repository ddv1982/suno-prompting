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
import { ModelSection } from "./model-section";

const log = createLogger('SettingsModal');

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MODELS_BY_PROVIDER = APP_CONSTANTS.AI.MODELS_BY_PROVIDER;

// eslint-disable-next-line max-lines-per-function -- Modal with API keys, provider selection, and multiple toggles
export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [provider, setProvider] = useState<AIProvider>(APP_CONSTANTS.AI.DEFAULT_PROVIDER);
  const [apiKeys, setApiKeys] = useState<APIKeys>({ ...DEFAULT_API_KEYS });
  const [model, setModel] = useState("");
  const [useSunoTags, setUseSunoTags] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS);
  const [debugMode, setDebugMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE);
  const [maxMode, setMaxMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_MAX_MODE);
  const [lyricsMode, setLyricsMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_LYRICS_MODE);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const loadSettings = async () => {
      setError(null);
      setLoading(true);
      try {
        const settings = await api.getAllSettings();
        setProvider(settings.provider);
        setApiKeys(settings.apiKeys);
        // Validate model exists in provider's model list
        const providerModels = MODELS_BY_PROVIDER[settings.provider];
        const modelExists = providerModels.some(m => m.id === settings.model);
        setModel(modelExists ? settings.model : providerModels[0].id);
        setUseSunoTags(settings.useSunoTags);
        setDebugMode(settings.debugMode);
        setMaxMode(settings.maxMode);
        setLyricsMode(settings.lyricsMode);
      } catch (err) {
        log.error("fetchSettings:failed", err);
        setError("Unable to load settings.");
      } finally {
        setLoading(false);
      }
    };
    void loadSettings();
  }, [isOpen]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setShowKey(false);
    // Auto-select first model for new provider
    const models = MODELS_BY_PROVIDER[newProvider];
    if (models.length > 0) {
      setModel(models[0].id);
    }
  };

  const handleApiKeyChange = (value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value || null }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.saveAllSettings({
        provider,
        apiKeys: {
          groq: apiKeys.groq?.trim() || null,
          openai: apiKeys.openai?.trim() || null,
          anthropic: apiKeys.anthropic?.trim() || null,
        },
        model,
        useSunoTags,
        debugMode,
        maxMode,
        lyricsMode
      });
      onClose();
    } catch (e) {
      log.error("saveSettings:failed", e);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
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
