import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button, type ButtonProps } from '@/components/ui/button';

interface QuickActionButtonProps {
  to: string;
  label: string;
  icon?: ReactNode;
  /** Place the icon after the label (e.g. a trailing arrow). */
  trailingIcon?: ReactNode;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  className?: string;
}

/**
 * A router-aware action button — the dashboard's single call-to-action
 * primitive (Continue, Open Topic, Quick Continue…). Wraps the design-system
 * Button + Link so every action is styled and keyboard-accessible identically.
 */
export function QuickActionButton({
  to,
  label,
  icon,
  trailingIcon,
  variant = 'primary',
  size = 'md',
  className,
}: QuickActionButtonProps) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link to={to}>
        {icon}
        {label}
        {trailingIcon}
      </Link>
    </Button>
  );
}
