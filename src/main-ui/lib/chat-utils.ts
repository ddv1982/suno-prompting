import { type PromptSession, type PromptVersion } from "@shared/types";

export interface ChatMessage { role: "user" | "ai"; content: string }

function formatVersionMessage(action: "Generated" | "Refined", version: PromptVersion): string {
  const titlePart = version.title ? ` - "${version.title}"` : "";
  const lyricsPart = version.lyrics ? " with lyrics" : "";
  return `${action} prompt${titlePart}${lyricsPart}.`;
}

export function buildChatMessages(session: PromptSession): ChatMessage[] {
  const messages: ChatMessage[] = [];
  messages.push({ role: "ai", content: `Project initialized: "${session.originalInput}"` });

  session.versionHistory.forEach((version, index) => {
    if (index === 0) {
      if (version.lockedPhrase) {
        messages.push({ role: "ai", content: `Locked: "${version.lockedPhrase}"` });
      }
      messages.push({ role: "ai", content: formatVersionMessage("Generated", version) });
      return;
    }
    if (version.feedback) {
      messages.push({ role: "user", content: version.feedback });
    }
    if (version.lockedPhrase) {
      messages.push({ role: "ai", content: `Locked: "${version.lockedPhrase}"` });
    }
    messages.push({ role: "ai", content: formatVersionMessage("Refined", version) });
  });

  return messages;
}
