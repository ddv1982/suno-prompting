import { useEffect, useState } from "react";
import { AlertCircle, Bug, Eye, EyeOff, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SectionLabel } from "@/components/ui/section-label";
import { api } from "@/services/rpc";
import { APP_CONSTANTS } from "@shared/constants";
import { type AIProvider, type APIKeys, DEFAULT_API_KEYS } from "@shared/types";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const PROVIDERS = APP_CONSTANTS.AI.PROVIDERS;
const MODELS_BY_PROVIDER = APP_CONSTANTS.AI.MODELS_BY_PROVIDER;
const selectClassName = "flex h-[var(--height-control-md)] w-full rounded-lg border border-input bg-input px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

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

  const currentProvider = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0];
  const availableModels = MODELS_BY_PROVIDER[provider];
  const currentApiKey = apiKeys[provider] || '';

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(true);
      api.getAllSettings()
        .then((settings) => {
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
        })
        .catch((err) => {
          console.error("Failed to fetch settings", err);
          setError("Unable to load settings.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleProviderChange = (newProvider: AIProvider) => {
    setProvider(newProvider);
    setShowKey(false); // Reset password visibility when switching providers
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
      console.error("Failed to save settings", e);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106.25 bg-card border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Application Settings
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2 is-scrolling">
          <div className="space-y-2">
            <SectionLabel>AI Provider</SectionLabel>
            <select
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
              disabled={loading}
              className={selectClassName}
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-tiny text-muted-foreground">
              Select your preferred AI provider
            </p>
          </div>

          <div className="space-y-2">
            <SectionLabel>{currentProvider.name} API Key</SectionLabel>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={currentApiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
                placeholder={currentProvider.keyPlaceholder}
                className="pr-10 bg-input"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-tiny text-muted-foreground">
              Get your key from <a href={currentProvider.keyUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">{currentProvider.keyUrl.replace('https://', '')}</a>
            </p>
            {!currentApiKey && !loading && (
              <p className="text-tiny text-amber-500">
                No API key configured for {currentProvider.name}. Generation will fail.
              </p>
            )}
            {error && (
              <p className="text-caption text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <SectionLabel>AI Model</SectionLabel>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={loading}
              className={selectClassName}
            >
              {loading && <option value="">Loading...</option>}
              {availableModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="text-tiny text-muted-foreground">
              Select the AI model for generating prompts
            </p>
          </div>

          <div className="space-y-2">
            <SectionLabel>Song Structure Tags</SectionLabel>
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <Switch checked={useSunoTags} onCheckedChange={setUseSunoTags} disabled={maxMode} />
              <span className={`text-sm ${maxMode ? 'text-muted-foreground' : ''}`}>Include [VERSE], [CHORUS], etc.</span>
            </label>
            <p className="text-tiny text-muted-foreground">
              When enabled, prompts include Suno V5 section and performance tags
              {maxMode && <span className="block text-amber-500 mt-1">Disabled when Max Mode is enabled</span>}
            </p>
          </div>

          <div className="space-y-2">
            <SectionLabel className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Max Mode
            </SectionLabel>
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <Switch checked={maxMode} onCheckedChange={setMaxMode} />
              <span className="text-sm">Enable Suno Max Mode tags</span>
            </label>
            <p className="text-tiny text-muted-foreground">
              Uses community-discovered prompt format for higher quality output.
              Best for acoustic, country, rock, and organic genres.
              Not recommended for electronic music.
            </p>
          </div>

          <div className="space-y-2">
            <SectionLabel className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Lyrics Mode
            </SectionLabel>
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <Switch checked={lyricsMode} onCheckedChange={setLyricsMode} />
              <span className="text-sm">Generate lyrics with prompts</span>
            </label>
            <p className="text-tiny text-muted-foreground">
              When enabled, generates a song title, style prompt, and lyrics in three sections.
              {maxMode && <span className="block text-amber-500 mt-1">In Max Mode, lyrics start with ///*****///</span>}
            </p>
          </div>

          <div className="space-y-2">
            <SectionLabel className="flex items-center gap-1">
              <Bug className="w-3 h-3" />
              Debug Mode
            </SectionLabel>
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <Switch checked={debugMode} onCheckedChange={setDebugMode} />
              <span className="text-sm">Show AI prompts sent to provider</span>
            </label>
            <p className="text-tiny text-muted-foreground">
              When enabled, displays the system and user prompts sent to the AI model
            </p>
          </div>
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
