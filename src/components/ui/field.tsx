import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Accessibility props the wrapper hands to the control it renders. */
export type ControlProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  "aria-required"?: true;
};

function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-destructive">
      *
    </span>
  );
}

function describedBy(id: string, hint?: string, error?: string) {
  return (
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
      .filter(Boolean)
      .join(" ") || undefined
  );
}

function Messages({ id, hint, error }: { id: string; hint?: string; error?: string }) {
  return (
    <>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </>
  );
}

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  /** Render the control with the a11y props spread onto it. */
  children: (control: ControlProps) => ReactNode;
};

/** Label + control + hint + error message, wired together for screen readers. */
export function Field({ id, label, required, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? <RequiredMark /> : null}
      </Label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy(id, hint, error),
        "aria-required": required ? true : undefined,
      })}
      <Messages id={id} hint={hint} error={error} />
    </div>
  );
}

type FieldGroupProps = {
  id: string;
  legend: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

/** Same as Field for a set of controls (radios, date selects) in one <fieldset>. */
export function FieldGroup({
  id,
  legend,
  required,
  hint,
  error,
  className,
  children,
}: FieldGroupProps) {
  return (
    <fieldset
      aria-describedby={describedBy(id, hint, error)}
      className={cn("flex min-w-0 flex-col gap-1.5", className)}
    >
      <legend className="mb-1.5 text-sm font-medium leading-snug text-foreground">
        {legend}
        {required ? <RequiredMark /> : null}
      </legend>
      {children}
      <Messages id={id} hint={hint} error={error} />
    </fieldset>
  );
}
