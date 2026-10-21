import { LAST_STEP_INDEX } from "./steps";

/**
 * Local, in-memory wizard draft (P2 wizard skeleton).
 *
 * Field lists for steps 2-4 are NOT defined yet: student fields arrive in
 * Phase 3, parent/guardian and previous school in Phase 4 (after owner
 * approval). The sections exist so those phases only add typed fields.
 * Nothing is persisted: no localStorage (personal data), no server.
 */
export type DraftSection = Record<string, string>;

export type RegistrationDraft = {
  termsAccepted: boolean;
  student: DraftSection;
  guardian: DraftSection;
  previousSchool: DraftSection;
};

export type WizardState = {
  step: number;
  /** Furthest step the user has legitimately reached; limits stepper jumps. */
  maxStep: number;
  draft: RegistrationDraft;
};

export type WizardAction =
  | { type: "setTermsAccepted"; accepted: boolean }
  | { type: "next" }
  | { type: "back" }
  | { type: "goTo"; step: number };

export const initialWizardState: WizardState = {
  step: 0,
  maxStep: 0,
  draft: { termsAccepted: false, student: {}, guardian: {}, previousSchool: {} },
};

const clamp = (n: number) => Math.min(Math.max(n, 0), LAST_STEP_INDEX);

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "setTermsAccepted": {
      const draft = { ...state.draft, termsAccepted: action.accepted };
      // Withdrawing consent returns to step 1 and revokes forward progress.
      return action.accepted
        ? { ...state, draft }
        : { step: 0, maxStep: 0, draft };
    }
    case "next": {
      // Server-independent gate: terms must be accepted to leave step 1.
      if (!state.draft.termsAccepted) return state;
      const step = clamp(state.step + 1);
      return { ...state, step, maxStep: Math.max(state.maxStep, step) };
    }
    case "back":
      return { ...state, step: clamp(state.step - 1) };
    case "goTo": {
      if (!state.draft.termsAccepted && action.step > 0) return state;
      const step = clamp(action.step);
      // Only already-reached steps can be jumped to.
      return step <= state.maxStep ? { ...state, step } : state;
    }
  }
}
