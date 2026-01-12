/**
 * Panel Toggles Section Component
 *
 * Unified toggles section for panel components.
 *
 * @module components/shared/panel-toggles-section
 */

import { ToggleRow } from "@/components/ui/toggle-row";

import type { PanelTogglesSectionProps } from "./types";
import type { ReactElement } from "react";

/**
 * Unified toggles section for panel components.
 * Renders a configurable list of toggles with optional helper texts.
 */
export function PanelTogglesSection({
  toggles,
  additionalHelperTexts,
}: PanelTogglesSectionProps): ReactElement {
  return (
    <div className="space-y-1 border-t border-border/50 pt-[var(--space-4)]">
      {toggles.map((toggle) => (
        <ToggleRow
          key={toggle.id}
          id={toggle.id}
          icon={toggle.icon}
          label={toggle.label}
          helperText={toggle.helperText}
          checked={toggle.checked}
          onChange={toggle.onChange}
          disabled={toggle.disabled}
          showNaBadge={toggle.showNaBadge}
        />
      ))}
      {additionalHelperTexts?.map((helper, index) => {
        if (helper.condition === false) return null;
        return (
          <p key={index} className="ui-helper pl-6">
            {helper.text}
          </p>
        );
      })}
    </div>
  );
}
