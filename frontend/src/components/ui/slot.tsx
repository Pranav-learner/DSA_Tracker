import { cloneElement, isValidElement, type ReactElement } from 'react';
import { cn } from '@/lib/utils';

/**
 * Minimal `asChild` slot — merges this component's props (and className) onto
 * its single child element. A tiny local stand-in for @radix-ui/react-slot so
 * we avoid the extra dependency.
 */
export function Slot({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  if (!isValidElement(children)) return null;

  const child = children as ReactElement<Record<string, unknown>>;
  const childProps = child.props;

  return cloneElement(child, {
    ...props,
    ...childProps,
    className: cn(className, childProps.className as string | undefined),
  });
}
