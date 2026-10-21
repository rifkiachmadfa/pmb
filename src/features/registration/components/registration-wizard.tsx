"use client";

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { validateStudentStep } from "../actions";
import { initialWizardState, wizardReducer } from "../draft";
import {
  LAST_STEP_INDEX,
  REGISTRATION_STEPS,
  STUDENT_STEP_INDEX,
} from "../steps";
import {
  STUDENT_ERROR_ORDER,
  validateStudentDraft,
  type StudentFieldErrors,
  type StudentFieldName,
} from "../student-schema";
import { StepPlaceholder } from "./step-placeholder";
import { StepReview } from "./step-review";
import { StepStudent } from "./step-student";
import { StepTerms } from "./step-terms";
import { WizardStepper } from "./wizard-stepper";

type Notice = "session" | "network" | null;

function focusFirstStudentError(errors: StudentFieldErrors) {
  const key = STUDENT_ERROR_ORDER.find((k) => errors[k]);
  if (!key) return;
  const id = key === "birthDate" ? "student-birthDay" : `student-${key}`;
  document.getElementById(id)?.focus();
}

/**
 * Five-step wizard. All steps render inside this one component so the draft
 * (held in the reducer) survives back/next navigation. State is in memory only.
 */
export function RegistrationWizard() {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const [termsError, setTermsError] = useState(false);
  const [studentShowAll, setStudentShowAll] = useState(false);
  const [serverErrors, setServerErrors] = useState<StudentFieldErrors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [checking, startTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  const { step, maxStep, draft } = state;

  // Same schema the server uses: instant feedback in the browser.
  const studentResult = useMemo(
    () => validateStudentDraft(draft.student),
    [draft.student],
  );
  const studentErrors: StudentFieldErrors = {
    ...serverErrors,
    ...(studentResult.ok ? {} : studentResult.errors),
  };

  // Move focus to the new step heading so keyboard/screen-reader users land on it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const current = REGISTRATION_STEPS[step];

  const handleNext = () => {
    if (!draft.termsAccepted) {
      setTermsError(true);
      return;
    }

    if (step === STUDENT_STEP_INDEX) {
      setNotice(null);
      if (!studentResult.ok) {
        setStudentShowAll(true);
        focusFirstStudentError(studentResult.errors);
        return;
      }
      // Browser check passed; the server re-validates (and verifies the session).
      startTransition(async () => {
        try {
          const result = await validateStudentStep(draft.student);
          if (result.status === "ok") {
            setServerErrors({});
            dispatch({ type: "next" });
          } else if (result.status === "unauthenticated") {
            setNotice("session");
          } else {
            setServerErrors(result.errors);
            setStudentShowAll(true);
            focusFirstStudentError(result.errors);
          }
        } catch {
          setNotice("network");
        }
      });
      return;
    }

    dispatch({ type: "next" });
  };

  const handleSelectStep = (target: number) => {
    // Block jumping past Data Siswa while it is invalid, and show why.
    if (target > STUDENT_STEP_INDEX && !studentResult.ok) {
      setStudentShowAll(true);
      dispatch({ type: "goTo", step: STUDENT_STEP_INDEX });
      return;
    }
    dispatch({ type: "goTo", step: target });
  };

  const handleTermsChange = (accepted: boolean) => {
    if (accepted) setTermsError(false);
    dispatch({ type: "setTermsAccepted", accepted });
  };

  const handleStudentChange = (name: StudentFieldName, value: string) => {
    if (Object.keys(serverErrors).length > 0) setServerErrors({});
    setNotice(null);
    dispatch({ type: "setStudentField", name, value });
  };

  return (
    <div className="flex flex-col gap-8">
      <WizardStepper current={step} maxStep={maxStep} onSelect={handleSelectStep} />

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
          <StepStudent
            values={draft.student}
            errors={studentErrors}
            showAllErrors={studentShowAll}
            onChange={handleStudentChange}
          />
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

      {notice === "session" ? (
        <Alert variant="warning">
          <AlertTitle>Sesi Anda sudah berakhir</AlertTitle>
          <AlertDescription>
            Isian Anda masih ada di halaman ini.{" "}
            <Link
              href="/masuk?next=%2Fpendaftaran"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline underline-offset-2"
            >
              Masuk kembali di tab baru
            </Link>
            , lalu kembali ke tab ini dan tekan Lanjut. Jangan memuat ulang
            halaman ini karena isian akan hilang.
          </AlertDescription>
        </Alert>
      ) : null}
      {notice === "network" ? (
        <Alert variant="destructive">
          <AlertDescription>
            Data belum bisa diperiksa di server. Periksa koneksi internet Anda,
            lalu tekan Lanjut lagi. Isian Anda tidak hilang.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button
          variant="outline"
          onClick={() => dispatch({ type: "back" })}
          disabled={step === 0 || checking}
        >
          <ArrowLeft aria-hidden="true" />
          Kembali
        </Button>
        {step < LAST_STEP_INDEX ? (
          <Button onClick={handleNext} disabled={checking}>
            {checking ? "Memeriksa…" : "Lanjut"}
            <ArrowRight aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
