'use client';

import { useState } from 'react';
import { createHobbyRequest } from '@/lib/hobby-requests';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface HobbyRequestModalProps {
  children: React.ReactNode;
}

export function HobbyRequestModal({ children }: HobbyRequestModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hobbyName, setHobbyName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createHobbyRequest(
        // This would be obtained from auth context in real app
        'user-id-here', 
        hobbyName,
        category,
        description || null
      );

      if (result.success) {
        toast({
          title: "Solicitação enviada!",
          description: "Gabriel/Moderação analisará seu hobby em breve.",
        });
        setIsOpen(false);
        setHobbyName('');
        setCategory('');
        setDescription('');
      } else {
        toast({
          title: "Erro ao enviar solicitação",
          description: result.error || "Falha ao enviar a solicitação de novo hobby.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao enviar solicitação",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Novo Hobby</DialogTitle>
          <DialogDescription>
            Sugira um novo hobby para ser adicionado à plataforma.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hobbyName">Nome do Hobby</Label>
            <Input
              id="hobbyName"
              placeholder="Ex: Encadernação Manual"
              value={hobbyName}
              onChange={(e) => setHobbyName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              placeholder="Ex: Artesanato"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Breve Justificativa/Descrição</Label>
            <Textarea
              id="description"
              placeholder="Explique por que este hobby é útil para a comunidade..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}