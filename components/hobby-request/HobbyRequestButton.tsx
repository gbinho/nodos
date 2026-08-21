'use client';

import { Button } from '@/components/ui/button';
import { HobbyRequestModal } from './HobbyRequestModal';
import { PlusIcon } from 'lucide-react';

export function HobbyRequestButton() {
  return (
    <HobbyRequestModal>
      <Button variant="outline" size="sm">
        <PlusIcon className="w-4 h-4 mr-2" />
        💡 Solicitar Novo Hobby
      </Button>
    </HobbyRequestModal>
  );
}