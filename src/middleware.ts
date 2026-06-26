export { default } from "next-auth/middleware";

// Protect everything except the login page, auth API, and static/PWA assets.
export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest.webmanifest|sw.js|robots.txt).*)",
  ],
};
