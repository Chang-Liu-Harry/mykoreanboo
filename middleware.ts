import { authMiddleware, redirectToSignIn } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: [
    '/',
    '/api/webhook'
  ],

  afterAuth(auth, req) {
    console.log(`Auth middleware triggered for URL: ${req.url}`);
    console.log(`User ID: ${auth.userId}, isPublicRoute: ${auth.isPublicRoute}`);

    if (auth.userId && auth.isPublicRoute) {
      let path = '/dashboard'
      const dashboard = new URL(path, req.url)
      return NextResponse.redirect(dashboard);
    }

    if (!auth.userId && !auth.isPublicRoute) {
      return redirectToSignIn({
        returnBackUrl: req.url,
      });
    }

    console.log(`User ID: ${auth.userId}, URL: ${req.url}`);
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
