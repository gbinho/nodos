import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { getSessionUser } from "@/lib/auth";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "NODOS",
  description: "Tracking diário de hobbies, projetos e comunidades.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile, configured } = await getSessionUser();

  return (
    <html lang="pt-BR">
      <body className={`${spaceGrotesk.variable} ${spaceGrotesk.className} antialiased bg-black text-white`}>
        {!configured || !user ? (
          children
        ) : (
          <div className="flex min-h-screen">
            <Sidebar profile={profile} />
            <div className="min-w-0 flex-1 px-8 py-10">{children}</div>
          </div>
        )}
      </body>
    </html>
  );
}
