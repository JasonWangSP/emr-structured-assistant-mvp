export type Turn = {
  turnId: number;
  speaker: "doctor" | "patient";
  text: string;
};

const SPEAKER_PREFIX_REGEX = /(医生|患者)[:：]/g;

const SPEAKER_MAP: Record<string, Turn["speaker"]> = {
  医生: "doctor",
  患者: "patient",
};

export function parseConversation(rawText: string): Turn[] {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const text = rawText.trim();
  const matches = Array.from(text.matchAll(SPEAKER_PREFIX_REGEX));
  const turns: Turn[] = [];

  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const label = match[1];
    const speaker = SPEAKER_MAP[label];

    const start = (match.index ?? 0) + match[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? text.length : text.length;
    const content = text.slice(start, end).trim();

    if (content) {
      turns.push({
        turnId: turns.length + 1,
        speaker,
        text: content,
      });
    }
  }

  return turns;
}
