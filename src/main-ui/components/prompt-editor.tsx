import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SectionLabel } from "@/components/ui/section-label";
import { StatusIndicator } from "@/components/ui/status-indicator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FormLabel } from "@/components/ui/form-label";
import { Loader2, Check, Copy, Send, AlertCircle, AlertTriangle, Bug, Settings2, Lock, MessageSquare, Music2, Shuffle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { type ChatMessage } from "@/lib/chat-utils";
import { type ValidationResult, validateLockedPhrase } from "@shared/validation";
import { type DebugInfo, type EditorMode, type AdvancedSelection } from "@shared/types";
import { type GeneratingAction } from "@/context/AppContext";
import { APP_CONSTANTS } from "@shared/constants";
import { AdvancedPanel } from "@/components/advanced-panel";
import { RemixButtonGroup } from "@/components/remix-button-group";
import { ChatHistorySection } from "@/components/chat-history-section";
import { PromptOutput } from "@/components/prompt-output";

type PromptEditorProps = {
  currentPrompt: string;
  currentTitle?: string;
  currentLyrics?: string;
  isGenerating: boolean;
  generatingAction: GeneratingAction;
  validation: ValidationResult;
  chatMessages: ChatMessage[];
  lockedPhrase: string;
  editorMode: EditorMode;
  advancedSelection: AdvancedSelection;
  computedMusicPhrase: string;
  onLockedPhraseChange: (phrase: string) => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onAdvancedSelectionUpdate: (updates: Partial<AdvancedSelection>) => void;
  onAdvancedSelectionClear: () => void;
  onGenerate: (input: string) => void;
  onCopy: () => void;
  onRemix: () => void;
  onRemixInstruments: () => void;
  onRemixGenre: () => void;
  onRemixMood: () => void;
  onRemixStyleTags: () => void;
  onRemixRecording: () => void;
  onRemixTitle: () => void;
  onRemixLyrics: () => void;
  maxMode: boolean;
  lyricsMode: boolean;
  onLyricsModeChange: (mode: boolean) => void;
  maxChars?: number;
  currentModel?: string;
  debugInfo?: DebugInfo;
};

export function PromptEditor({
  currentPrompt,
  currentTitle,
  currentLyrics,
  isGenerating,
  generatingAction,
  validation,
  chatMessages,
  lockedPhrase,
  editorMode,
  advancedSelection,
  computedMusicPhrase,
  onLockedPhraseChange,
  onEditorModeChange,
  onAdvancedSelectionUpdate,
  onAdvancedSelectionClear,
  onGenerate,
  onCopy,
  onRemix,
  onRemixInstruments,
  onRemixGenre,
  onRemixMood,
  onRemixStyleTags,
  onRemixRecording,
  onRemixTitle,
  onRemixLyrics,
  maxMode,
  lyricsMode,
  onLyricsModeChange,
  maxChars = 1000,
  currentModel = "",
  debugInfo,
}: PromptEditorProps) {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(false);

  const { charCount, promptOverLimit, inputOverLimit, lockedPhraseValidation } = useMemo(() => ({
    charCount: currentPrompt.length,
    promptOverLimit: currentPrompt.length > maxChars,
    inputOverLimit: input.trim().length > maxChars,
    lockedPhraseValidation: validateLockedPhrase(lockedPhrase),
  }), [currentPrompt, input, maxChars, lockedPhrase]);

  const hasAdvancedSelection = editorMode === 'advanced' && (
    advancedSelection.harmonicStyle ||
    advancedSelection.harmonicCombination ||
    advancedSelection.polyrhythmCombination ||
    advancedSelection.timeSignature ||
    advancedSelection.timeSignatureJourney
  );

  const handleSend = () => {
    const trimmed = input.trim();
    const canRefineWithoutInput = editorMode === 'advanced' && currentPrompt && hasAdvancedSelection;
    
    if (!trimmed && !canRefineWithoutInput) return;
    if (isGenerating) return;
    if (trimmed.length > maxChars) return;
    if (!lockedPhraseValidation.isValid) return;
    onGenerate(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = () => {
    if (promptOverLimit) {
      return;
    }
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="flex-1 flex flex-col bg-background">
      <div className="flex-1 flex flex-col p-6 gap-6 max-w-6xl mx-auto w-full overflow-auto">
        {currentPrompt && (
          <div className="space-y-4">
            {/* Title Section - always shown when available */}
            {currentTitle && (
              <OutputSection
                label="Title"
                content={currentTitle}
                onCopy={() => navigator.clipboard.writeText(currentTitle)}
                onRemix={onRemixTitle}
                isGenerating={isGenerating}
                isRemixing={generatingAction === 'remixTitle'}
              />
            )}

            {/* Style Prompt Section - always shown */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <SectionLabel>Style Prompt</SectionLabel>
                <Badge
                  variant={promptOverLimit ? "destructive" : "secondary"}
                  className="text-tiny font-mono tabular-nums h-5"
                >
                  {charCount} / {maxChars}
                </Badge>
              </div>
              <Card className="relative group border shadow-sm glass-panel overflow-hidden">
                <CardContent className="p-6">
                  <PromptOutput text={currentPrompt} />
                </CardContent>
                <RemixButtonGroup
                  isGenerating={isGenerating}
                  generatingAction={generatingAction}
                  maxMode={maxMode}
                  copied={copied}
                  promptOverLimit={promptOverLimit}
                  hasDebugInfo={!!debugInfo}
                  onDebugOpen={() => setDebugOpen(true)}
                  onRemixGenre={onRemixGenre}
                  onRemixMood={onRemixMood}
                  onRemixInstruments={onRemixInstruments}
                  onRemixStyleTags={onRemixStyleTags}
                  onRemixRecording={onRemixRecording}
                  onRemix={onRemix}
                  onCopy={handleCopy}
                />
              </Card>
            </div>

            {/* Lyrics Section - only shown when lyrics mode is enabled */}
            {lyricsMode && currentLyrics && (
              <OutputSection
                label="Lyrics"
                content={currentLyrics}
                onCopy={() => navigator.clipboard.writeText(currentLyrics)}
                onRemix={onRemixLyrics}
                isGenerating={isGenerating}
                isRemixing={generatingAction === 'remixLyrics'}
                scrollable
              />
            )}
          </div>
        )}

        <ValidationMessages errors={validation.errors} warnings={validation.warnings} />

        {debugInfo && (
          <Sheet open={debugOpen} onOpenChange={setDebugOpen}>
            <SheetContent side="right" className="w-[min(640px,95vw)] sm:max-w-none">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  Debug Info
                </SheetTitle>
              </SheetHeader>
              <DebugDrawerBody debugInfo={debugInfo} />
            </SheetContent>
          </Sheet>
        )}

        <Separator className="opacity-50" />

        <ChatHistorySection
          chatMessages={chatMessages}
          isGenerating={isGenerating}
          expanded={chatExpanded}
          onExpandedChange={setChatExpanded}
        />
      </div>

      <div className="border-t bg-muted/10 p-6 shrink-0">
        <div className="max-w-6xl mx-auto w-full space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={editorMode === 'simple' ? 'default' : 'outline'}
                size="xs"
                onClick={() => onEditorModeChange('simple')}
                className="font-bold"
              >
                Simple
              </Button>
              <Button
                variant={editorMode === 'advanced' ? 'default' : 'outline'}
                size="xs"
                onClick={() => onEditorModeChange('advanced')}
                className="font-bold"
              >
                <Settings2 className="w-3 h-3" />
                Advanced
              </Button>
              {editorMode === 'simple' && (
                <span className="text-micro text-muted-foreground ml-2 hidden sm:inline">
                  AI auto-selects harmonic style, rhythm, and time signature
                </span>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer shrink-0">
              <Music2 className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-tiny text-muted-foreground">Lyrics</span>
              <Switch 
                checked={lyricsMode} 
                onCheckedChange={onLyricsModeChange}
                size="sm"
              />
            </label>
          </div>

          {/* Advanced Panel */}
          {editorMode === 'advanced' && (
            <AdvancedPanel
              selection={advancedSelection}
              onUpdate={onAdvancedSelectionUpdate}
              onClear={onAdvancedSelectionClear}
              computedPhrase={computedMusicPhrase}
            />
          )}

          {/* Locked Phrase - available in both modes */}
          <div className="space-y-1">
            <FormLabel
              icon={<Lock className="w-3 h-3" />}
              badge="optional"
              charCount={lockedPhrase ? lockedPhrase.length : undefined}
              maxChars={lockedPhrase ? APP_CONSTANTS.MAX_LOCKED_PHRASE_CHARS : undefined}
              error={!lockedPhraseValidation.isValid}
            >
              {editorMode === 'advanced' ? 'Additional Locked Text' : 'Locked Phrase'}
            </FormLabel>
            <Textarea
              value={lockedPhrase}
              onChange={(e) => onLockedPhraseChange(e.target.value)}
              className={cn(
                "min-h-12 max-h-24 resize-none shadow-sm text-sm p-3 rounded-lg glass-control focus-visible:ring-primary/20",
                !lockedPhraseValidation.isValid && "border-destructive focus-visible:ring-destructive/20"
              )}
              placeholder={editorMode === 'advanced' 
                ? "Additional text to lock (combined with music phrase above)"
                : "Text that will appear exactly as written in the output"}
            />
            {lockedPhraseValidation.error && (
              <p className="text-micro text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {lockedPhraseValidation.error}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <FormLabel icon={<MessageSquare className="w-3 h-3" />}>
              {currentPrompt ? 'Refine Prompt' : 'Describe Your Song'}
            </FormLabel>
            <div className="flex gap-3 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-20 flex-1 resize-none shadow-sm text-sm p-4 rounded-xl glass-control focus-visible:ring-primary/20"
                placeholder={lyricsMode 
                  ? "Describe your song's theme, story, and emotions for title + lyrics generation"
                  : "Describe your song, style, mood, or refine the existing prompt"
                }
              />
              <Button
                onClick={handleSend}
                disabled={
                  isGenerating ||
                  inputOverLimit ||
                  !lockedPhraseValidation.isValid ||
                  (!input.trim() && !(editorMode === 'advanced' && currentPrompt && hasAdvancedSelection))
                }
                size="sm"
                className={cn(
                  "h-9 px-4 rounded-lg gap-2 shadow-lg shadow-primary/10 shrink-0 interactive transition-all duration-300",
                  isGenerating && "w-9 px-0"
                )}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="font-bold text-tiny tracking-tight">
                      {currentPrompt ? "REFINE" : "GENERATE"}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {inputOverLimit && (
            <p className="text-caption text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Feedback is over {maxChars} characters.
            </p>
          )}

          <div className="flex justify-between items-center px-1">
            <span className="text-tiny text-muted-foreground flex items-center gap-4 font-mono">
              <span>⏎ send</span>
              <span>⇧⏎ new line</span>
            </span>
            <div className="flex items-center gap-4">
              {currentModel && (
                <span className="text-tiny font-bold uppercase tracking-tight text-primary/70">
                  {currentModel.split('/').pop()}
                </span>
              )}
              <StatusIndicator status={isGenerating ? "working" : "ready"} showLabel={false} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DebugDrawerBody({ debugInfo }: { debugInfo: DebugInfo }) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="text-tiny text-muted-foreground">
        <span className="font-mono text-foreground">{new Date(debugInfo.timestamp).toLocaleString()}</span>
      </div>
      <RequestInspector requestBody={debugInfo.requestBody} onCopy={copyToClipboard} copiedSection={copiedSection} />
    </div>
  );
}

function ValidationMessages({ errors, warnings }: { errors: string[]; warnings: string[] }) {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className="space-y-2 mt-2">
      {errors.map((error, i) => (
        <Alert key={i} className="py-2 px-4 glass-panel-subtle border-destructive/30 text-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-tiny ml-2">{error}</AlertDescription>
        </Alert>
      ))}
      {warnings.map((warning, i) => (
        <Alert key={i} className="py-2 px-4 glass-panel-subtle border-amber-500/30 text-amber-400">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-tiny ml-2">{warning}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

function OutputSection({ 
  label, 
  content, 
  onCopy,
  onRemix,
  isGenerating = false,
  isRemixing = false,
  scrollable = false 
}: { 
  label: string; 
  content: string; 
  onCopy: () => void;
  onRemix?: () => void;
  isGenerating?: boolean;
  isRemixing?: boolean;
  scrollable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <SectionLabel>{label}</SectionLabel>
      </div>
      <Card className="relative border shadow-sm glass-panel overflow-hidden">
        <CardContent className="p-4 sm:pr-36">
          {scrollable ? (
            <PromptOutput text={content} />
          ) : (
            <div className="font-mono text-sm">{content}</div>
          )}
        </CardContent>
        <div className="absolute top-4 right-4 flex gap-2">
          {onRemix && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRemix}
              disabled={isGenerating}
              className="font-bold glass-control"
            >
              <Shuffle className={cn("w-3.5 h-3.5", isRemixing && "animate-spin")} />
              REMIX
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className={cn(
              "font-bold glass-control transition-all duration-300",
              copied && "bg-emerald-500/20 text-emerald-500 border-emerald-500/50 hover:bg-emerald-500/30 hover:text-emerald-400"
            )}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "COPIED" : "COPY"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

type RequestMessage = { role: string; content: string };
type ParsedRequest = { model?: string; messages?: RequestMessage[]; [key: string]: unknown };

function RequestInspector({ 
  requestBody, 
  onCopy, 
  copiedSection 
}: { 
  requestBody: string; 
  onCopy: (text: string, section: string) => void;
  copiedSection: string | null;
}) {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [showRawJson, setShowRawJson] = useState(false);

  const parsed: ParsedRequest | null = useMemo(() => {
    try {
      return JSON.parse(requestBody);
    } catch {
      return null;
    }
  }, [requestBody]);

  const toggleMessage = (index: number) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const roleColors: Record<string, string> = {
    system: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    assistant: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  if (!parsed) {
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <SectionLabel>Groq Request Body</SectionLabel>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-tiny" onClick={() => onCopy(requestBody, 'request')}>
            {copiedSection === 'request' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
        <ScrollArea className="h-48 rounded-lg border bg-background/50">
          <pre className="p-3 text-caption font-mono whitespace-pre-wrap text-muted-foreground">{requestBody}</pre>
        </ScrollArea>
      </div>
    );
  }

  const modelName = typeof parsed.model === 'string' ? parsed.model.split('/').pop() : parsed.model;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel>Groq Request Body</SectionLabel>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-micro text-muted-foreground hover:text-foreground transition-colors underline"
          >
            {showRawJson ? "Structured" : "Raw JSON"}
          </button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-tiny" onClick={() => onCopy(requestBody, 'request')}>
            {copiedSection === 'request' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {showRawJson ? (
        <ScrollArea className="h-64 rounded-lg border bg-background/50">
          <pre className="p-3 text-caption font-mono whitespace-pre-wrap text-muted-foreground">{requestBody}</pre>
        </ScrollArea>
      ) : (
        <div className="space-y-2">
          {parsed.model && (
            <div className="flex items-center gap-2 text-caption">
              <span className="text-muted-foreground">Model:</span>
              <Badge variant="outline" className="font-mono text-tiny h-5">{modelName}</Badge>
            </div>
          )}

          {parsed.messages?.map((msg, idx) => {
            const isExpanded = expandedMessages.has(idx);
            const lines = msg.content.split('\n');
            const preview = lines.slice(0, 2).join('\n');
            const needsTruncation = lines.length > 2 || msg.content.length > 150;
            const displayContent = isExpanded || !needsTruncation ? msg.content : preview + (preview.length < msg.content.length ? '...' : '');

            return (
              <div key={idx} className="rounded-lg border bg-background/50 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 border-b">
                  <Badge variant="outline" className={cn("text-micro font-bold uppercase h-4 px-1.5", roleColors[msg.role] || "")}>
                    {msg.role}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <span className="text-micro text-muted-foreground">{msg.content.length} chars</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => onCopy(msg.content, `msg-${idx}`)}>
                      {copiedSection === `msg-${idx}` ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <pre className="text-tiny font-mono whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {displayContent}
                  </pre>
                  {needsTruncation && (
                    <button
                      onClick={() => toggleMessage(idx)}
                      className="mt-1 text-micro text-primary hover:underline"
                    >
                      {isExpanded ? "Show less" : `Show more (${lines.length} lines)`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
