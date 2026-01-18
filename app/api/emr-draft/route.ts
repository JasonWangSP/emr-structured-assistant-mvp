import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type EvidenceItem = {
  text: string;
  evidenceIds: string[];
};

type EmrDraft = {
  chief_complaint: EvidenceItem;
  present_illness: EvidenceItem;
  past_history: EvidenceItem;
  summary: string;
  diagnostic_assessment: EvidenceItem;
};

type StructuredEmrResponse = {
  chiefComplaint: EvidenceItem;
  presentIllness: EvidenceItem;
  pastHistory: EvidenceItem;
  diagnosticAssessment: EvidenceItem;
};

type EvidenceLine = {
  id: string;
  text: string;
};

type LlmRequest = {
  conversation: string;
  history?: string;
  evidence?: EvidenceLine[];
};

const SYSTEM_PROMPT = [
  "你是病历结构化助理（EMR Draft Generator）。",
  "只能基于输入内容生成结果，不补充未出现的信息。",
  "绝对禁止诊断、治疗建议、病因推测或不确定性判断词。",
  "输入为原始就诊对话，不保证角色标注，请自行从语义中提取信息。",
  "输出必须是严格 JSON，且仅包含以下字段：",
  '{"chief_complaint":{"text":"","evidenceIds":[]},"present_illness":{"text":"","evidenceIds":[]},"past_history":{"text":"","evidenceIds":[]},"summary":"","diagnostic_assessment":{"text":"","evidenceIds":[]}}',
  "主诉必须是1到2个症状，每个症状格式为“症状词+时间”，不得超过3个症状。",
  "现病史为围绕主诉的时间性经过描述，中文医学书面表达。",
  "既往史为历史对话中的事实性整理，如未提及则写“未提及明确既往史”。",
  "诊断分析需覆盖中医与西医视角，仅做初步推理与思路提示，必须写明“仅供医生参考”，不得给出治疗方案或处方。",
  "summary 为客观概述，不诊断、不建议、不使用“可能/考虑”。",
  "evidenceIds 为证据编号数组，如 [" + '"E1"' + "," + '"E2"' + "]，编号需与证据时间线一致。",
].join("\n");

const extractJson = (text: string) => {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  }
  return cleaned;
};

const isEvidenceItem = (value: unknown): value is EvidenceItem => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const item = value as EvidenceItem;
  return (
    typeof item.text === "string" &&
    Array.isArray(item.evidenceIds) &&
    item.evidenceIds.every((ref) => typeof ref === "string")
  );
};

const isValidEmrDraft = (value: unknown): value is EmrDraft => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const draft = value as EmrDraft;
  return (
    isEvidenceItem(draft.chief_complaint) &&
    isEvidenceItem(draft.present_illness) &&
    isEvidenceItem(draft.past_history) &&
    isEvidenceItem(draft.diagnostic_assessment) &&
    typeof draft.summary === "string"
  );
};

export async function POST(request: Request) {
  const body = (await request.json()) as LlmRequest;
  console.debug("emr-draft.request.body", body);
  const conversation = body.conversation?.trim();
  const history = body.history?.trim();
  console.debug("emr-draft.request.parsed", { conversation, history });

  if (!conversation) {
    return NextResponse.json({ error: "conversation is required" }, { status: 400 });
  }

  const apiKey = process.env.LLM_API_KEY;
  const apiUrl = process.env.LLM_API_URL || "https://api.deepseek.com/v1/chat/completions";
  const model = process.env.LLM_MODEL || "deepseek-chat";

  if (!apiKey) {
    return NextResponse.json({ error: "Missing LLM_API_KEY" }, { status: 500 });
  }

  const evidenceLines =
    body.evidence
      ?.filter((item) => item && typeof item.id === "string")
      .map((item) => `${item.id}: ${item.text ?? ""}`)
      .join("\n") || "无";

  const userPromptTemplate = [
    "当前就诊对话：",
    conversation,
    "历史对话记录：",
    history || "无",
    "证据时间线：",
    "{{EVIDENCE_LINES}}",
  ].join("\n");
  const userPrompt = userPromptTemplate.replace("{{EVIDENCE_LINES}}", evidenceLines);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json({ error: errorText }, { status: 502 });
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "LLM response is empty" }, { status: 502 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extractJson(content));
  } catch (error) {
    console.error("LLM raw response:", content);
    console.error(error);
    return NextResponse.json({ error: "LLM response is not valid JSON" }, { status: 500 });
  }

  if (!isValidEmrDraft(parsed)) {
    console.error("Invalid EMR draft shape", parsed);
    return NextResponse.json({ error: "LLM response shape invalid" }, { status: 502 });
  }

  const responsePayload: StructuredEmrResponse = {
    chiefComplaint: parsed.chief_complaint,
    presentIllness: parsed.present_illness,
    pastHistory: parsed.past_history,
    diagnosticAssessment: parsed.diagnostic_assessment,
  };

  return NextResponse.json(responsePayload);
}
