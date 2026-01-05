import { Bug } from "lucide-react";


import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { DebugDrawerBody } from "./debug-drawer";

import type { DebugInfo } from "@shared/types";
import type { ReactNode } from "react";

type DebugSheetProps = {
  debugInfo: Partial<DebugInfo> | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DebugSheet({ debugInfo, open, onOpenChange }: DebugSheetProps): ReactNode {
  if (!debugInfo) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(640px,95vw)] sm:max-w-none">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Debug Info
          </SheetTitle>
        </SheetHeader>
        <DebugDrawerBody debugInfo={debugInfo} />
      </SheetContent>
    </Sheet>
  );
}
