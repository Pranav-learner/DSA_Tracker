/**
 * Learning-resource card definitions. These are placeholders in Sprint 2 and
 * will hold markdown / links in a future sprint. `icon` is a lucide name.
 */
export interface LearningResourceDef {
  key: string;
  title: string;
  description: string;
  icon: string;
  /** Roughly when this resource type becomes editable/available. */
  availability: string;
}

export const LEARNING_RESOURCES: LearningResourceDef[] = [
  {
    key: 'concept-notes',
    title: 'Concept Notes',
    description: 'Long-form markdown notes explaining the idea in depth.',
    icon: 'file-text',
    availability: 'Markdown-ready',
  },
  {
    key: 'cheat-sheet',
    title: 'Cheat Sheet',
    description: 'A one-page template and quick-reference for the pattern.',
    icon: 'scroll-text',
    availability: 'Markdown-ready',
  },
  {
    key: 'visual-explanation',
    title: 'Visual Explanation',
    description: 'Diagrams and animations that build intuition.',
    icon: 'image',
    availability: 'Coming soon',
  },
  {
    key: 'reference-links',
    title: 'Reference Links',
    description: 'Curated external articles, videos and editorials.',
    icon: 'link',
    availability: 'Coming soon',
  },
  {
    key: 'editorial-notes',
    title: 'Editorial Notes',
    description: 'Annotated solutions and common pitfalls to avoid.',
    icon: 'notebook-pen',
    availability: 'Coming soon',
  },
];
