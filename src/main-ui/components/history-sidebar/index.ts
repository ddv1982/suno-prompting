/**
 * History Sidebar Components
 *
 * Barrel export for history sidebar components.
 * Maintains backward compatibility with existing imports.
 *
 * @module components/history-sidebar
 */

export { HistorySidebar } from "./history-sidebar";
export { HistoryItem } from "./history-item";
export type { HistorySidebarProps, HistoryItemProps } from "./types";

// Re-export SidebarInset for backward compatibility
export { SidebarInset } from "@/components/ui/sidebar";
