'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function HobbyRequestPage() {
  const [hobbyName, setHobbyName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hobbyName.trim() || !category.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o nome e a categoria do hobby.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // In a real implementation, this would make an API call to submit the request
      // For now, we'll just show a success message
      
      toast({
        title: "Solicitação Enviada",
        description: "Sua solicitação de novo hobby foi enviada com sucesso. Aguarde a aprovação da equipe administrativa."
      });

      // Reset form
      setHobbyName('');
      setCategory('');
      setDescription('');
    } catch (error) {
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar sua solicitação. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Solicitar Novo Hobby</h1>
        <p className="text-muted-foreground mt-2">
          Sugira um novo hobby para ser adicionado à plataforma
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Nome do Hobby</Label>
          <Input
            id="name"
            value={hobbyName}
            onChange={(e) => setHobbyName(e.target.value)}
            placeholder="Ex: Pintura, Leitura, Jardinagem..."
            required
          />
        </div>

        <div>
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex: Artes, Esportes, Ciências..."
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva detalhadamente o hobby e como ele pode ser útil para a comunidade..."
            rows={4}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Enviando..." : "Enviar Solicitação"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}