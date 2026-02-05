import { FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { FormLabel } from '@/components/ui/form-label';
import { Textarea } from '@/components/ui/textarea';
import { APP_CONSTANTS } from '@shared/constants';

import type { ReactElement } from 'react';

const MAX_LYRICS_TOPIC_CHARS = APP_CONSTANTS.CREATIVE_BOOST_MAX_LYRICS_TOPIC_CHARS;

interface LyricsTopicInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function LyricsTopicInput({
  value,
  onChange,
  onKeyDown,
}: LyricsTopicInputProps): ReactElement {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <FormLabel icon={<FileText className="w-3 h-3" />} badge="optional">
          Lyrics Topic
        </FormLabel>
        <Badge variant="secondary" className="ui-badge font-mono h-5">
          {value.length} / {MAX_LYRICS_TOPIC_CHARS}
        </Badge>
      </div>
      <Textarea
        value={value}
        onChange={(e): void => {
          onChange(e.target.value);
        }}
        onKeyDown={onKeyDown}
        autoDisable
        maxLength={MAX_LYRICS_TOPIC_CHARS}
        className="min-h-16 resize-none text-[length:var(--text-footnote)] p-4 rounded-xl bg-surface"
        placeholder="What should the lyrics be about? (e.g., 'lost love', 'summer road trip')"
      />
    </div>
  );
}
