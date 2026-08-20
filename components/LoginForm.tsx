"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { hasProfanity } from "@/lib/profanityFilter";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [captchaNumbers] = useState(() => [1 + Math.floor(Math.random() * 10), 1 + Math.floor(Math.random() * 10)]);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const cleanUsername = username.trim().toLowerCase();
        if (password.length < 8) throw new Error("A senha precisa ter pelo menos 8 caracteres.");
        if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) throw new Error("O username aceita apenas letras, números, hífen e underline.");
        if (hasProfanity(cleanUsername)) throw new Error("Este nome de usuário contém termos não permitidos.");
        if (Number(captchaAnswer) !== captchaNumbers[0] + captchaNumbers[1]) throw new Error("Resposta matemática incorreta.");
      }
      const supabase = createSupabaseClient();
      let founder = false;

      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username: username.trim().toLowerCase() },
          },
        });
        if (signUpError) throw signUpError;

        if (!data.session) {
          setInfo("Conta criada. Confirme o e-mail no Supabase (se estiver ativo) e entre.");
          setMode("login");
          return;
        }
        const { count } = await supabase.from("profiles").select("id", { count: "exact", head: true });
        if ((count ?? 51) <= 50) {
          founder = true;
          setInfo("🎉 Parabéns! Você é um dos 50 membros fundadores do Nodos. Badge exclusiva desbloqueada!");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      if (founder) {
        window.setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 2200);
      } else {
        router.push("/");
        router.refresh();
      }
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
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
            className="border border-gray-800 bg-black px-3 py-2 text-white outline-none focus:border-gray-400"
            placeholder="seu_handle"
            autoComplete="username"
          />
          {username && !/^[a-zA-Z0-9_-]+$/.test(username) ? <span className="text-xs text-red-400">Use apenas letras, números, hífen e underline.</span> : null}
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
          minLength={mode === "signup" ? 8 : 6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-800 bg-black px-3 py-2 text-white outline-none focus:border-gray-400"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        {mode === "signup" && password.length > 0 && password.length < 8 ? <span className="text-xs text-red-400">A senha precisa ter pelo menos 8 caracteres ({password.length}/8).</span> : null}
      </label>

      {mode === "signup" ? (
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-gray-400">Desafio: quanto é {captchaNumbers[0]} + {captchaNumbers[1]}?</span>
          <input type="number" required value={captchaAnswer} onChange={(event) => setCaptchaAnswer(event.target.value)} className="border border-gray-800 bg-black px-3 py-2 text-white outline-none focus:border-gray-400" inputMode="numeric" />
          {captchaAnswer && Number(captchaAnswer) !== captchaNumbers[0] + captchaNumbers[1] ? <span className="text-xs text-red-400">Resposta incorreta.</span> : null}
        </label>
      ) : null}

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
