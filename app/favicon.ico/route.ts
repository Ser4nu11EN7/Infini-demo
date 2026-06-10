import { NextResponse } from "next/server";

export function GET(request: Request) {
  return NextResponse.redirect(new URL("/infini-logo.jpg", request.url), {
    status: 308,
    headers: {
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
