import { Dice3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FormLabel } from "@/components/ui/form-label";
import { Slider } from "@/components/ui/slider";
import { CREATIVITY_LEVEL_HELPER_TEXT, CREATIVITY_LEVEL_DISPLAY_NAMES } from "@shared/constants";
import { getCreativityLevel } from "@shared/creative-boost-utils";

import type { CreativitySliderValue } from "@shared/types";

type CreativitySliderProps = {
  value: CreativitySliderValue;
  onChange: (value: CreativitySliderValue) => void;
  disabled?: boolean;
};

export function CreativitySlider({ value, onChange, disabled }: CreativitySliderProps): React.JSX.Element {
  const level = getCreativityLevel(value);
  const helperText = CREATIVITY_LEVEL_HELPER_TEXT[level];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel icon={<Dice3 className="w-3 h-3" />}>
          Creativity Level
        </FormLabel>
        <Badge variant="secondary" className="h-5">
          {CREATIVITY_LEVEL_DISPLAY_NAMES[level]}
        </Badge>
      </div>

      <Slider
        value={[value]}
        onValueChange={(values) => { onChange((values[0] ?? value) as CreativitySliderValue); }}
        min={0}
        max={100}
        step={25}
        disabled={disabled}
        showTicks
        aria-label="Creativity Level"
        aria-describedby="creativity-helper"
      />

      <p id="creativity-helper" className="ui-helper">{helperText}</p>
    </div>
  );
}
