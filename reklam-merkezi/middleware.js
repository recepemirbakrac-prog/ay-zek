import { NextResponse } from "next/server";

export const config = { matcher: ["/:path*"] };

export function middleware(request) {
  const header = request.headers.get("authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme === "Basic" && encoded) {
    try {
      const decoded = atob(encoded);
      const separator = decoded.indexOf(":");
      const username = decoded.slice(0, separator);
      const password = decoded.slice(separator + 1);
      if (separator > 0 && username === "admin" && password === process.env.ADMIN_PASSWORD) {
        const response = NextResponse.next();
        response.headers.set("Cache-Control", "private, no-store, max-age=0");
        return response;
      }
    } catch {}
  }
  return new NextResponse("Bu siteye erişmek için yönetici girişi gereklidir.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Reklam Merkezi - Yönetici", charset="UTF-8"',
      "Cache-Control": "no-store"
    }
  });
}
