import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type RangePreset = '7' | '30' | '90' | 'custom';

export function DateRangeFilter({
  preset,
  start,
  end,
  onPreset,
  onCustom,
}: {
  preset: RangePreset;
  start: string;
  end: string;
  onPreset: (p: RangePreset) => void;
  onCustom: (start: string, end: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['7', '۷ روز'],
            ['30', '۳۰ روز'],
            ['90', '۹۰ روز'],
            ['custom', 'سفارشی'],
          ] as const
        ).map(([k, label]) => (
          <Button
            key={k}
            size="sm"
            variant={preset === k ? 'default' : 'outline'}
            onClick={() => onPreset(k)}
          >
            {label}
          </Button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex gap-2 items-end">
          <div>
            <Label>از</Label>
            <Input type="date" value={start} onChange={(e) => onCustom(e.target.value, end)} />
          </div>
          <div>
            <Label>تا</Label>
            <Input type="date" value={end} onChange={(e) => onCustom(start, e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}
