// AthleteDashboard.tsx - Bloco de Imports e Funções de Estado

'use client'

import { useState, useEffect, useCallback } from 'react' // ADICIONADO: useCallback
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog' // ADICIONADO: Dialog
import { 
  User, 
  Trophy, 
  Target, 
  Calendar, 
  Settings, 
  LogOut,
  TrendingUp,
  Award,
  Users,
  Clock,
  X // ADICIONADO: Para fechar o modal
} from 'lucide-react'
import { AthleteProfile } from './AthleteProfile'
import { TournamentList } from '@/components/tournament/TournamentList'
import { CategoryRegistration } from '@/components/tournament/CategoryRegistration' // ADICIONAR
import { SupabaseTournaments, SupabaseTournament } from '@/lib/supabase-tournaments' // ADICIONAR
import type { StoredUser } from '@/lib/auth-storage'

interface AthleteDashboardProps {
  user: StoredUser
  onLogout: () => void
}

export function AthleteDashboard({ user, onLogout }: AthleteDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [tournamentToRegister, setTournamentToRegister] = useState<SupabaseTournament | null>(null) // NOVO: Estado para o modal

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const winRate = user.gamesPlayed ? Math.round((user.wins! / user.gamesPlayed) * 100) : 0
  
  // Handler para fechar o modal
  const handleCloseRegistration = () => {
      setTournamentToRegister(null)
  }

  // Handler NOVO: Busca os detalhes completos do torneio e abre o modal CategoryRegistration
   const handleOpenRegistration = useCallback(async (tournamentId: string) => {
      console.log(`🔵 Opening registration for: ${tournamentId}`);
      
      const tournament = await SupabaseTournaments.getTournamentById(tournamentId);

      if (tournament) {
          setTournamentToRegister(tournament); // <--- A chave é que aqui o estado é setado
      } else {
          alert("Não foi possível carregar os detalhes do torneio. Tente novamente.");
      }
  }, [])
// ... (Seu código de handlers, como handleOpenRegistration e handleCloseRegistration)

// <--- INSERIR O BLOCO DO MODAL AQUI! 
if (tournamentToRegister) {
    return (
        <Dialog 
  open={!!tournamentToRegister}
  onOpenChange={(open) => !open && handleCloseRegistration()}
>
  <DialogContent className="sm:max-w-xl">
    {/* Garante que o conteúdo só renderiza quando o torneio estiver carregado */}
    {tournamentToRegister && (
      <CategoryRegistration 
        tournament={tournamentToRegister} 
        onClose={handleCloseRegistration}
        athleteUser={user} // <<< ADICIONE ESTA LINHA
      />
    )}
  </DialogContent>
</Dialog>
    );
}
// FIM DA INSERÇÃO

// INÍCIO DO SEU RETURN PRINCIPAL
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
   <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src="" />
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
            <TabsTrigger value="matches">Partidas</TabsTrigger>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Rating Atual</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.currentRating}</div>
                  <p className="text-xs text-muted-foreground">
                    Pico: {user.peakRating}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Partidas Jogadas</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{user.gamesPlayed}</div>
                  <p className="text-xs text-muted-foreground">
                    Total de jogos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Vitória</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{winRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {user.wins}V / {user.losses}D
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Nível</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold capitalize">{user.playingLevel}</div>
                  <p className="text-xs text-muted-foreground">
                    Estilo: {user.playingStyle}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        renderMode="simple" // <--- ADICIONE ESTA LINHA
                    />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Atividade Recente
                  </CardTitle>
                  <CardDescription>
                    Suas últimas partidas e resultados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium">Vitória vs João Silva</p>
                        <p className="text-sm text-gray-500">3-1 (11-8, 9-11, 11-6, 11-4)</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">+15</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium">Derrota vs Maria Santos</p>
                        <p className="text-sm text-gray-500">1-3 (11-9, 8-11, 6-11, 9-11)</p>
                      </div>
                      <Badge variant="destructive">-12</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tournaments" className="space-y-6">
            <TournamentList 
              onCreateTournament={() => {}}
              showCreateButton={false}
              userType="athlete"
            />
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Partidas</CardTitle>
                <CardDescription>
                  Veja o histórico completo das suas partidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma partida registrada</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Suas partidas aparecerão aqui após serem jogadas
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <AthleteProfile user={user} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  </header> 
 </div> 
 )
}