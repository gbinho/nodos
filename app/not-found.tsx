import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 text-center">
      <div className="mb-6 text-6xl font-bold text-gray-900">404</div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Página não encontrada</h1>
      <p className="mb-8 text-gray-600">Desculpe, a página que você está procurando não existe ou foi movida.</p>
      <Link 
        href="/" 
        className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para a página inicial
      </Link>
    </div>
  );
}