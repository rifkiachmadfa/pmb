import {
  emptyParentsDraft,
  validateParentsDraft,
  type ParentsDraft,
  type ParentsFieldName,
} from "./guardian-schema";
import {
  emptySchoolDraft,
  validateSchoolDraft,
  type SchoolDraft,
  type SchoolFieldName,
} from "./school-schema";
import {
  LAST_STEP_INDEX,
  PARENTS_STEP_INDEX,
  SCHOOL_STEP_INDEX,
  STUDENT_STEP_INDEX,
} from "./steps";
import {
  emptyStudentDraft,
  validateStudentDraft,
  type StudentDraft,
  type StudentFieldName,
} from "./student-schema";

/**
 * Local, in-memory wizard draft.
 *
 * `student` (Phase 3), `guardian` = father/mother/guardian and
 * `previousSchool` (Phase 4) are typed.
 * Nothing is persisted: no localStorage (personal data), no server.
 */
export type RegistrationDraft = {
  termsAccepted: boolean;
  student: StudentDraft;
  guardian: ParentsDraft;
  previousSchool: SchoolDraft;
};

export type WizardState = {
  step: number;
  /** Furthest step the user has legitimately reached; limits stepper jumps. */
  maxStep: number;
  draft: RegistrationDraft;
};

export type WizardAction =
  | { type: "setTermsAccepted"; accepted: boolean }
  | { type: "setStudentField"; name: StudentFieldName; value: string }
  | { type: "setParentsField"; name: ParentsFieldName; value: string }
  | { type: "setSchoolField"; name: SchoolFieldName; value: string }
  | { type: "next" }
  | { type: "back" }
  | { type: "goTo"; step: number };

export const initialWizardState: WizardState = {
  step: 0,
  maxStep: 0,
  draft: {
    termsAccepted: false,
    student: emptyStudentDraft(),
    guardian: emptyParentsDraft(),
    previousSchool: emptySchoolDraft(),
  },
};

const clamp = (n: number) => Math.min(Math.max(n, 0), LAST_STEP_INDEX);

/** Browser-side gate only; the server action and (later) persistence re-validate. */
const studentIsValid = (state: WizardState) =>
  validateStudentDraft(state.draft.student).ok;

const parentsAreValid = (state: WizardState) =>
  validateParentsDraft(state.draft.guardian).ok;

const schoolIsValid = (state: WizardState) =>
  validateSchoolDraft(state.draft.previousSchool).ok;

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "setTermsAccepted": {
      const draft = { ...state.draft, termsAccepted: action.accepted };
      // Withdrawing consent returns to step 1 and revokes forward progress.
      return action.accepted
        ? { ...state, draft }
        : { step: 0, maxStep: 0, draft };
    }
    case "setStudentField":
      return {
        ...state,
        draft: {
          ...state.draft,
          student: { ...state.draft.student, [action.name]: action.value },
        },
      };
    case "setParentsField":
      return {
        ...state,
        draft: {
          ...state.draft,
          guardian: { ...state.draft.guardian, [action.name]: action.value },
        },
      };
    case "setSchoolField":
      return {
        ...state,
        draft: {
          ...state.draft,
          previousSchool: { ...state.draft.previousSchool, [action.name]: action.value },
        },
      };
    case "next": {
      // Server-independent gate: terms must be accepted to leave step 1.
      if (!state.draft.termsAccepted) return state;
      // Student data must be valid to leave step 2.
      if (state.step === STUDENT_STEP_INDEX && !studentIsValid(state)) return state;
      // Parents/guardian data must be valid to leave step 3.
      if (state.step === PARENTS_STEP_INDEX && !parentsAreValid(state)) return state;
      // Previous-school data must be valid to leave step 4.
      if (state.step === SCHOOL_STEP_INDEX && !schoolIsValid(state)) return state;
      const step = clamp(state.step + 1);
      return { ...state, step, maxStep: Math.max(state.maxStep, step) };
    }
    case "back":
      return { ...state, step: clamp(state.step - 1) };
    case "goTo": {
      if (!state.draft.termsAccepted && action.step > 0) return state;
      // No jumping past Data Siswa while its draft is invalid.
      if (action.step > STUDENT_STEP_INDEX && !studentIsValid(state)) return state;
      if (action.step > PARENTS_STEP_INDEX && !parentsAreValid(state)) return state;
      if (action.step > SCHOOL_STEP_INDEX && !schoolIsValid(state)) return state;
      const step = clamp(action.step);
      // Only already-reached steps can be jumped to.
      return step <= state.maxStep ? { ...state, step } : state;
    }
  }
}
