import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { REGISTRATION_STEPS } from "../steps";

type Props = {
  current: number;
  maxStep: number;
  onSelect: (step: number) => void;
};

/**
 * Progress indicator. Small screens show a compact "Langkah X dari 5" bar;
 * from `md` up the full ordered list is shown. Only already-reached steps are
 * interactive; the current step carries aria-current="step".
 */
export function WizardStepper({ current, maxStep, onSelect }: Props) {
  const total = REGISTRATION_STEPS.length;
  return (
    <nav aria-label="Langkah pendaftaran">
      <div className="md:hidden">
        <p className="text-sm font-medium">
          Langkah {current + 1} dari {total}:{" "}
          <span className="font-semibold">{REGISTRATION_STEPS[current].label}</span>
        </p>
        <div
          aria-hidden="true"
          className="mt-2 h-1.5 w-full overflow-hidden rounded-sm bg-muted"
        >
          <div
            className="h-full bg-primary transition-[width]"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      <ol className="hidden md:grid md:grid-cols-5 md:gap-2">
        {REGISTRATION_STEPS.map((step, index) => {
          const isCurrent = index === current;
          const isDone = index < current;
          const reachable = index <= maxStep && !isCurrent;
          const inner = (
            <>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isCurrent && "border-foreground bg-primary text-primary-foreground",
                  isDone && "border-foreground bg-foreground text-background",
                  !isCurrent && !isDone && "border-input bg-surface text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-left text-sm leading-snug",
                  isCurrent ? "font-semibold" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </>
          );
          const base =
            "flex w-full items-center gap-2 border-t-2 pt-3 pb-1 " +
            (isCurrent ? "border-highlight" : "border-border");
          return (
            <li key={step.id}>
              {reachable ? (
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className={cn(
                    base,
                    "rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                >
                  {inner}
                  <span className="sr-only">
                    {isDone ? " (selesai)" : " (sudah dibuka)"}
                  </span>
                </button>
              ) : (
                <div className={base} aria-current={isCurrent ? "step" : undefined}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
