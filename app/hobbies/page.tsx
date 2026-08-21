'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-server';
import { OfficialHobbyRow } from '@/lib/database.types';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AllHobbiesPage() {
  const [hobbies, setHobbies] = useState<OfficialHobbyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHobbies();
  }, []);

  const fetchHobbies = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('official_hobbies')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching hobbies:', error);
        return;
      }

      setHobbies(data as OfficialHobbyRow[]);
    } catch (error) {
      console.error('Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p>Carregando hobbies...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Todos os Hobbies</h1>
        <p className="text-muted-foreground mt-2">
          Lista completa de hobbies disponíveis na plataforma
        </p>
      </div>

      {hobbies.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum hobby cadastrado</CardTitle>
            <CardDescription>
              Ainda não há hobbies disponíveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Os hobbies serão adicionados conforme as solicitações forem aprovadas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hobbies.map((hobby) => (
            <Card key={hobby.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{hobby.name}</span>
                  <Badge variant="secondary">{hobby.category}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Slug: {hobby.slug}
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Criado em: {new Date(hobby.created_at).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}