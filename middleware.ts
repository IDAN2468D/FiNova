import { withAuth } from "next-auth/middleware";

export default withAuth({
  // כאן אנו מגדירים איזה עמוד מוגדר כעמוד "כניסה מותאם אישית"
  // אם משתמש ינסה להיכנס ללא הרשאה, הוא ינותב אוטומטית לעמוד הזה
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
     * מגן על כל העמודים באתר, למעט רשימת ההחרגות הבאה:
     * - api/register (קריאת API של הרשמה)
     * - api/auth (פניות ל-NextAuth עצמו)
     * - /login (עמוד ההתחברות עצמו)
     * - /register (עמוד ההרשמה עצמו)
     * - קבצים יבשים אופטימליים של השרת כמו תמונות ואייקונים
     */
    "/((?!api/register|api/auth|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};
