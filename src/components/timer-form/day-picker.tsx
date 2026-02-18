import type { DayOfWeek } from '@/types/timer';

interface DayPickerProps {
  selectedDays: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
}

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: 'M', value: 'mon' },
  { label: 'T', value: 'tue' },
  { label: 'W', value: 'wed' },
  { label: 'T', value: 'thu' },
  { label: 'F', value: 'fri' },
  { label: 'S', value: 'sat' },
  { label: 'S', value: 'sun' },
];

export function DayPicker({ selectedDays, onChange }: DayPickerProps) {
  const toggleDay = (day: DayOfWeek) => {
    const isSelected = selectedDays.includes(day);
    if (isSelected) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  return (
    <div
      className="flex justify-between gap-2"
      aria-label="Select days of the week"
    >
      {DAYS.map((day) => {
        const isSelected = selectedDays.includes(day.value);
        return (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            aria-pressed={isSelected}
            className={`
              flex h-11 w-11 items-center justify-center rounded-full
              border transition-colors
              ${
                isSelected
                  ? 'bg-[hsl(var(--primary))] text-white border-transparent'
                  : 'bg-transparent border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
              }
              hover:opacity-80
            `}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}
