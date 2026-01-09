import { AlertCircle, RefreshCw, Server } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { Slider } from "@/components/ui/slider";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { createLogger } from "@/lib/logger";
import { api } from "@/services/rpc";

const log = createLogger("OllamaSettings");

type OllamaStatus = "checking" | "available" | "unavailable" | "missing-model";

interface OllamaSettings {
  endpoint: string;
  temperature: number;
  maxTokens: number;
  contextLength: number;
}

export function OllamaSettings(): React.JSX.Element {
  const [status, setStatus] = useState<OllamaStatus>("checking");
  const [settings, setSettings] = useState<OllamaSettings>({
    endpoint: "http://localhost:11434",
    temperature: 0.7,
    maxTokens: 2000,
    contextLength: 4096,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkStatus = useCallback(async (): Promise<void> => {
    setStatus("checking");
    setIsRefreshing(true);
    try {
      const result = await api.checkOllamaStatus();
      if (!result.available) {
        setStatus("unavailable");
      } else if (!result.hasGemma) {
        setStatus("missing-model");
      } else {
        setStatus("available");
      }
    } catch (error) {
      log.error("checkStatus:failed", error);
      setStatus("unavailable");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const loadSettings = useCallback(async (): Promise<void> => {
    try {
      const result = await api.getOllamaSettings();
      setSettings(result);
    } catch (error) {
      log.error("loadSettings:failed", error);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
    void checkStatus();
  }, [loadSettings, checkStatus]);

  const handleEndpointChange = useCallback(
    async (value: string): Promise<void> => {
      setSettings((prev) => ({ ...prev, endpoint: value }));
      try {
        await api.setOllamaSettings({ endpoint: value });
        // Re-check status when endpoint changes
        void checkStatus();
      } catch (error) {
        log.error("setEndpoint:failed", error);
      }
    },
    [checkStatus]
  );

  const handleTemperatureChange = useCallback(async (value: number[]): Promise<void> => {
    const temperature = value[0] ?? 0.7;
    setSettings((prev) => ({ ...prev, temperature }));
    try {
      await api.setOllamaSettings({ temperature });
    } catch (error) {
      log.error("setTemperature:failed", error);
    }
  }, []);

  const handleMaxTokensChange = useCallback(async (value: number[]): Promise<void> => {
    const maxTokens = value[0] ?? 2000;
    setSettings((prev) => ({ ...prev, maxTokens }));
    try {
      await api.setOllamaSettings({ maxTokens });
    } catch (error) {
      log.error("setMaxTokens:failed", error);
    }
  }, []);

  const handleContextLengthChange = useCallback(async (value: number[]): Promise<void> => {
    const contextLength = value[0] ?? 4096;
    setSettings((prev) => ({ ...prev, contextLength }));
    try {
      await api.setOllamaSettings({ contextLength });
    } catch (error) {
      log.error("setContextLength:failed", error);
    }
  }, []);

  const getStatusIndicatorStatus = (): "ready" | "working" | "error" => {
    if (status === "checking") return "working";
    if (status === "available") return "ready";
    return "error";
  };

  const getStatusLabel = (): string => {
    switch (status) {
      case "checking":
        return "Checking Ollama...";
      case "available":
        return "Ollama Ready";
      case "unavailable":
        return "Ollama Not Running";
      case "missing-model":
        return "Model Not Installed";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-4 border-t border-border/50 pt-[var(--space-4)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-muted-foreground" />
          <SectionLabel>Ollama Local LLM</SectionLabel>
        </div>
        <Button
          variant="outline"
          size="icon-xs"
          onClick={checkStatus}
          disabled={isRefreshing}
          aria-label="Refresh Ollama status"
        >
          <RefreshCw className={isRefreshing ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />
        </Button>
      </div>

      {/* Status Indicator */}
      <div className="space-y-2">
        <StatusIndicator
          status={getStatusIndicatorStatus()}
          label={getStatusLabel()}
          showLabel={true}
        />

        {/* Error Messages */}
        {status === "unavailable" && (
          <p className="ui-helper text-amber-500 flex items-start gap-2 pl-4">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Ollama server is not running. Start it with: <code className="bg-muted px-1.5 py-0.5 rounded text-[length:var(--text-caption)]">ollama serve</code>
            </span>
          </p>
        )}

        {status === "missing-model" && (
          <p className="ui-helper text-amber-500 flex items-start gap-2 pl-4">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Gemma 3 4B model not found. Install with: <code className="bg-muted px-1.5 py-0.5 rounded text-[length:var(--text-caption)]">ollama pull gemma3:4b</code>
            </span>
          </p>
        )}
      </div>

      {/* Endpoint Input */}
      <div className="space-y-2">
        <label htmlFor="ollama-endpoint" className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
          Endpoint URL
        </label>
        <Input
          id="ollama-endpoint"
          type="text"
          value={settings.endpoint}
          onChange={(e) => { void handleEndpointChange(e.target.value); }}
          placeholder="http://localhost:11434"
          className="font-mono text-[length:var(--text-caption)]"
        />
        <p className="ui-helper">
          Ollama server endpoint address
        </p>
      </div>

      {/* Temperature Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="ollama-temperature" className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
            Temperature
          </label>
          <span className="text-[length:var(--text-caption)] font-mono tabular-nums text-muted-foreground">
            {settings.temperature.toFixed(1)}
          </span>
        </div>
        <Slider
          value={[settings.temperature]}
          onValueChange={handleTemperatureChange}
          min={0}
          max={1}
          step={0.1}
          aria-label="Temperature"
        />
        <p className="ui-helper">
          Controls randomness: 0 = deterministic, 1 = creative
        </p>
      </div>

      {/* Max Tokens Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="ollama-max-tokens" className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
            Max Tokens
          </label>
          <span className="text-[length:var(--text-caption)] font-mono tabular-nums text-muted-foreground">
            {settings.maxTokens}
          </span>
        </div>
        <Slider
          value={[settings.maxTokens]}
          onValueChange={handleMaxTokensChange}
          min={500}
          max={4000}
          step={100}
          aria-label="Max tokens"
        />
        <p className="ui-helper">
          Maximum number of tokens to generate
        </p>
      </div>

      {/* Context Length Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="ollama-context-length" className="text-[length:var(--text-footnote)] text-muted-foreground font-medium">
            Context Length
          </label>
          <span className="text-[length:var(--text-caption)] font-mono tabular-nums text-muted-foreground">
            {settings.contextLength}
          </span>
        </div>
        <Slider
          value={[settings.contextLength]}
          onValueChange={handleContextLengthChange}
          min={2048}
          max={8192}
          step={1024}
          aria-label="Context length"
        />
        <p className="ui-helper">
          Maximum context window size
        </p>
      </div>
    </div>
  );
}
