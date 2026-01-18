/**
 * History Item Component
 *
 * Individual history item with selection and delete functionality.
 *
 * @module components/history-sidebar/history-item
 */

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SidebarMenuAction, SidebarMenuItem } from "@/components/ui/sidebar";
import { createLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";

import type { HistoryItemProps } from "./types";
import type { ReactElement } from "react";

const log = createLogger('HistoryItem');

/**
 * Individual history item with selection and delete functionality.
 */
export function HistoryItem({ session, isActive, onSelect, onDelete }: HistoryItemProps): ReactElement {
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const displayDate = useMemo(() => new Date(session.updatedAt).toLocaleDateString(), [session.updatedAt]);

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
              {displayDate}
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
          <DialogFooter className="gap-2">
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
