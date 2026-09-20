import NextAuth from "next-auth";
import authConfig from "@/server/auth/config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  if (req.nextUrl.pathname.startsWith("/me") && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/me/:path*"],
};
