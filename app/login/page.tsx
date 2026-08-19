import { LoginForm } from "@/components/LoginForm";
import { SetupEnvPage } from "@/components/SetupEnvPage";
import { getSupabaseEnv } from "@/lib/env";

export default function LoginPage() {
  if (!getSupabaseEnv()) {
    return <SetupEnvPage />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <LoginForm />
    </main>
  );
}
