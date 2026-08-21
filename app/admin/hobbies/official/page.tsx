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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AdminOfficialHobbiesPage() {
  const [hobbies, setHobbies] = useState<OfficialHobbyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHobby, setNewHobby] = useState({
    name: '',
    category: '',
    slug: ''
  });
  const [error, setError] = useState<string | null>(null);

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
        setError('Erro ao carregar os hobbies');
        return;
      }

      setHobbies(data as OfficialHobbyRow[]);
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Erro inesperado ao carregar os hobbies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddHobby = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('official_hobbies')
        .insert([{
          name: newHobby.name,
          category: newHobby.category,
          slug: newHobby.slug
        }])
        .select();

      if (error) {
        console.error('Error adding hobby:', error);
        setError('Erro ao adicionar hobby');
        return;
      }

      // Refresh the list
      fetchHobbies();
      
      // Reset form
      setNewHobby({ name: '', category: '', slug: '' });
      setError(null);
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Erro inesperado ao adicionar hobby');
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
        <h1 className="text-3xl font-bold">Hobbies Oficiais</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie os hobbies oficiais da plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
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
                  Adicione novos hobbies usando o formulário ao lado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Novo Hobby</CardTitle>
              <CardDescription>
                Cadastre um novo hobby oficial
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleAddHobby} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newHobby.name}
                    onChange={(e) => setNewHobby({...newHobby, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={newHobby.category}
                    onChange={(e) => setNewHobby({...newHobby, category: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={newHobby.slug}
                    onChange={(e) => setNewHobby({...newHobby, slug: e.target.value})}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Adicionar Hobby
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}