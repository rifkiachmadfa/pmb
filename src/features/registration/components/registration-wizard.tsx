"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { initialWizardState, wizardReducer } from "../draft";
import { LAST_STEP_INDEX, REGISTRATION_STEPS } from "../steps";
import { StepPlaceholder } from "./step-placeholder";
import { StepReview } from "./step-review";
import { StepTerms } from "./step-terms";
import { WizardStepper } from "./wizard-stepper";

/**
 * Five-step wizard. All steps render inside this one component so the draft
 * (held in the reducer) survives back/next navigation. State is in memory only.
 */
export function RegistrationWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [termsError, setTermsError] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const { step, maxStep, draft } = state;

  // Move focus to the new step heading so keyboard/screen-reader users land on it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const handleNext = () => {
    if (!draft.termsAccepted) {
      setTermsError(true);
      return;
    }
    dispatch({ type: "next" });
  };

  const handleTermsChange = (accepted: boolean) => {
    if (accepted) setTermsError(false);
    dispatch({ type: "setTermsAccepted", accepted });
  };

  const current = REGISTRATION_STEPS[step];

  return (
    <div className="flex flex-col gap-8">
      <WizardStepper
        current={step}
        maxStep={maxStep}
        onSelect={(s) => dispatch({ type: "goTo", step: s })}
      />

      <section aria-labelledby="step-heading" className="flex flex-col gap-5">
        <h2
          id="step-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-semibold tracking-tight focus:outline-none"
        >
          {current.label}
        </h2>

        {current.id === "ketentuan" && (
          <StepTerms
            accepted={draft.termsAccepted}
            showError={termsError && !draft.termsAccepted}
            onChange={handleTermsChange}
          />
        )}
        {current.id === "data-siswa" && (
          <StepPlaceholder title="Data Siswa" phase="Phase 3" />
        )}
        {current.id === "data-orang-tua" && (
          <StepPlaceholder title="Data Orang Tua / Wali" phase="Phase 4" />
        )}
        {current.id === "data-sekolah-asal" && (
          <StepPlaceholder title="Data Sekolah Asal" phase="Phase 4" />
        )}
        {current.id === "konfirmasi" && (
          <StepReview
            draft={draft}
            onEdit={(s) => dispatch({ type: "goTo", step: s })}
          />
        )}
      </section>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button
          variant="outline"
          onClick={() => dispatch({ type: "back" })}
          disabled={step === 0}
        >
          <ArrowLeft aria-hidden="true" />
          Kembali
        </Button>
        {step < LAST_STEP_INDEX ? (
          <Button onClick={handleNext}>
            Lanjut
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
