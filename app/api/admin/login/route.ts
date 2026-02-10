import { NextResponse } from "next/server";
import { AdminLoginSchema } from "@/lib/validate";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = AdminLoginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  if (parsed.data.adminPassword !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("pb_admin", "1", { httpOnly: true, sameSite: "lax", path: "/" });
  return res;
}
