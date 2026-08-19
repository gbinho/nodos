export default function SetupEnvPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <p className="text-xs tracking-[0.28em] text-gray-400">NODOS</p>
      <h1 className="mt-4 text-2xl font-medium tracking-tight">Falta o arquivo .env.local</h1>
      <p className="mt-3 text-sm text-gray-400">
        O app não encontra as chaves do Supabase. Crie o arquivo na raiz do projeto e reinicie o{" "}
        <code className="text-white">npm run dev</code>.
      </p>
      <pre className="mt-6 overflow-x-auto border border-gray-800 p-4 text-xs text-gray-400">
        {`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`}
      </pre>
      <p className="mt-4 text-sm text-gray-400">
        No dashboard: Project Settings → API → Project URL e anon public.
      </p>
    </main>
  );
}
