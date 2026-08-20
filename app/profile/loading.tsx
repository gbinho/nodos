export default function ProfileLoading() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10" aria-label="Carregando perfil">
      <div className="h-12 w-56 animate-pulse bg-gray-900" />
      <section className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <div className="h-56 animate-pulse border border-gray-800 bg-gray-950 md:col-span-3" />
        <div className="h-56 animate-pulse border border-gray-800 bg-gray-900 md:col-span-3" />
        <div className="h-40 animate-pulse border border-gray-800 md:col-span-2" />
        <div className="h-40 animate-pulse border border-gray-800 md:col-span-2" />
        <div className="h-40 animate-pulse border border-gray-800 bg-gray-950 md:col-span-2" />
      </section>
      <div className="h-48 animate-pulse border border-gray-800" />
    </main>
  );
}