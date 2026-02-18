import { ApplicationMenu, type ApplicationMenuItemConfig } from 'electrobun/bun';

import { createLogger } from '@bun/logger';

const log = createLogger('Menu');

export function buildApplicationMenu(appName: string): ApplicationMenuItemConfig[] {
  return [
    {
      label: appName,
      submenu: [
        { role: 'hide', accelerator: 'h' },
        { role: 'hideOthers' },
        { role: 'showAll' },
        { type: 'separator' },
        { role: 'quit', accelerator: 'q' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', accelerator: 'z' },
        { role: 'redo', accelerator: 'Z' },
        { type: 'separator' },
        { role: 'cut', accelerator: 'x' },
        { role: 'copy', accelerator: 'c' },
        { role: 'paste', accelerator: 'v' },
        { role: 'pasteAndMatchStyle', accelerator: 'V' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll', accelerator: 'a' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', accelerator: 'm' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close', accelerator: 'w' },
        { role: 'bringAllToFront' },
      ],
    },
  ];
}

export function installApplicationMenu(menu: ApplicationMenuItemConfig[]): void {
  try {
    ApplicationMenu.setApplicationMenu(menu);
    log.info('install:success', { topLevelItems: menu.length });
  } catch (error: unknown) {
    log.error('install:failed', error);
    throw error;
  }
}
