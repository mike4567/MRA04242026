
import Link from 'next/link';
import { EntanglementLogo } from './EntanglementLogo';
import { Button } from './ui/button';
import { List, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header({className} : {className?: string}) {
  return (
    <header className={cn("border-b bg-card", className)}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/">
          <EntanglementLogo />
        </Link>
        <nav className="flex items-center gap-2">
            <Button asChild variant="ghost">
                <Link href="/incidents">
                    <List className="mr-2 h-4 w-4" />
                    View Incidents
                </Link>
            </Button>
             <Button asChild>
                <Link href="/report">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Report an Incident
                </Link>
            </Button>
        </nav>
      </div>
    </header>
  );
}
