import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettingsModalState } from "@/hooks/use-settings-modal-state";

import { ApiKeySection } from "./api-key-section";
import { FeatureToggles } from "./feature-toggles";
import { LLMProviderToggle } from "./llm-provider-toggle";
import { ModelSection } from "./model-section";
import { OllamaSettings } from "./ollama-settings";

type SettingsModalProps = { isOpen: boolean; onClose: () => void };

export function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.ReactElement {
  const [state, actions] = useSettingsModalState(isOpen);

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
            provider={state.provider}
            apiKeys={state.apiKeys}
            showKey={state.showKey}
            loading={state.loading}
            error={state.error}
            onProviderChange={actions.handleProviderChange}
            onApiKeyChange={actions.handleApiKeyChange}
            onToggleShowKey={actions.toggleShowKey}
          />

          <ModelSection
            provider={state.provider}
            model={state.model}
            loading={state.loading}
            onModelChange={actions.setModel}
          />

          <LLMProviderToggle
            useLocalLLM={state.useLocalLLM}
            hasApiKey={state.apiKeys[state.provider] !== null && state.apiKeys[state.provider] !== ''}
            loading={state.loading}
            onToggle={actions.setUseLocalLLM}
          />

          <FeatureToggles
            useSunoTags={state.useSunoTags}
            maxMode={state.maxMode}
            lyricsMode={state.lyricsMode}
            debugMode={state.debugMode}
            loading={state.loading}
            onUseSunoTagsChange={actions.setUseSunoTags}
            onMaxModeChange={actions.setMaxMode}
            onLyricsModeChange={actions.setLyricsMode}
            onDebugModeChange={actions.setDebugMode}
          />

          <OllamaSettings />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={state.saving}>
            Cancel
          </Button>
          <Button onClick={() => actions.handleSave(onClose)} disabled={state.saving || state.loading}>
            {state.saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
