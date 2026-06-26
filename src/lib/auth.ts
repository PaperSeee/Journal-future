import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const APP_USER_EMAIL = process.env.APP_USER_EMAIL ?? "";
const APP_USER_PASSWORD_HASH = process.env.APP_USER_PASSWORD_HASH ?? "";
const APP_USER_PASSWORD = process.env.APP_USER_PASSWORD ?? "";

/** Constant-ish credential check against the single configured account. */
async function verifyCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  if (!APP_USER_EMAIL) return false;
  if (email.trim().toLowerCase() !== APP_USER_EMAIL.trim().toLowerCase()) {
    return false;
  }
  if (APP_USER_PASSWORD_HASH) {
    try {
      return await bcrypt.compare(password, APP_USER_PASSWORD_HASH);
    } catch {
      return false;
    }
  }
  // Dev fallback: plain password comparison.
  if (APP_USER_PASSWORD) return password === APP_USER_PASSWORD;
  return false;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30 days
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const ok = await verifyCredentials(
          credentials.email,
          credentials.password,
        );
        if (!ok) return null;
        return { id: "owner", email: APP_USER_EMAIL, name: "HqGambler" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      return token;
    },
    async session({ session }) {
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
