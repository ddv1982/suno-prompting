import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/logo-mark";

type HeaderProps = {
  onOpenSettings: () => void;
};

export function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background/60 backdrop-blur-md sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl shadow-lg" style={{ boxShadow: "0 12px 40px var(--shadow-color)" }}>
          <LogoMark size={32} className="drop-shadow-[0_8px_24px_color-mix(in_oklab,var(--primary)60%,transparent)]" />
        </div>
        <h1 className="text-lg font-bold tracking-tight">
          Suno <span className="text-muted-foreground font-normal">Prompting</span>
        </h1>
      </div>
      <Button variant="ghost" size="sm" onClick={onOpenSettings} className="gap-2 text-muted-foreground hover:text-foreground">
        <Settings className="w-4 h-4" />
        <span className="text-sm">Settings</span>
      </Button>
    </header>
  );
}
