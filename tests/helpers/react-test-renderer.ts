import { act, create, type ReactTestRenderer } from 'react-test-renderer';

import type { ReactElement } from 'react';

export function renderWithAct(element: ReactElement): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(element);
  });
  return renderer;
}

export async function updateWithAct(
  renderer: ReactTestRenderer,
  element: ReactElement
): Promise<void> {
  await act(async () => {
    renderer.update(element);
  });
}

export async function unmountWithAct(renderer: ReactTestRenderer): Promise<void> {
  await act(async () => {
    renderer.unmount();
  });
}

export async function flushMicrotasks(times = 1): Promise<void> {
  for (let i = 0; i < times; i += 1) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}
