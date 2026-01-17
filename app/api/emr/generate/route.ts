import { NextResponse } from "next/server";

type EmrResponse = {
  success: true;
  emr: {
    chief_complaint: string;
    present_illness: string;
    diagnosis: string;
    treatment_plan: string;
  };
};

export async function POST(req: Request) {
  const body = (await req.json()) as { text?: string; language?: string };
  const text = body.text?.trim() ?? "";

  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const response: EmrResponse = {
    success: true,
    emr: {
      chief_complaint: "咳嗽 5 天，夜间加重",
      present_illness: "干咳起病，随后有黄痰，伴低热与轻度气短。",
      diagnosis: "急性支气管炎（考虑）",
      treatment_plan: "对症止咳化痰，必要时复诊评估。",
    },
  };

  return NextResponse.json(response);
}
