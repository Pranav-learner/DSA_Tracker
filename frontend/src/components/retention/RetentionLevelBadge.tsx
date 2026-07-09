import { GraduationCap, Eye, Zap, Trophy, RefreshCw, ShieldAlert, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RETENTION_LEVEL_META } from '@/lib/retention';
import type { RetentionLevel } from '@/types';

const ICON: Record<RetentionLevel, LucideIcon> = {
  Learning: GraduationCap,
  Familiar: Eye,
  Strong: Zap,
  Mastered: Trophy,
  'Needs Review': RefreshCw,
  'At Risk': ShieldAlert,
};

/** Dynamic retention-level badge (Learning → Mastered → Needs Review → At Risk). */
export function RetentionLevelBadge({
  level,
  className,
  showIcon = true,
}: {
  level: RetentionLevel;
  className?: string;
  showIcon?: boolean;
}) {
  const meta = RETENTION_LEVEL_META[level];
  const Ico = ICON[level];
  return (
    <Badge variant={meta.badge} className={className}>
      {showIcon && <Ico className="size-3" />} {level}
    </Badge>
  );
}
