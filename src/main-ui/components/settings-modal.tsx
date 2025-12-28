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

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [useSunoTags, setUseSunoTags] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_USE_SUNO_TAGS);
  const [debugMode, setDebugMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_DEBUG_MODE);
  const [maxMode, setMaxMode] = useState<boolean>(APP_CONSTANTS.AI.DEFAULT_MAX_MODE);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(true);
      api.getAllSettings()
        .then((settings) => {
          setApiKey(settings.apiKey || '');
          setModel(settings.model || APP_CONSTANTS.AI.DEFAULT_MODEL);
          setUseSunoTags(settings.useSunoTags);
          setDebugMode(settings.debugMode);
          setMaxMode(settings.maxMode);
        })
        .catch((err) => {
          console.error("Failed to fetch settings", err);
          setError("Unable to load settings.");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.saveAllSettings({
        apiKey: apiKey.trim(),
        model,
        useSunoTags,
        debugMode,
        maxMode
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
      <DialogContent className="sm:max-w-106.25 bg-card/70 backdrop-blur border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Application Settings
          </DialogTitle>
        </DialogHeader>
        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <SectionLabel>Groq API Key</SectionLabel>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                className="pr-10 bg-background/40 backdrop-blur"
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
              Get your key from <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">console.groq.com</a>
            </p>
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
              className="flex h-10 w-full rounded-lg border border-input bg-background/40 backdrop-blur px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <option value="">Loading...</option>}
              {APP_CONSTANTS.AI.AVAILABLE_MODELS.map((m) => (
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
              <Bug className="w-3 h-3" />
              Debug Mode
            </SectionLabel>
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <Switch checked={debugMode} onCheckedChange={setDebugMode} />
              <span className="text-sm">Show AI prompts sent to Groq</span>
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
