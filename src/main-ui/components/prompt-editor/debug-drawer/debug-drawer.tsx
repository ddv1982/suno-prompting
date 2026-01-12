/**
 * Debug Drawer Body Component
 *
 * Main component for displaying debug information in the debug drawer.
 * Shows LLM call details, request/response inspection, and metadata.
 *
 * @module components/prompt-editor/debug-drawer/debug-drawer
 */

import { useState } from "react";

import { RequestInspector } from "@/components/prompt-editor/request-inspector";
import { APP_CONSTANTS } from "@shared/constants";

import { LLMCallsSection } from "./debug-content";
import { DebugMetadataHeader } from "./debug-section";

import type { DebugDrawerBodyProps } from "./types";
import type { ReactElement } from "react";

/**
 * Main Debug Drawer Body component.
 * Displays debug information including metadata, LLM calls, and request/response data.
 */
export function DebugDrawerBody({ debugInfo }: DebugDrawerBodyProps): ReactElement {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string): void => {
    void navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => { setCopiedSection(null); }, APP_CONSTANTS.UI.COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <div className="mt-4 space-y-3 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 is-scrolling">
      <DebugMetadataHeader debugInfo={debugInfo} />
      <LLMCallsSection debugInfo={debugInfo} onCopy={copyToClipboard} copiedSection={copiedSection} />
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
