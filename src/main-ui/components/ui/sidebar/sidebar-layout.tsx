'use client';

import * as React from 'react';

import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import { useSidebar } from './sidebar-provider';

import type { ReactElement } from 'react';

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
  }
>(
  (
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'icon',
      className,
      style,
      children,
      ...props
    },
    ref
  ): ReactElement => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    const widthValue =
      state === 'collapsed' ? 'var(--sidebar-width-icon, 3rem)' : 'var(--sidebar-width, 18rem)';
    const resolvedWidth = collapsible === 'none' ? 'var(--sidebar-width, 18rem)' : widthValue;

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
          <SheetContent
            data-sidebar="sidebar"
            data-mobile="true"
            className="w-[--sidebar-width-mobile] bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
            side={side}
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <aside
        ref={ref}
        data-state={state}
        data-collapsible={collapsible === 'none' ? '' : state === 'collapsed' ? collapsible : ''}
        data-variant={variant}
        data-side={side}
        className={cn(
          'group peer flex h-full flex-col bg-sidebar text-sidebar-foreground border-r flex-none overflow-hidden',
          className
        )}
        style={{
          width: resolvedWidth,
          minWidth: resolvedWidth,
          maxWidth: resolvedWidth,
          ...style,
        }}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          className="flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
        >
          {children}
        </div>
      </aside>
    );
  }
);
Sidebar.displayName = 'Sidebar';

const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'>>(
  ({ className, ...props }, ref): ReactElement => {
    const { toggleSidebar } = useSidebar();

    return (
      <button
        ref={ref}
        data-sidebar="rail"
        aria-label="Toggle Sidebar"
        tabIndex={-1}
        onClick={toggleSidebar}
        title="Toggle Sidebar"
        className={cn(
          'absolute inset-y-0 z-20 hidden w-1.5 -translate-x-1/2 bg-transparent transition-all ease-linear after:absolute inset-y-0 left-1/2 w-[4px] -translate-x-1/2 group-data-[side=left]:-right-3 group-data-[side=right]:-left-3 hover:after:bg-sidebar-border sm:flex',
          '[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize',
          '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
          'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full group-data-[collapsible=offcanvas]:hover:bg-sidebar',
          '[[data-side=left]_&]:left-full [[data-side=right]_&]:right-full',
          className
        )}
        {...props}
      />
    );
  }
);
SidebarRail.displayName = 'SidebarRail';

const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentProps<'main'>>(
  ({ className, ...props }, ref): ReactElement => {
    return (
      <main
        ref={ref}
        className={cn(
          'relative flex min-h-svh flex-1 flex-col bg-background',
          'peer-data-[variant=inset]:min-h-[calc(100svh-theme(spacing.4))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow',
          className
        )}
        {...props}
      />
    );
  }
);
SidebarInset.displayName = 'SidebarInset';

export { Sidebar, SidebarInset, SidebarRail };
