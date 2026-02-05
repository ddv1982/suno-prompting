/**
 * History Sidebar Component
 *
 * Main sidebar component for browsing and managing prompt sessions.
 *
 * @module components/history-sidebar/history-sidebar
 */

import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SectionLabel } from '@/components/ui/section-label';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar';

import { HistoryItem } from './history-item';

import type { HistorySidebarProps } from './types';
import type { ReactElement } from 'react';

/**
 * Main History Sidebar component for browsing and managing prompt sessions.
 */
export function HistorySidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewProject,
}: HistorySidebarProps): ReactElement {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? sessions.filter(
        (s) =>
          (s.originalInput || '').toLowerCase().includes(q) ||
          (s.currentTitle || '').toLowerCase().includes(q)
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
            onChange={(e) => {
              setQuery(e.target.value);
            }}
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
                  {sessions.length === 0 ? 'No projects yet.' : 'No matches.'}
                </div>
              ) : (
                filtered.map((session) => (
                  <HistoryItem
                    key={session.id}
                    session={session}
                    isActive={session.id === currentSessionId}
                    onSelect={() => {
                      onSelectSession(session);
                    }}
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
