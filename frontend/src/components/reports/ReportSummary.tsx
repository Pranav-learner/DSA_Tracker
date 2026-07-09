import { CardContainer } from '@/components/common/CardContainer';

/** The one-paragraph report summary in a highlighted card. */
export function ReportSummary({ summary }: { summary: string }) {
  return (
    <CardContainer className="border-primary/20 bg-primary/[0.04]">
      <p className="text-sm leading-relaxed text-foreground">{summary}</p>
    </CardContainer>
  );
}
