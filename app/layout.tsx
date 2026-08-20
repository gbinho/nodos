import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { OnlineUsers } from "@/components/OnlineUsers";
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
          <div className="flex min-h-screen flex-col gap-3 bg-white p-3 text-[#111114] sm:p-5 lg:flex-row lg:gap-0 lg:p-7">
            <Sidebar profile={profile} />
            <div className="min-h-0 min-w-0 flex-1 rounded-[28px] bg-[#f7f8fa] px-5 py-7 sm:px-8 sm:py-9 lg:min-h-[calc(100vh-3.5rem)] lg:rounded-l-none lg:rounded-r-[28px] lg:px-12 lg:py-11">{children}</div>
            <OnlineUsers userId={user.id} />
          </div>
        )}
      </body>
    </html>
  );
}
