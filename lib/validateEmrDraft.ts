import Ajv from "ajv";
import schema from "@/schemas/emr_draft_v1.json";

const ajv = new Ajv({
  allErrors: true,
});

// MVP: schema validator for AI draft structure
const validate = ajv.compile(schema);

export function validateEmrDraft(emrDraft: unknown): boolean {
  const valid = validate(emrDraft);
  if (!valid) {
    console.error(validate.errors);
  }
  return Boolean(valid);
}

// future extension: expose detailed error mapping for UI
