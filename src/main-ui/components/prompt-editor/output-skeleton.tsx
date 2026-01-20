import { Card, CardContent } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { Skeleton } from "@/components/ui/skeleton";

import type { ReactElement } from "react";

/**
 * Skeleton UI component that displays during optimistic generation state.
 * Shows placeholders for title and style prompt while content is being generated.
 */
export function OutputSkeleton(): ReactElement {
  return (
    <div className="space-y-[var(--space-5)]" aria-busy="true" aria-label="Loading generated content">
      {/* Title skeleton */}
      <div>
        <SectionLabel>Title</SectionLabel>
        <Card className="relative group border bg-surface overflow-hidden mt-2">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48" />
          </CardContent>
        </Card>
      </div>

      {/* Style Prompt skeleton */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <SectionLabel>Style Prompt</SectionLabel>
          <Skeleton className="h-5 w-16" />
        </div>
        <Card className="relative group border bg-surface overflow-hidden">
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
