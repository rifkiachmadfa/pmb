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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  submitRegistration,
  validateParentsStep,
  validateSchoolStep,
  validateStudentStep,
} from "../actions";
import { initialWizardState, wizardReducer } from "../draft";
import {
  PARENTS_FIELDS,
  validateParentsDraft,
  type ParentsFieldErrors,
  type ParentsFieldName,
} from "../guardian-schema";
import {
  SCHOOL_FIELDS,
  validateSchoolDraft,
  type SchoolFieldErrors,
  type SchoolFieldName,
} from "../school-schema";
import {
  LAST_STEP_INDEX,
  PARENTS_STEP_INDEX,
  SCHOOL_STEP_INDEX,
  REGISTRATION_STEPS,
  STUDENT_STEP_INDEX,
} from "../steps";
import {
  STUDENT_ERROR_ORDER,
  validateStudentDraft,
  type StudentFieldErrors,
  type StudentFieldName,
} from "../student-schema";
import { StepParents } from "./step-parents";
import { StepSchool } from "./step-school";
import { StepReview } from "./step-review";
import { StepStudent } from "./step-student";
import { StepTerms } from "./step-terms";
import { WizardStepper } from "./wizard-stepper";

type Notice = "session" | "network" | "server" | null;

const SECTION_LABEL = {
  terms: "Ketentuan",
  student: "Data Siswa",
  guardian: "Data Orang Tua / Wali",
  previousSchool: "Data Sekolah Asal",
} as const;

const SECTION_STEP = {
  terms: 0,
  student: STUDENT_STEP_INDEX,
  guardian: PARENTS_STEP_INDEX,
  previousSchool: SCHOOL_STEP_INDEX,
} as const;

type Done = { registrationNumber: string; alreadySubmitted: boolean };

function focusFirstStudentError(errors: StudentFieldErrors) {
  const key = STUDENT_ERROR_ORDER.find((k) => errors[k]);
  if (!key) return;
  const id = key === "birthDate" ? "student-birthDay" : `student-${key}`;
  document.getElementById(id)?.focus();
}

function focusFirstParentsError(errors: ParentsFieldErrors) {
  const key = PARENTS_FIELDS.find((k) => errors[k]);
  if (key) document.getElementById(`parents-${key}`)?.focus();
}

function focusFirstSchoolError(errors: SchoolFieldErrors) {
  const key = SCHOOL_FIELDS.find((k) => errors[k]);
  if (key) document.getElementById(`school-${key}`)?.focus();
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
  const [parentsShowAll, setParentsShowAll] = useState(false);
  const [parentsServerErrors, setParentsServerErrors] = useState<ParentsFieldErrors>({});
  const [schoolShowAll, setSchoolShowAll] = useState(false);
  const [schoolServerErrors, setSchoolServerErrors] = useState<SchoolFieldErrors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [checking, startTransition] = useTransition();
  const [submitting, startSubmit] = useTransition();
  const [done, setDone] = useState<Done | null>(null);
  const [rejected, setRejected] = useState<(keyof typeof SECTION_LABEL)[]>([]);
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

  const parentsResult = useMemo(
    () => validateParentsDraft(draft.guardian),
    [draft.guardian],
  );
  const parentsErrors: ParentsFieldErrors = {
    ...parentsServerErrors,
    ...(parentsResult.ok ? {} : parentsResult.errors),
  };

  const schoolResult = useMemo(
    () => validateSchoolDraft(draft.previousSchool),
    [draft.previousSchool],
  );
  const schoolErrors: SchoolFieldErrors = {
    ...schoolServerErrors,
    ...(schoolResult.ok ? {} : schoolResult.errors),
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

    if (step === PARENTS_STEP_INDEX) {
      setNotice(null);
      if (!parentsResult.ok) {
        setParentsShowAll(true);
        focusFirstParentsError(parentsResult.errors);
        return;
      }
      startTransition(async () => {
        try {
          const result = await validateParentsStep(draft.guardian);
          if (result.status === "ok") {
            setParentsServerErrors({});
            dispatch({ type: "next" });
          } else if (result.status === "unauthenticated") {
            setNotice("session");
          } else {
            setParentsServerErrors(result.errors);
            setParentsShowAll(true);
            focusFirstParentsError(result.errors);
          }
        } catch {
          setNotice("network");
        }
      });
      return;
    }

    if (step === SCHOOL_STEP_INDEX) {
      setNotice(null);
      if (!schoolResult.ok) {
        setSchoolShowAll(true);
        focusFirstSchoolError(schoolResult.errors);
        return;
      }
      startTransition(async () => {
        try {
          const result = await validateSchoolStep(draft.previousSchool);
          if (result.status === "ok") {
            setSchoolServerErrors({});
            dispatch({ type: "next" });
          } else if (result.status === "unauthenticated") {
            setNotice("session");
          } else {
            setSchoolServerErrors(result.errors);
            setSchoolShowAll(true);
            focusFirstSchoolError(result.errors);
          }
        } catch {
          setNotice("network");
        }
      });
      return;
    }

    dispatch({ type: "next" });
  };

  const handleSubmit = () => {
    if (submitting || done) return;
    setNotice(null);
    setRejected([]);
    startSubmit(async () => {
      try {
        const result = await submitRegistration({
          termsAccepted: draft.termsAccepted,
          student: draft.student,
          guardian: draft.guardian,
          previousSchool: draft.previousSchool,
        });
        if (result.status === "created" || result.status === "already_submitted") {
          setDone({
            registrationNumber: result.registrationNumber,
            alreadySubmitted: result.status === "already_submitted",
          });
        } else if (result.status === "invalid") {
          setRejected(result.sections);
        } else if (result.status === "unauthenticated") {
          setNotice("session");
        } else {
          setNotice("server");
        }
      } catch {
        setNotice("network");
      }
    });
  };

  const handleSelectStep = (target: number) => {
    // Block jumping past Data Siswa while it is invalid, and show why.
    if (target > STUDENT_STEP_INDEX && !studentResult.ok) {
      setStudentShowAll(true);
      dispatch({ type: "goTo", step: STUDENT_STEP_INDEX });
      return;
    }
    if (target > PARENTS_STEP_INDEX && !parentsResult.ok) {
      setParentsShowAll(true);
      dispatch({ type: "goTo", step: PARENTS_STEP_INDEX });
      return;
    }
    if (target > SCHOOL_STEP_INDEX && !schoolResult.ok) {
      setSchoolShowAll(true);
      dispatch({ type: "goTo", step: SCHOOL_STEP_INDEX });
      return;
    }
    dispatch({ type: "goTo", step: target });
  };

  const handleSchoolChange = (name: SchoolFieldName, value: string) => {
    if (Object.keys(schoolServerErrors).length > 0) setSchoolServerErrors({});
    setNotice(null);
    dispatch({ type: "setSchoolField", name, value });
  };

  const handleParentsChange = (name: ParentsFieldName, value: string) => {
    if (Object.keys(parentsServerErrors).length > 0) setParentsServerErrors({});
    setNotice(null);
    dispatch({ type: "setParentsField", name, value });
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

  if (done) {
    return (
      <section
        aria-labelledby="done-heading"
        className="flex flex-col gap-5 border-y border-border py-8"
      >
        <h2
          id="done-heading"
          tabIndex={-1}
          ref={(el) => el?.focus()}
          className="text-xl font-semibold tracking-tight focus:outline-none"
        >
          {done.alreadySubmitted
            ? "Pendaftaran Anda sudah tercatat"
            : "Pendaftaran berhasil dikirim"}
        </h2>
        <p className="text-muted-foreground">
          {done.alreadySubmitted
            ? "Akun ini sudah memiliki pendaftaran untuk periode ini, sehingga tidak dibuat dua kali."
            : "Data Anda sudah tersimpan."}{" "}
          Simpan nomor pendaftaran berikut.
        </p>
        <p className="text-2xl font-semibold tracking-wider" aria-label="Nomor pendaftaran">
          {done.registrationNumber}
        </p>
        <p className="text-sm text-muted-foreground">
          Mengirim pendaftaran tidak berarti diterima. Keputusan penerimaan
          ditetapkan oleh panitia sekolah.
        </p>
        <div>
          <Link href="/dashboard" className={buttonVariants()}>
            Buka dashboard
          </Link>
        </div>
      </section>
    );
  }

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
          <StepParents
            values={draft.guardian}
            errors={parentsErrors}
            showAllErrors={parentsShowAll}
            onChange={handleParentsChange}
          />
        )}
        {current.id === "data-sekolah-asal" && (
          <StepSchool
            values={draft.previousSchool}
            errors={schoolErrors}
            showAllErrors={schoolShowAll}
            onChange={handleSchoolChange}
          />
        )}
        {current.id === "konfirmasi" && (
          <StepReview
            draft={draft}
            onEdit={(s) => dispatch({ type: "goTo", step: s })}
            onSubmit={handleSubmit}
            submitting={submitting}
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
            , lalu kembali ke tab ini dan coba lagi. Jangan memuat ulang
            halaman ini karena isian akan hilang.
          </AlertDescription>
        </Alert>
      ) : null}
      {notice === "network" ? (
        <Alert variant="destructive">
          <AlertDescription>
            Data belum bisa diproses di server. Periksa koneksi internet Anda,
            lalu coba lagi. Isian Anda tidak hilang. Jika Anda baru saja menekan
            Kirim Pendaftaran, buka dashboard untuk memastikan apakah pendaftaran
            sudah tercatat sebelum mengirim ulang.
          </AlertDescription>
        </Alert>
      ) : null}

      {notice === "server" ? (
        <Alert variant="destructive">
          <AlertTitle>Pendaftaran belum tersimpan</AlertTitle>
          <AlertDescription>
            Terjadi kendala di server. Isian Anda tidak hilang; coba kirim lagi
            beberapa saat lagi.
          </AlertDescription>
        </Alert>
      ) : null}
      {rejected.length > 0 ? (
        <Alert variant="destructive">
          <AlertTitle>Data tidak lolos pemeriksaan server</AlertTitle>
          <AlertDescription>
            Periksa kembali bagian berikut dengan tombol Ubah:{" "}
            {rejected.map((k) => SECTION_LABEL[k]).join(", ")}.
            <Button
              variant="outline"
              size="sm"
              className="ml-3"
              onClick={() => dispatch({ type: "goTo", step: SECTION_STEP[rejected[0]] })}
            >
              Buka {SECTION_LABEL[rejected[0]]}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
        <Button
          variant="outline"
          onClick={() => dispatch({ type: "back" })}
          disabled={step === 0 || checking || submitting}
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
