export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export function validatePayload(): ValidationResult {
  return { valid: true, errors: [] };
}
