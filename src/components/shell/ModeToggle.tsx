import type { ShellDemoMode } from './nav';
import styles from './ModeToggle.module.css';

interface ModeToggleProps {
  mode: ShellDemoMode;
  onChange: (mode: ShellDemoMode) => void;
  id?: string;
}

/**
 * Builder / Developer mode switch. Builder uses plain business language,
 * Developer surfaces technical traces and IDs; the switch never changes
 * underlying results (`docs/01_PRODUCT_AND_SCOPE.md`). Rendered as a
 * radiogroup so it is keyboard-operable with arrow keys.
 */
export function ModeToggle({ mode, onChange, id = 'hc-mode-toggle' }: ModeToggleProps) {
  const options: { value: ShellDemoMode; label: string; hint: string }[] = [
    { value: 'builder', label: 'Builder', hint: 'Plain-language summaries' },
    { value: 'developer', label: 'Developer', hint: 'Technical traces and IDs' },
  ];
  return (
    <div
      className={styles.group}
      role="radiogroup"
      aria-label="Demo language mode"
      id={id}
      title="Switching modes changes wording only — demo results stay the same."
    >
      {options.map((option) => {
        const selected = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.hint}
            className={selected ? `${styles.option} ${styles.selected}` : styles.option}
            onClick={() => {
              if (!selected) onChange(option.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                onChange(option.value === 'builder' ? 'developer' : 'builder');
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
