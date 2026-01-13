import { Bug } from "lucide-react";


import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { DebugDrawerBody } from "./debug-drawer";

import type { TraceRun } from "@shared/types";
import type { ReactElement } from "react";

type DebugSheetProps = {
  debugTrace: TraceRun | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DebugSheet({ debugTrace, open, onOpenChange }: DebugSheetProps): ReactElement | null {
  if (!debugTrace) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(640px,95vw)] sm:max-w-none overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bug className="w-4 h-4" />
            Debug Trace
          </SheetTitle>
        </SheetHeader>
        <DebugDrawerBody debugTrace={debugTrace} />
      </SheetContent>
    </Sheet>
  );
}
