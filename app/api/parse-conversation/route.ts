import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      status: "ok",
      message: "parse-conversation placeholder",
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      message: "parse-conversation placeholder",
    },
    { status: 200 }
  );
}
