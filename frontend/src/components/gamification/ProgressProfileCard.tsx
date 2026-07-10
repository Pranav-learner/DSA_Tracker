import { Trophy, Award, Flame } from 'lucide-react';
import { CardContainer } from '@/components/common/CardContainer';
import { LevelProgressRing } from './LevelProgressRing';
import { XPProgressBar } from './XPProgressBar';
import { cn } from '@/lib/utils';
import type { GamificationProfile } from '@/types';

interface ProgressProfileCardProps {
  profile: GamificationProfile;
  className?: string;
}

/**
 * ProgressProfileCard — a compact identity card: level ring + tier, an XP bar,
 * and the headline counts (achievements, badges, streak). The at-a-glance
 * summary reused on the profile page header and the dashboard.
 */
export function ProgressProfileCard({ profile, className }: ProgressProfileCardProps) {
  const { progression, achievements, badges } = profile;

  return (
    <CardContainer className={cn('flex flex-col gap-5 sm:flex-row sm:items-center', className)}>
      <div className="flex items-center gap-4">
        <LevelProgressRing level={progression.level} progress={progression.levelProgress} caption={progression.tier} />
        <div>
          <p className="text-lg font-semibold">{progression.tier}</p>
          <p className="text-xs text-muted-foreground">
            {progression.totalXP.toLocaleString()} XP · Level {progression.level}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 sm:border-l sm:border-border/60 sm:pl-5">
        <XPProgressBar value={progression.currentXP} max={progression.nextLevelXP} showLabel size="sm" />
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat icon={<Trophy className="size-4" />} value={`${achievements.unlocked}/${achievements.total}`} label="Achievements" tone="text-amber-400" />
          <Stat icon={<Award className="size-4" />} value={badges.count} label="Badges" tone="text-violet-400" />
          <Stat icon={<Flame className="size-4" />} value={progression.currentStreak} label="Day streak" tone="text-warning" />
        </div>
      </div>
    </CardContainer>
  );
}

function Stat({ icon, value, label, tone }: { icon: React.ReactNode; value: React.ReactNode; label: string; tone: string }) {
  return (
    <div className="rounded-lg bg-accent/40 p-2">
      <span className={cn('mx-auto mb-1 flex w-fit', tone)}>{icon}</span>
      <p className="text-base font-semibold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
