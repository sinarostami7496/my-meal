import { Button } from '@/components/ui/button';
import type { MealOption } from '@/types/meal';
import { cn } from '@/lib/utils';

export function MealOptionSelector({
  options,
  selectedIndex,
  onSelect,
}: {
  options: MealOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <Button
          key={opt.id}
          type="button"
          size="sm"
          variant={opt.optionIndex === selectedIndex ? 'default' : 'outline'}
          className={cn('text-xs')}
          onClick={() => onSelect(opt.optionIndex)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
