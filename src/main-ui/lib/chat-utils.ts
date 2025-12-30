import { type PromptSession } from "@shared/types";

export type ChatMessage = { role: "user" | "ai"; content: string };

export function buildChatMessages(session: PromptSession): ChatMessage[] {
  const messages: ChatMessage[] = [];
  messages.push({ role: "ai", content: `Project initialized: "${session.originalInput}"` });

  session.versionHistory.forEach((version, index) => {
    if (index === 0) {
      if (version.lockedPhrase) {
        messages.push({ role: "ai", content: `Locked: "${version.lockedPhrase}"` });
      }
      const titlePart = version.title ? ` - "${version.title}"` : "";
      const lyricsPart = version.lyrics ? " with lyrics" : "";
      messages.push({ role: "ai", content: `Generated prompt${titlePart}${lyricsPart}.` });
      return;
    }
    if (version.feedback) {
      messages.push({ role: "user", content: version.feedback });
    }
    if (version.lockedPhrase) {
      messages.push({ role: "ai", content: `Locked: "${version.lockedPhrase}"` });
    }
    const titlePart = version.title ? ` - "${version.title}"` : "";
    const lyricsPart = version.lyrics ? " with lyrics" : "";
    messages.push({ role: "ai", content: `Refined prompt${titlePart}${lyricsPart}.` });
  });

  return messages;
}
