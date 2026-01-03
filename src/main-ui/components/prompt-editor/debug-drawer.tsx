import { useState } from "react";
import type { DebugInfo } from "@shared/types";
import { RequestInspector } from "@/components/prompt-editor/request-inspector";

type DebugDrawerBodyProps = {
  debugInfo: Partial<DebugInfo>;
};

export function DebugDrawerBody({ debugInfo }: DebugDrawerBodyProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="mt-4 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 is-scrolling">
      <div className="ui-helper flex items-center gap-3">
        <span className="font-mono text-foreground">
          {debugInfo.timestamp ? new Date(debugInfo.timestamp).toLocaleString() : 'N/A'}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary ui-label">
          {debugInfo.provider ?? 'unknown'}
        </span>
        <span className="font-mono text-foreground/70">
          {debugInfo.model?.split('/').pop() ?? 'unknown'}
        </span>
      </div>
      <RequestInspector
        requestBody={debugInfo.requestBody ?? ''}
        responseBody={debugInfo.responseBody ?? ''}
        provider={debugInfo.provider ?? 'unknown'}
        onCopy={copyToClipboard}
        copiedSection={copiedSection}
      />
    </div>
  );
}
