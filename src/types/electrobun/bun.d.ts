export class BrowserWindow {
  constructor(config: unknown);
  on(event: 'focus' | 'close' | 'resize' | 'move', handler: (event: unknown) => void): void;
  webview: BrowserView;
}

export class BrowserView {
  static defineRPC<TSchema>(config: unknown): any;
}

export class ApplicationMenu {
  static setApplicationMenu(menu: unknown): void;
}
