import type { TimeOfDay } from '@/types/timer';

interface TimeOfDayControlProps {
  value: TimeOfDay;
  onChange: (value: TimeOfDay) => void;
}

const TIME_OPTIONS: { label: string; value: TimeOfDay }[] = [
  { label: 'Morning', value: 'morning' },
  { label: 'Afternoon', value: 'afternoon' },
  { label: 'Evening', value: 'evening' },
  { label: 'Any', value: 'anytime' },
];

export function TimeOfDayControl({ value, onChange }: TimeOfDayControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Select time of day"
      className="flex w-full"
    >
      {TIME_OPTIONS.map((option, index) => {
        const isSelected = value === option.value;
        const isFirst = index === 0;
        const isLast = index === TIME_OPTIONS.length - 1;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`
              flex-1 py-2 px-4 border transition-colors
              ${isFirst ? 'rounded-l-lg' : ''}
              ${isLast ? 'rounded-r-lg' : ''}
              ${!isFirst ? '-ml-px' : ''}
              ${
                isSelected
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))] z-10'
                  : 'bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] border-[hsl(var(--border))]'
              }
              hover:opacity-80
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
