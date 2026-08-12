import { Lightbulb } from 'lucide-react';

export function GuidanceStrip() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-950">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <p>
        <span className="font-medium">Write what&apos;s wrong</span> — don&apos;t categorize yet.
        Don&apos;t root-cause. One smoking-gun note is enough. Binary pass/fail only.
      </p>
    </div>
  );
}
