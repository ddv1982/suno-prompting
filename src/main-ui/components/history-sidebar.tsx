import { useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuItem } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type PromptSession } from "@shared/types";

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
}: HistorySidebarProps) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sessions.filter(s => (s.originalInput || "").toLowerCase().includes(q))
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
            size="sm"
            onClick={onNewProject}
            className="h-7 px-2 text-tiny font-bold gap-1 interactive bg-background/40 backdrop-blur"
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="pl-9 bg-background/40 backdrop-blur"
          />
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 min-w-0">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filtered.length === 0 ? (
                <div className="text-xs text-muted-foreground italic p-8 text-center leading-relaxed">
                  {sessions.length === 0 ? "No projects yet." : "No matches."}
                </div>
              ) : (
                filtered.map((session) => (
                  <HistoryItem
                    key={session.id}
                    session={session}
                    isActive={session.id === currentSessionId}
                    onSelect={() => onSelectSession(session)}
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

function HistoryItem({ session, isActive, onSelect, onDelete }: HistoryItemProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const date = new Date(session.updatedAt);

  const handleDelete = async () => {
    setDeleting(true);
    setConfirmOpen(false);
    try {
      await onDelete();
    } catch (error) {
      console.error("Delete failed", error);
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
            "flex-1 min-w-0 py-2.5 px-3 rounded-lg cursor-pointer border border-transparent transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border shadow-sm"
              : "hover:bg-sidebar-accent/60 hover:border-sidebar-border hover:text-sidebar-foreground"
          )}
        >
          <div className="flex flex-col gap-0.5">
            <span
              className={cn(
                "text-sm font-medium leading-tight text-sidebar-foreground line-clamp-2 wrap-break-word",
                isActive && "font-semibold"
              )}
            >
              {session.originalInput || "Untitled Project"}
            </span>
            <span className="text-micro text-sidebar-foreground/50">
              {date.toLocaleDateString()}
            </span>
          </div>
        </div>
        <SidebarMenuAction
          showOnHover
          data-testid="history-delete"
          disabled={deleting}
          onClick={() => setConfirmOpen(true)}
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
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
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
