import type { StructuredEmr } from "./buildStructuredEmr";

export type MedicalEmr = {
  chiefComplaint: string;
  presentIllness: string;
  pastHistory: string;
  summary: string;
};

const TIME_RULES: Array<{ pattern: RegExp; medical: string }> = [
  { pattern: /这两天|近两天|近二天|最近两天/g, medical: "两天" },
  { pattern: /最近一周|近一周|近七天/g, medical: "一周" },
  { pattern: /最近|近期|近来/g, medical: "近期" },
  { pattern: /半个月|近半个月/g, medical: "半月" },
];

const PHRASE_RULES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /睡不好|睡不着|睡眠差/g, replacement: "睡眠障碍" },
  { pattern: /老醒|容易醒|易醒/g, replacement: "夜间易醒" },
  { pattern: /白天有点困|白天困|白天疲劳|白天乏力/g, replacement: "日间嗜睡感" },
  { pattern: /心慌|心悸/g, replacement: "心悸" },
  { pattern: /出汗/g, replacement: "出汗" },
  { pattern: /不舒服|不适/g, replacement: "不适" },
  { pattern: /头晕/g, replacement: "头晕" },
  { pattern: /头痛/g, replacement: "头痛" },
  { pattern: /咳嗽/g, replacement: "咳嗽" },
  { pattern: /发烧|发热/g, replacement: "发热" },
  { pattern: /胸闷/g, replacement: "胸闷" },
  { pattern: /气短|呼吸不畅/g, replacement: "气短" },
  { pattern: /胃口不好|食欲差/g, replacement: "食欲减退" },
  { pattern: /肚子疼|腹痛/g, replacement: "腹痛" },
  { pattern: /拉肚子|腹泻/g, replacement: "腹泻" },
  { pattern: /便秘/g, replacement: "便秘" },
  { pattern: /失眠/g, replacement: "失眠" },
];

const COLLOQUIAL_RULES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /我(觉得|感觉)?/g, replacement: "" },
  { pattern: /有点|有些|一点|稍微/g, replacement: "轻度" },
  { pattern: /老是|总是/g, replacement: "易" },
  { pattern: /不明显/g, replacement: "轻度" },
];

const cleanupText = (text: string) => text.replace(/[，。,.]+/g, "，").trim();

const applyRules = (text: string, rules: Array<{ pattern: RegExp; replacement: string }>) => {
  return rules.reduce((result, rule) => result.replace(rule.pattern, rule.replacement), text);
};

const rewriteMedicalText = (text: string) => {
  let result = text.trim();
  if (!result) {
    return "";
  }

  result = applyRules(result, PHRASE_RULES);
  result = applyRules(result, COLLOQUIAL_RULES);
  result = result.replace(/(轻度)+/g, "轻度");
  result = result.replace(/^[，。,.]+/, "");
  return cleanupText(result);
};

const extractTimePhrase = (text: string) => {
  const numericMatch = text.match(/([一二三四五六七八九十两\d]+)(天|日|周|个月|月|年)/);
  if (numericMatch) {
    return `${numericMatch[1]}${numericMatch[2]}`;
  }
  for (const rule of TIME_RULES) {
    if (rule.pattern.test(text)) {
      return rule.medical;
    }
  }
  return "";
};

const stripTimePhrase = (text: string) => {
  let result = text;
  for (const rule of TIME_RULES) {
    result = result.replace(rule.pattern, "");
  }
  result = result.replace(/([一二三四五六七八九十两\d]+)(天|日|周|个月|月|年)/g, "");
  return result;
};

const buildChiefComplaint = (text: string) => {
  if (!text.trim()) {
    return "";
  }
  const timePhrase = extractTimePhrase(text) || "近期";
  const bodyText = rewriteMedicalText(stripTimePhrase(text)) || "不适";
  const symptom = bodyText.split(/[，、,.]/)[0]?.trim() || "不适";
  return `${symptom}${timePhrase}`;
};

const buildPresentIllness = (text: string) => {
  if (!text.trim()) {
    return "";
  }
  const timePhrase = extractTimePhrase(text) || "近期";
  const body = rewriteMedicalText(stripTimePhrase(text)) || "出现不适";
  return `患者${timePhrase}出现${body}，目前症状仍在，需进一步问诊完善病史。`;
};

const buildChiefComplaintFromSymptoms = (baseText: string, symptoms: string[]) => {
  const timePhrase = extractTimePhrase(baseText) || "近期";
  const trimmedSymptoms = symptoms
    .map((symptom) => rewriteMedicalText(stripTimePhrase(symptom)))
    .filter((symptom) => symptom.length > 0)
    .slice(0, 2)
    .map((symptom) => `${symptom}${timePhrase}`);

  return trimmedSymptoms.join("、");
};

const buildPastHistory = () => {
  return "未提及既往史";
};

const buildSummary = (chiefComplaint: string, presentIllness: string, pastHistory: string) => {
  const parts: string[] = [];
  if (chiefComplaint) {
    parts.push(`主诉：${chiefComplaint}`);
  }
  if (presentIllness) {
    parts.push(`现病史：${presentIllness}`);
  }
  if (pastHistory) {
    parts.push(`既往史：${pastHistory}`);
  }
  if (parts.length === 0) {
    return "";
  }
  return `本次就诊，${parts.join("。")}。`;
};

export function medicalRewrite(structuredEmr: StructuredEmr): MedicalEmr {
  const baseIllnessText =
    structuredEmr.subjective.historyOfPresentIllness || structuredEmr.subjective.chiefComplaint;
  const symptoms = structuredEmr.objective.reportedSymptoms;
  const chiefComplaint =
    buildChiefComplaintFromSymptoms(baseIllnessText, symptoms) ||
    buildChiefComplaint(structuredEmr.subjective.chiefComplaint);
  const presentIllness = buildPresentIllness(baseIllnessText);
  const pastHistory = buildPastHistory();
  const summary = buildSummary(chiefComplaint, presentIllness, pastHistory);

  return {
    chiefComplaint,
    presentIllness,
    pastHistory,
    summary,
  };
}
