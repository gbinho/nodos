export function ProjectEmpty() {
  return (
    <section className="border border-gray-800 p-6">
      <p className="text-xs tracking-[0.18em] text-gray-400">PROJETOS</p>
      <p className="mt-8 text-sm text-gray-400">Nenhum projeto ativo no momento</p>
      <button
        type="button"
        className="mt-6 border border-gray-800 px-3 py-1.5 text-sm text-gray-400 hover:border-gray-400 hover:text-white"
      >
        [+ Iniciar Tracking]
      </button>
    </section>
  );
}
