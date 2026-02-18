import { beforeEach, describe, expect, mock, test } from 'bun:test';

const setApplicationMenuMock = mock(() => {});

async function loadMenuModule() {
  // Await mock.module so the mock is definitely installed before dynamic import.
  await mock.module('electrobun/bun', () => ({
    ApplicationMenu: {
      setApplicationMenu: setApplicationMenuMock,
    },
  }));

  const moduleUrl = new URL('../../src/bun/menu.ts', import.meta.url).href;
  return import(`${moduleUrl}?test=${Date.now()}-${Math.random()}`);
}

describe('menu bootstrap', () => {
  beforeEach(() => {
    setApplicationMenuMock.mockReset();
  });

  test('buildApplicationMenu returns App/Edit/Window menu structure', async () => {
    const { buildApplicationMenu } = await loadMenuModule();
    const menu = buildApplicationMenu('Suno Prompting App');

    expect(Array.isArray(menu)).toBe(true);
    expect(menu).toHaveLength(3);
    expect(menu[0]).toMatchObject({ label: 'Suno Prompting App' });
    expect(menu[1]).toMatchObject({ label: 'Edit' });
    expect(menu[2]).toMatchObject({ label: 'Window' });

    const editSubmenu = menu[1]?.submenu;
    expect(Array.isArray(editSubmenu)).toBe(true);
    const editRoles = editSubmenu
      ?.map((item: { role?: string }) => item.role)
      .filter((role: string | undefined): role is string => !!role);

    expect(editRoles).toContain('undo');
    expect(editRoles).toContain('redo');
    expect(editRoles).toContain('cut');
    expect(editRoles).toContain('copy');
    expect(editRoles).toContain('paste');
    expect(editRoles).toContain('selectAll');
  });

  test('installApplicationMenu applies menu config once', async () => {
    const { buildApplicationMenu, installApplicationMenu } = await loadMenuModule();
    const menu = buildApplicationMenu('Suno Prompting App');

    installApplicationMenu(menu);

    expect(setApplicationMenuMock).toHaveBeenCalledTimes(1);
    expect(setApplicationMenuMock).toHaveBeenCalledWith(menu);
  });

  test('installApplicationMenu rethrows underlying menu errors', async () => {
    const { buildApplicationMenu, installApplicationMenu } = await loadMenuModule();
    const menu = buildApplicationMenu('Suno Prompting App');
    setApplicationMenuMock.mockImplementationOnce(() => {
      throw new Error('menu failed');
    });

    expect(() => installApplicationMenu(menu)).toThrow('menu failed');
  });
});
