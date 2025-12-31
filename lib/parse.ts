export type ParsedConversation = {
  summary: string;
  entities: Record<string, string>;
};

export function parseConversation(input: string): ParsedConversation {
  return {
    summary: input.trim(),
    entities: {},
  };
}
