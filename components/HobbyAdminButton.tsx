"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function HobbyAdminButton() {
  return (
    <Link href="/admin/hobbies">
      <Button variant="outline" size="sm">
        <Badge variant="secondary">Admin</Badge> Hobbies
      </Button>
    </Link>
  );
}