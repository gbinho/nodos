"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const supabase = createSupabaseClient();

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username.trim() || undefined },
          },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setInfo("Conta criada. Confirme o e-mail no Supabase (se estiver ativo) e entre.");
          setMode("login");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na autenticação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">
          {mode === "login" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-1 text-sm text-gray-400">NODOS · tracking de hobbies</p>
      </div>

      {mode === "signup" ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-400">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-800 bg-black px-3 py-2 text-white outline-none focus:border-gray-400"
            placeholder="seu_handle"
            autoComplete="username"
          />
        </label>
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-gray-400">E-mail</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-800 bg-black px-3 py-2 text-white outline-none focus:border-gray-400"
          autoComplete="email"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-gray-400">Senha</span>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-800 bg-black px-3 py-2 text-white outline-none focus:border-gray-400"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>

      {error ? <p className="text-sm text-gray-400">{error}</p> : null}
      {info ? <p className="text-sm text-gray-400">{info}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="border border-white px-3 py-2 text-sm text-white hover:bg-white hover:text-black disabled:border-gray-800 disabled:text-gray-400"
      >
        {loading ? "Aguarde…" : mode === "login" ? "Entrar" : "Cadastrar"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "signup" : "login");
          setError(null);
          setInfo(null);
        }}
        className="text-sm text-gray-400 hover:text-white"
      >
        {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
      </button>
    </form>
  );
}
