import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Deprecated: MVP uses /api/emr-draft for EMR generation.
export async function POST() {
  return NextResponse.json(
    { error: "DEPRECATED_ROUTE", message: "Use /api/emr-draft instead." },
    { status: 410 }
  );
}
