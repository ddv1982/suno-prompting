import { Settings } from "lucide-react";

import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";

import type { ReactElement } from "react";

type HeaderProps = {
  onOpenSettings: () => void;
};

export function Header({ onOpenSettings }: HeaderProps): ReactElement {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-surface sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl">
          <LogoMark size={32} className="drop-shadow-[0_8px_24px_color-mix(in_oklab,var(--primary)60%,transparent)]" />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">
          Suno <span className="text-muted-foreground font-normal">Prompting</span>
        </h1>
      </div>
      <Button variant="ghost" size="sm" onClick={onOpenSettings} className="gap-2 text-muted-foreground hover:text-foreground">
        <Settings className="w-4 h-4" />
        <span className="text-[length:var(--text-footnote)]">Settings</span>
      </Button>
    </header>
  );
}
