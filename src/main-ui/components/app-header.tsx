import { Music, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  onOpenSettings: () => void;
};

export function Header({ onOpenSettings }: HeaderProps) {
  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Music className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-bold tracking-tight">
          Suno <span className="text-muted-foreground font-medium">Prompting</span>
        </h1>
      </div>
      <Button variant="ghost" size="sm" onClick={onOpenSettings} className="gap-2">
        <Settings className="w-4 h-4" />
        Settings
      </Button>
    </header>
  );
}
