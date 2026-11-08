import type { CSSProperties } from 'react';
import styles from './Badge.module.css';

interface BadgeProps {
  /** Count to display. Zero, negative or undefined renders nothing. */
  count?: number;
  /** Accessible label, e.g. "open findings". Announced as "<count> <label>". */
  label: string;
  /** Accent color key. Defaults to coral for alert-style counts. */
  tone?: 'coral' | 'cyan' | 'mint' | 'violet';
  /** Maximum number shown before collapsing to "99+". */
  cap?: number;
  className?: string;
  style?: CSSProperties;
}

const TONE_CLASS: Record<NonNullable<BadgeProps['tone']>, string> = {
  coral: styles.toneCoral,
  cyan: styles.toneCyan,
  mint: styles.toneMint,
  violet: styles.toneViolet,
};

export function Badge({ count, label, tone = 'coral', cap = 99, className, style }: BadgeProps) {
  if (count === undefined || count <= 0) return null;
  const text = count > cap ? `${cap}+` : String(count);
  const classes = [styles.badge, TONE_CLASS[tone], className].filter(Boolean).join(' ');
  return (
    <span className={classes} style={style} aria-label={`${count} ${label}`} role="status">
      {text}
    </span>
  );
}
