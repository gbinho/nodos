import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { OnlineUsers } from "@/components/OnlineUsers";
import { MobileNav } from "@/components/MobileNav";
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
      <body className={`${spaceGrotesk.variable} ${spaceGrotesk.className} antialiased`}>
        {!configured || !user ? (
          children
        ) : (
          <div className="min-h-screen bg-white p-3 text-[#111114] sm:p-5 lg:p-7">
            <Sidebar profile={profile} />
            <div className="h-[calc(100vh-1.5rem)] overflow-y-auto rounded-[28px] bg-[#f7f8fa] px-5 py-7 pb-28 sm:h-[calc(100vh-2.5rem)] sm:px-8 sm:py-9 md:ml-56 md:h-[calc(100vh-2.5rem)] md:rounded-l-none md:rounded-r-[28px] lg:h-[calc(100vh-3.5rem)] lg:px-12 lg:py-11">{children}</div>
            <OnlineUsers userId={user.id} />
            <MobileNav userId={user.id} currentXp={profile?.total_xp ?? 0} />
          </div>
        )}
      </body>
    </html>
  );
}
