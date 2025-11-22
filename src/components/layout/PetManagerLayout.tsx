import { SidebarProvider } from "@/components/ui/sidebar";
import { PetManagerSidebar } from "./PetManagerSidebar";
import { PetManagerHeader } from "./PetManagerHeader";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

interface PetManagerLayoutProps {
  children: React.ReactNode;
}

export function PetManagerLayout({ children }: PetManagerLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-pet-background">
        <PetManagerSidebar />
        <div className="flex-1 flex flex-col">
          <PetManagerHeader />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}