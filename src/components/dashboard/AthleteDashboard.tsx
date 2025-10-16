// src/components/dashboard/AthleteDashboard.tsx

'use client'


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card' // <<< ADICIONE ESTA LINHA
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { LogOut, Calendar } from 'lucide-react'

// Nossos novos componentes modulares
import { AthleteProfile } from './AthleteProfile'
import { AthleteStatsGrid } from './AthleteStatsGrid'
import { RecentActivity } from './RecentActivity'

// Componentes relacionados a torneios
import { TournamentList } from '@/components/tournament/TournamentList'
import { CategoryRegistration } from '@/components/tournament/CategoryRegistration'
import { SupabaseTournaments, SupabaseTournament, SupabaseTournamentRegistration } from '@/lib/supabase-tournaments'
import { SupabaseAuth } from '@/lib/supabase-auth'
import type { StoredUser } from '@/lib/auth-storage'

interface AthleteDashboardProps {
  user: StoredUser
  onLogout: () => void
}

export function AthleteDashboard({ user, onLogout }: AthleteDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [tournamentToRegister, setTournamentToRegister] = useState<SupabaseTournament | null>(null)
  const [userRegistrations, setUserRegistrations] = useState<SupabaseTournamentRegistration[]>([])
  useEffect(() => {
    if (user) {
      SupabaseTournaments.getAthleteRegistrations(user.id).then(regs => {
        setUserRegistrations(regs);
      });
    }
  }, [user]);

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const loadUserRegistrations = useCallback(async () => {
    if (user) {
        const regs = await SupabaseTournaments.getAthleteRegistrations(user.id);
        setUserRegistrations(regs);
    }
  }, [user]);

  useEffect(() => {
    loadUserRegistrations();
  }, [loadUserRegistrations]);

  const handleOpenRegistration = useCallback(async (tournamentId: string) => {
    const tournament = await SupabaseTournaments.getTournamentById(tournamentId);
    if (tournament) {
      setTournamentToRegister(tournament);
    } else {
      alert("Não foi possível carregar os detalhes do torneio.");
    }
  }, []);

  const handleCloseRegistration = () => {
    setTournamentToRegister(null);
    // Recarrega as inscrições para atualizar o status do botão "Inscrito"
    loadUserRegistrations(); 
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de Inscrição */}
      <Dialog open={!!tournamentToRegister} onOpenChange={(open) => !open && handleCloseRegistration()}>
          <DialogContent className="sm:max-w-xl">
            {tournamentToRegister && (
              <CategoryRegistration 
                tournament={tournamentToRegister} 
                onClose={handleCloseRegistration}
                athleteUser={user}
              />
            )}
          </DialogContent>
      </Dialog>
    
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Olá, {user.name.split(' ')[0]}!
                </h1>
                <p className="text-sm text-gray-500">Atleta de Tênis de Mesa</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Rating: {user.currentRating}
              </Badge>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="tournaments">Torneios</TabsTrigger>
            <TabsTrigger value="matches">Minhas Partidas</TabsTrigger>
            <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
          </TabsList>

         {/* Aba Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <AthleteStatsGrid user={user} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card para os Torneios */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximos Torneios
                  </CardTitle>
                  <CardDescription>
                    Torneios disponíveis para inscrição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TournamentList 
                    onCreateTournament={() => {}} 
                    showCreateButton={false}
                    userType="athlete"
                    onRegister={handleOpenRegistration} 
                    renderMode="simple"
                    userRegistrations={userRegistrations}
                  />
                </CardContent>
              </Card>
              {/* Card para Atividade Recente */}
              <RecentActivity />
            </div>
          </TabsContent>

          {/* Aba Torneios */}
          <TabsContent value="tournaments" className="space-y-6">
            <TournamentList 
              onCreateTournament={() => {}}
              showCreateButton={false}
              userType="athlete"
              onRegister={handleOpenRegistration}
              userRegistrations={userRegistrations}
            />
          </TabsContent>

          {/* Aba Partidas */}
          <TabsContent value="matches" className="space-y-6">
            {/* Aqui entrará o futuro componente de histórico de partidas */}
            <Card><CardContent className="p-8 text-center text-muted-foreground">Histórico de partidas em desenvolvimento.</CardContent></Card>
          </TabsContent>

          {/* Aba Perfil */}
          <TabsContent value="profile" className="space-y-6">
            <AthleteProfile user={user} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}