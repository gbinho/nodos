"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

type Report = { id: string; reporter_id: string; checkin_id: string | null; comment_id: string | null; reason: string; status: string; created_at: string };

export function AdminReports({ reports }: { reports: Report[] }) {
  const router = useRouter();
  const [working, setWorking] = useState<string | null>(null);

  async function resolve(report: Report, remove: boolean) {
    setWorking(report.id);
    const supabase = createSupabaseClient();
    if (remove) {
      if (report.checkin_id) await supabase.from("checkins").delete().eq("id", report.checkin_id);
      if (report.comment_id) await supabase.from("comments").delete().eq("id", report.comment_id);
    }
    await supabase.from("reports").update({ status: remove ? "resolved" : "dismissed" }).eq("id", report.id);
    setWorking(null);
    router.refresh();
  }

  return <section className="rounded-2xl border border-gray-200 bg-white p-6"><p className="text-xs uppercase tracking-[0.18em] text-gray-500">MODERAÇÃO</p><h1 className="mt-2 text-2xl font-semibold">Denúncias recebidas</h1><div className="mt-5 flex flex-col gap-3">{reports.length ? reports.map((report) => <article key={report.id} className="rounded-xl border border-gray-200 p-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-gray-900">Motivo: {report.reason}</span><span className="text-xs text-gray-500">{new Date(report.created_at).toLocaleString("pt-BR")}</span></div><p className="mt-2 text-xs text-gray-500">Denunciante: {report.reporter_id}</p><p className="text-xs text-gray-500">Conteúdo: {report.checkin_id ? `post ${report.checkin_id}` : `comentário ${report.comment_id}`}</p><div className="mt-4 flex gap-2"><button type="button" disabled={working === report.id} onClick={() => void resolve(report, true)} className="rounded-lg bg-red-600 px-3 py-2 text-xs text-white">Excluir conteúdo</button><button type="button" disabled={working === report.id} onClick={() => void resolve(report, false)} className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700">Descartar denúncia</button></div></article>) : <p className="py-10 text-center text-sm text-gray-500">Nenhuma denúncia pendente.</p>}</div></section>;
}
