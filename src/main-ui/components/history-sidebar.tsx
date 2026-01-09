import { Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuItem } from "@/components/ui/sidebar";
import { createLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { type PromptSession } from "@shared/types";

const log = createLogger('HistorySidebar');

type HistorySidebarProps = {
  sessions: PromptSession[];
  currentSessionId: string | null;
  onSelectSession: (session: PromptSession) => void;
  onDeleteSession: (id: string) => Promise<void>;
  onNewProject: () => void;
};

export function HistorySidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewProject,
}: HistorySidebarProps): React.JSX.Element {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sessions.filter(s => 
        (s.originalInput || "").toLowerCase().includes(q) ||
        (s.currentTitle || "").toLowerCase().includes(q)
      )
    : sessions;

  return (
    <Sidebar
      collapsible="none"
      className="w-[18rem] min-w-[18rem] max-w-[18rem] shrink-0 overflow-hidden"
    >
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <SidebarGroupLabel className="px-0">
            <SectionLabel>History</SectionLabel>
          </SidebarGroupLabel>
          <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={onNewProject}
            className="font-semibold interactive"
          >
            <Plus className="w-3 h-3" />
            NEW
          </Button>
        </div>
        </div>

        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            placeholder="Search projects…"
            className="pl-9"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 min-w-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filtered.length === 0 ? (
                <div className="ui-helper italic p-8 text-center leading-relaxed opacity-70">
                  {sessions.length === 0 ? "No projects yet." : "No matches."}
                </div>
              ) : (
                filtered.map((session) => (
                  <HistoryItem
                    key={session.id}
                    session={session}
                    isActive={session.id === currentSessionId}
                    onSelect={() => { onSelectSession(session); }}
                    onDelete={() => onDeleteSession(session.id)}
                  />
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

type HistoryItemProps = {
  session: PromptSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => Promise<void>;
};

function HistoryItem({ session, isActive, onSelect, onDelete }: HistoryItemProps): React.JSX.Element {
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const date = new Date(session.updatedAt);

  const handleDelete = async (): Promise<void> => {
    setDeleting(true);
    setConfirmOpen(false);
    try {
      await onDelete();
    } catch (error: unknown) {
      log.error("delete:failed", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <SidebarMenuItem>
        <div
          role="button"
          tabIndex={0}
          onClick={deleting ? undefined : onSelect}
          onKeyDown={(e) => {
            if ((e.key === "Enter" || e.key === " ") && !deleting) {
              e.preventDefault();
              onSelect();
            }
          }}
          className={cn(
            "flex-1 min-w-0 py-2.5 px-3 rounded-lg cursor-pointer border border-transparent transition-colors duration-150 outline-none focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-soft"
              : "hover:bg-sidebar-accent/60 hover:border-sidebar-border hover:text-sidebar-foreground"
          )}
        >
          <div className="flex flex-col gap-0.5">
            <span
              className={cn(
                "text-footnote font-medium leading-tight tracking-tight text-sidebar-foreground line-clamp-2 wrap-break-word",
                isActive && "font-semibold"
              )}
            >
              {session.currentTitle || session.originalInput || "Untitled Project"}
            </span>
            <span className="text-tiny text-sidebar-foreground/40">
              {date.toLocaleDateString()}
            </span>
          </div>
        </div>
        <SidebarMenuAction
          showOnHover
          data-testid="history-delete"
          disabled={deleting}
          onClick={() => { setConfirmOpen(true); }}
        >
          <Trash2 className="w-4 h-4" />
        </SidebarMenuAction>
      </SidebarMenuItem>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setConfirmOpen(false); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { SidebarInset };
