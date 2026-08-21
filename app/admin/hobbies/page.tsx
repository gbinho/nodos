'use client';

import { useState, useEffect } from 'react';
import { 
  getPendingHobbyRequests,
  approveHobbyRequest,
  rejectHobbyRequest
} from '@/lib/hobby-requests';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface HobbyRequest {
  id: string;
  user_id: string;
  hobby_name: string;
  category: string;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export default function HobbyRequestsPage() {
  const [requests, setRequests] = useState<HobbyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const result = await getPendingHobbyRequests();
      if (result.error) {
        toast({
          title: "Erro ao carregar solicitações",
          description: result.error,
          variant: "destructive"
        });
      } else {
        setRequests(result.requests);
      }
    } catch (error) {
      toast({
        title: "Erro ao carregar solicitações",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      const result = await approveHobbyRequest(requestId);
      if (result.success) {
        toast({
          title: "Solicitação aprovada",
          description: "O hobby foi adicionado à plataforma."
        });
        // Remove the approved request from the list
        setRequests(requests.filter(req => req.id !== requestId));
      } else {
        toast({
          title: "Erro ao aprovar",
          description: result.error || "Falha ao aprovar a solicitação.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao aprovar",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      const result = await rejectHobbyRequest(requestId);
      if (result.success) {
        toast({
          title: "Solicitação rejeitada",
          description: "A solicitação foi rejeitada."
        });
        // Remove the rejected request from the list
        setRequests(requests.filter(req => req.id !== requestId));
      } else {
        toast({
          title: "Erro ao rejeitar",
          description: result.error || "Falha ao rejeitar a solicitação.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao rejeitar",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p>Carregando solicitações...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Solicitações de Hobbies</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as solicitações de novos hobbies para a plataforma
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma solicitação pendente</CardTitle>
            <CardDescription>
              Não há solicitações de novos hobbies aguardando aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Todos os pedidos foram processados!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{request.hobby_name}</span>
                  <Badge variant="secondary">{request.category}</Badge>
                </CardTitle>
                <CardDescription>
                  {request.profiles?.username ? (
                    <span>Por @{request.profiles.username}</span>
                  ) : (
                    <span>Usuário desconhecido</span>
                  )}
                  <span className="ml-2">•</span>
                  <span>{new Date(request.created_at).toLocaleDateString('pt-BR')}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {request.description && (
                  <p className="mb-4">{request.description}</p>
                )}
                <div className="flex gap-2">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => handleApprove(request.id)}
                  >
                    Aprovar
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleReject(request.id)}
                  >
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}