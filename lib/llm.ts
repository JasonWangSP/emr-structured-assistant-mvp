export type LlmResponse = {
  output: string;
};

export async function callLlm(): Promise<LlmResponse> {
  return { output: "llm client placeholder" };
}
