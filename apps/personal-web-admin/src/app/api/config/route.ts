import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    enableRegister: process.env.NEXT_PUBLIC_ENABLE_REGISTER !== "false",
  });
}
