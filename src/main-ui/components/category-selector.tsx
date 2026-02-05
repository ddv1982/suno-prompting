import { Button } from '@/components/ui/button';
import { QUICK_VIBES_CATEGORY_LIST } from '@shared/quick-vibes-categories';

import type { QuickVibesCategory } from '@shared/types';
import type { ReactElement } from 'react';

interface CategorySelectorProps {
  selectedCategory: QuickVibesCategory | null;
  onSelect: (category: QuickVibesCategory | null) => void;
  disabled?: boolean;
}

export function CategorySelector({
  selectedCategory,
  onSelect,
  disabled,
}: CategorySelectorProps): ReactElement {
  // Buttons use both disabled (for mode-specific logic like isDirectMode)
  // and autoDisable (for generation/LLM availability via context)
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        size="xs"
        onClick={() => {
          onSelect(null);
        }}
        disabled={disabled}
        autoDisable
        className="font-medium"
      >
        None
      </Button>
      {QUICK_VIBES_CATEGORY_LIST.map((cat) => (
        <Button
          key={cat.id}
          variant={selectedCategory === cat.id ? 'default' : 'outline'}
          size="xs"
          onClick={() => {
            onSelect(cat.id);
          }}
          disabled={disabled}
          autoDisable
          className="font-medium"
          title={cat.description}
        >
          {cat.label}
        </Button>
      ))}
    </div>
  );
}
