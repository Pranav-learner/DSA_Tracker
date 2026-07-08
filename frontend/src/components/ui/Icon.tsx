import {
  Circle,
  Terminal,
  Brackets,
  Search,
  GitBranch,
  Network,
  Share2,
  Layers,
  Boxes,
  Type,
  Sigma,
  Cpu,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';

/**
 * Explicit registry of the icons the roadmap uses. Keyed by the string names
 * stored on each phase in the backend seed. Keeping this explicit (rather than
 * importing lucide's full `icons` map) preserves tree-shaking and keeps the
 * bundle small. Add a new phase icon here + in the seed together.
 */
const REGISTRY: Record<string, LucideIcon> = {
  circle: Circle,
  terminal: Terminal,
  brackets: Brackets,
  search: Search,
  'git-branch': GitBranch,
  network: Network,
  'share-2': Share2,
  layers: Layers,
  boxes: Boxes,
  type: Type,
  sigma: Sigma,
  cpu: Cpu,
};

interface IconProps extends LucideProps {
  /** Icon name as stored on a phase, e.g. "git-branch", "share-2". */
  name: string;
}

/** Renders a registered lucide icon by name, falling back to a circle. */
export function Icon({ name, ...props }: IconProps) {
  const LucideIcon = REGISTRY[name] ?? Circle;
  return <LucideIcon {...props} />;
}
