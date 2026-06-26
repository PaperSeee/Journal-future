import { NextResponse } from "next/server";

// Auth temporairement désactivée — le middleware ne protège plus rien.
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
