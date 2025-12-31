import type { EmrDraft } from "./buildEmrDraft";

export type StructuredEmr = {
  subjective: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
  };
  objective: {
    reportedSymptoms: string[];
  };
  assessment: {
    preliminaryNote: string;
  };
  plan: {
    nextQuestions: string[];
    note: string;
  };
};

const PRELIMINARY_NOTE =
  "This is a preliminary structured record for physician review. No diagnosis is made.";
const PLAN_NOTE = "For clinical reference only. Physician confirmation required.";
const SYMPTOM_SPLIT_REGEX = /[，。,.]/g;

export function buildStructuredEmr(emrDraft: EmrDraft): StructuredEmr {
  const reportedSymptoms = emrDraft.patientResponses
    .flatMap((response) => response.split(SYMPTOM_SPLIT_REGEX))
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

  return {
    subjective: {
      chiefComplaint: emrDraft.chiefComplaint,
      historyOfPresentIllness: emrDraft.presentIllness,
    },
    objective: {
      reportedSymptoms,
    },
    assessment: {
      preliminaryNote: PRELIMINARY_NOTE,
    },
    plan: {
      nextQuestions: emrDraft.doctorQuestions,
      note: PLAN_NOTE,
    },
  };
}
