/**
 * Sidebar Components
 *
 * A comprehensive sidebar component system for building navigation layouts.
 * Split into focused modules for maintainability.
 *
 * @example
 * import {
 *   Sidebar,
 *   SidebarProvider,
 *   SidebarContent,
 *   SidebarMenu,
 *   useSidebar,
 * } from '@/components/ui/sidebar';
 */

// Provider and context
export {
  SidebarContext,
  SidebarProvider,
  useSidebar,
  type SidebarContextValue,
} from "./sidebar-provider"

// Layout components
export { Sidebar, SidebarInset, SidebarRail } from "./sidebar-layout"

// Section components
export {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "./sidebar-sections"

// Menu components
export {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./sidebar-menu"

// Input components
export { SidebarInput, SidebarSeparator } from "./sidebar-inputs"

// Trigger component
export { SidebarTrigger } from "./sidebar-trigger"
