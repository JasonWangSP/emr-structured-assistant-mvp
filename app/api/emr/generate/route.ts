import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, language } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid input text" },
        { status: 400 }
      );
    }

    /**
     * ⚠️ MVP 版本：先 mock 结构化 EMR
     * 后续你可以在这里接 DeepSeek
     */
    const emr = {
      chief_complaint: "咳嗽、乏力",
      present_illness: text.slice(0, 200),
      past_history: "",
      diagnosis: "上呼吸道感染（考虑）",
      treatment_plan: "建议休息，多饮水，必要时对症处理",
    };

    return NextResponse.json({
      success: true,
      emr,
    });
  } catch (err) {
    console.error("[EMR GENERATE ERROR]", err);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
