import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * קונפיגורציית NextAuth במיוחד עבור הפרויקט שלנו.
 * מאפשרת חוויית התחברות מאובטחת באמצעות האימייל והסיסמה השמורים במסד הנתונים.
 */
export const authOptions: NextAuthOptions = {
  providers: [
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
    async jwt({ token, user, trigger, session }) {
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
