import { useState } from "react";
import type { DebugInfo } from "@shared/types";
import { RequestInspector } from "@/components/prompt-editor/request-inspector";

type DebugDrawerBodyProps = {
  debugInfo: DebugInfo;
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
      <div className="text-tiny text-muted-foreground flex items-center gap-3">
        <span className="font-mono text-foreground">{new Date(debugInfo.timestamp).toLocaleString()}</span>
        <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold uppercase text-[10px] tracking-wide">
          {debugInfo.provider}
        </span>
        <span className="font-mono text-foreground/70 text-[10px]">
          {debugInfo.model.split('/').pop()}
        </span>
      </div>
      <RequestInspector
        requestBody={debugInfo.requestBody}
        responseBody={debugInfo.responseBody}
        provider={debugInfo.provider}
        onCopy={copyToClipboard}
        copiedSection={copiedSection}
      />
    </div>
  );
}
