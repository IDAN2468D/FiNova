import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * קונפיגורציית NextAuth במיוחד עבור הפרויקט שלנו.
 * מאפשרת חוויית התחברות מאובטחת באמצעות האימייל והסיסמה השמורים במסד הנתונים.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          // הרשאות שירותי גוגל הרחבים כולל: דרייב, שיטס, יומן, ג'ימייל, משימות, דוקס ואנשי קשר
          scope: "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/contacts.readonly"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "אימייל", type: "text" },
        password: { label: "סיסמה", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("חובה להזין אימייל וסיסמה כדי להתחבר.");
        }

        try {
          await connectMongoDB();
          
          // איתור המשתמש לפי אימייל
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            return null; // המשתמש לא נמצא
          }

          // בדיקת אמינות הסיסמה מול הגרסה המוצפנת שהשגנו מהשרת
          const passwordsMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordsMatch) {
            return null; // הסיסמה שגויה
          }

          // חשוב להחזיר רק את הדברים הנחוצים - ולהסיר את הסיסמה!
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image ? `/api/user/avatar?t=${Date.now()}` : null,
          };
        } catch (error) {
          console.error("שגיאה בהתחברות NextAuth:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectMongoDB();
          let dbUser = await User.findOne({ email: user.email });
          if (!dbUser) {
            dbUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image || "",
            });
          }
          // Mapping MongoDB _id to the session user id
          user.id = dbUser._id.toString();
          return true;
        } catch (error) {
          console.error("Error saving Google user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      if (user) {
        token.id = user.id;
        token.image = user.image;
      }
      // עדכון ה-Token במקרה של החלפת שם/אימייל/תמונה
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
        if (session.email !== undefined) token.email = session.email;
        if (session.image !== undefined) token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // @ts-ignore
        session.user.id = token.id;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = (token.image as string) || null;
        // העברת האסימון של גוגל לשימוש ב-API routes
        // @ts-ignore
        session.accessToken = token.accessToken;
      }
      return session;
    }
  },
  session: {
    // השתמשו בגישת ה-JWT לטובת Stateless Sessions יעילים מול MongoDB
    strategy: "jwt",
  },
  // שימוש במפתח אבטחה (יש להגדיר .env בשם NEXTAUTH_SECRET)
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    // ניתן מפה לנתב לעמוד לוגין מותאם אישית שנבנה בעתיד
    signIn: "/", 
  },
};

const handler = NextAuth(authOptions);

// מסלולי החשבונות של NextAuth בגרסת App Router
export { handler as GET, handler as POST };
