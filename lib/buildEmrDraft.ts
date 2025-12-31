import type { Turn } from "./parseConversation";

export type EmrDraft = {
  chiefComplaint: string;
  presentIllness: string;
  doctorQuestions: string[];
  patientResponses: string[];
};

export function buildEmrDraft(turns: Turn[]): EmrDraft {
  const doctorQuestions: string[] = [];
  const patientResponses: string[] = [];

  for (const turn of turns) {
    if (turn.speaker === "doctor") {
      doctorQuestions.push(turn.text);
    } else if (turn.speaker === "patient") {
      patientResponses.push(turn.text);
    }
  }

  const chiefComplaint = patientResponses[0] ?? "";

  return {
    chiefComplaint,
    presentIllness: chiefComplaint,
    doctorQuestions,
    patientResponses,
  };
}
