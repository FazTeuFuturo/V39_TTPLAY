'use client'

import { useState, useEffect, useCallback } from 'react' // <--- ADICIONADO: useCallback
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trophy, Users, Calendar, Plus, Settings, 
  BarChart3, Target, Award, MapPin, Edit, Database,
  Shuffle, CheckCircle, AlertCircle, Clock, X, Trash2, Play, UserPlus, LogOut, Menu
} from 'lucide-react'
import { Tournament, TournamentStatus } from '@/lib/types'
import { TournamentCreation } from '@/components/tournament/TournamentCreation'
// REMOVIDO: import { TournamentList } from '@/components/tournament/TournamentList'
import { TournamentAdministration } from '@/components/tournament/TournamentAdministration'
import { RegistrationManager } from '@/components/tournament/RegistrationManager'
import { TestDataManager } from './TestDataManager'
import { ClubProfile } from './ClubProfile'
import { SupabaseUser } from '@/lib/supabase-auth'
import { SupabaseTournaments } from '@/lib/supabase-tournaments' // <--- ADICIONADO: Módulo de dados

interface ClubDashboardProps {
  user: SupabaseUser
  onUserUpdate: (user: SupabaseUser) => void
  onLogout?: () => void
}

export function ClubDashboard({ user, onUserUpdate, onLogout }: ClubDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showTournamentCreation, setShowTournamentCreation] = useState(false)
  const [showTournamentEdit, setShowTournamentEdit] = useState<Tournament | null>(null)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [showRegistrationManager, setShowRegistrationManager] = useState<Tournament | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true); // <--- ADICIONADO: Estado de loading

  // ====================================================================
  // FUNÇÃO DE CARREGAMENTO DE DADOS (Agora busca no Supabase)
  // ====================================================================

  const loadTournaments = useCallback(async () => {
    setLoading(true);
    console.log('🔵 FETCHING TOURNAMENTS from DB for user:', user.id);
    try {
        // Chamada ao módulo Supabase (que retorna objetos Date)
        const fetchedTournaments = await SupabaseTournaments.getTournamentsByClub(user.id); 
        
        setTournaments(fetchedTournaments as Tournament[]); 
        
        // Removemos o localStorage de carga/salvamento para usar o DB como fonte
        localStorage.removeItem(`tournaments_${user.id}`); 
    } catch (error) {
        console.error('🔴 FAILED to load tournaments from DB:', error);
        setTournaments([]);
    } finally {
        setLoading(false);
    }
  }, [user.id]) // Dependência user.id

  // Ciclo de vida: Chama a função de busca na inicialização
  useEffect(() => {
    loadTournaments()
  }, [loadTournaments]) 

  // REMOÇÃO: O antigo useEffect que salvava dados no localStorage foi removido aqui.

  const handleTournamentCreated = (tournament: Tournament) => {
    console.log('🔵 TOURNAMENT CREATED/UPDATED:', tournament)
    
    // Após a criação/atualização no DB, recarregar a lista é o mais seguro
    loadTournaments() 
    
    // Fechar os modais/formulários
    setShowTournamentCreation(false)
    setShowTournamentEdit(null)
  }

  const handleEditTournament = (tournament: Tournament) => {
    console.log('🔵 EDIT TOURNAMENT CLICKED:', tournament.id)
    setShowTournamentEdit(tournament)
  }

  const handleAdministerTournament = (tournament: Tournament) => {
    console.log('🔵 ADMINISTER TOURNAMENT CLICKED:', tournament.id)
    setSelectedTournament(tournament)
  }

  const handleManageRegistrations = (tournament: Tournament) => {
    console.log('🔵 MANAGE REGISTRATIONS CLICKED:', tournament.id)
    setShowRegistrationManager(tournament)
  }

  const handleCloseRegistrations = async (tournament: Tournament) => { // <-- CORREÇÃO: TORNAR ASYNC
    console.log('🔵 CLOSING REGISTRATIONS:', tournament.id)
    
    const confirmed = window.confirm(
      `Tem certeza que deseja encerrar as inscrições do torneio "${tournament.name}"?\n\nApós encerrar, não será possível aceitar novos participantes.`
    )
    
    if (confirmed) {
      try {
            // 1. Tentar atualizar o status no Supabase (Necessita de await)
            // Use 'CLOSED' como string se TournamentStatus não for um enum.
            const success = await SupabaseTournaments.updateTournamentStatus(tournament.id, TournamentStatus.CLOSED)

            if (success) {
                // 2. Se o DB confirmar, atualizar o estado local (UI)
                const updatedTournament = { ...tournament, status: TournamentStatus.CLOSED }
                setTournaments(prev => prev.map(t => 
                  t.id === tournament.id ? updatedTournament : t
                ))
                console.log('🔵 REGISTRATIONS CLOSED FOR:', tournament.id)
                alert('Inscrições encerradas com sucesso!')
            } else {
                 // Lança um erro para cair no catch
                throw new Error('Falha ao atualizar o status no banco de dados.')
            }
        } catch (error) {
            console.error('🔴 FAILED to close registrations in DB:', error)
            alert('Falha ao encerrar inscrições. Tente novamente.')
        }
    }
}

  // ClubDashboard.tsx

// FUNÇÃO ATUALIZADA: Agora altera o status no Supabase (Iniciar Torneio)
  const handleStartTournament = async (tournament: Tournament) => { // Tornar async
    console.log('🔵 STARTING TOURNAMENT:', tournament.id)
    
    const confirmed = window.confirm(
      `Tem certeza que deseja iniciar o campeonato "${tournament.name}"?\n\nO torneio entrará em andamento e você poderá administrar as partidas.`
    )
    
    if (confirmed) {
      try {
        // 1. Atualizar o status no Supabase
        const success = await SupabaseTournaments.updateTournamentStatus(tournament.id, TournamentStatus.IN_PROGRESS)

        if (success) {
            // 2. Atualizar o estado local
            const updatedTournament = { ...tournament, status: TournamentStatus.IN_PROGRESS }
            setTournaments(prev => prev.map(t => 
              t.id === tournament.id ? updatedTournament : t
            ))
            setSelectedTournament(updatedTournament) // Leva para a tela de administração
            console.log('🔵 TOURNAMENT STARTED AND UPDATED IN DB:', tournament.id)
        } else {
             alert('Falha ao iniciar torneio no banco de dados.')
        }
      } catch (error) {
        console.error('🔴 FAILED to start tournament in DB:', error)
        alert('Falha ao iniciar torneio no banco de dados.')
      }
    }
  }

// FUNÇÃO ATUALIZADA: Agora deleta no Supabase
  const handleRemoveTournament = async (tournament: Tournament) => { // <-- CORREÇÃO: TORNAR ASYNC
    console.log('🔴 REMOVE TOURNAMENT CLICKED:', tournament.id, tournament.name)
    
    const confirmed = window.confirm(
      `Tem certeza que deseja remover o torneio "${tournament.name}"?\n\nEsta ação não pode ser desfeita.`
    )
    
    if (confirmed) {
      try {
        // 1. Tentar deletar no Supabase (Precisa do await)
        const success = await SupabaseTournaments.deleteTournament(tournament.id)

        if (success) {
          // 2. Se for sucesso, remove do estado local
          setTournaments(prev => prev.filter(t => t.id !== tournament.id))
          alert('Torneio removido com sucesso!')
        } else {
            // Se a função do Supabase retornar false
            throw new Error('Falha ao deletar, verifique permissões.')
        }
      } catch (error) {
        console.error('🔴 ERROR REMOVING TOURNAMENT:', error)
        alert('Erro ao remover torneio. Tente novamente.')
      }
    }
  }

  const handleCloseAdmin = () => {
    setSelectedTournament(null)
  }

  const handleCloseRegistrationManager = () => {
    setShowRegistrationManager(null)
  }

  const handleLogout = () => {
    if (onLogout) {
      const confirmed = window.confirm('Deseja realmente sair?')
      if (confirmed) {
        onLogout()
      }
    }
  }

  const getStatusBadge = (status: TournamentStatus) => {
    const statusConfig = {
      [TournamentStatus.DRAFT]: { color: 'secondary', text: 'Rascunho', icon: Edit },
      [TournamentStatus.OPEN]: { color: 'default', text: 'Inscrições Abertas', icon: CheckCircle },
      [TournamentStatus.CLOSED]: { color: 'destructive', text: 'Inscrições Encerradas', icon: Clock },
      [TournamentStatus.IN_PROGRESS]: { color: 'default', text: 'Em Andamento', icon: Play },
      [TournamentStatus.FINISHED]: { color: 'secondary', text: 'Finalizado', icon: Trophy },
      [TournamentStatus.CANCELLED]: { color: 'destructive', text: 'Cancelado', icon: X }
    }
    
    const config = statusConfig[status]
    
    if (!config) {
      console.warn('Unknown tournament status:', status)
      return <Badge variant="secondary">Status Desconhecido</Badge>
    }
    
    const Icon = config.icon
    
    return (
      <Badge variant={config.color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    )
  }

  const canAdministerTournament = (tournament: Tournament) => {
    return tournament.status === TournamentStatus.IN_PROGRESS ||
           tournament.status === TournamentStatus.FINISHED
  }

  const canEditTournament = (tournament: Tournament) => {
    return tournament.status === TournamentStatus.DRAFT || 
           tournament.status === TournamentStatus.OPEN
  }

  const canDeleteTournament = (tournament: Tournament) => {
    return tournament.status !== TournamentStatus.IN_PROGRESS
  }

  const canCloseRegistrations = (tournament: Tournament) => {
    return tournament.status === TournamentStatus.OPEN
  }

  const canStartTournament = (tournament: Tournament) => {
    return tournament.status === TournamentStatus.CLOSED
  }

  const canManageRegistrations = (tournament: Tournament) => {
    return tournament.status === TournamentStatus.OPEN
  }

  const stats = {
    totalTournaments: tournaments.length,
    activeTournaments: tournaments.filter(t => 
      t.status === TournamentStatus.OPEN || t.status === TournamentStatus.IN_PROGRESS
    ).length,
    finishedTournaments: tournaments.filter(t => t.status === TournamentStatus.FINISHED).length,
    // CORREÇÃO: Usa o novo formato do Supabase (participants é um array, e queremos o length)
    totalParticipants: tournaments.reduce((sum, t) => sum + (t.players?.length || 0), 0) 
  }

    // NOVO BLOCO DE RENDERIZAÇÃO CONDICIONAL (Loading)
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
            </div>
        )
    }


  if (showRegistrationManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <RegistrationManager 
            tournament={showRegistrationManager}
            onClose={handleCloseRegistrationManager}
            onUpdate={(updatedTournament) => {
              setTournaments(prev => prev.map(t => 
                t.id === updatedTournament.id ? updatedTournament : t
              ))
            }}
          />
        </div>
      </div>
    )
  }

  if (selectedTournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={handleCloseAdmin}
              className="shadow-sm"
            >
              ← Voltar ao Dashboard
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">Administração do Torneio</h1>
          </div>
          
          <TournamentAdministration 
            tournament={selectedTournament!} 
            // CORREÇÃO: Usar um callback simples que retorna 'void'
            onUpdate={(updatedTournament) => { // <--- REMOVE O 'as any' AQUI

              setTournaments(prev => prev.map((t): Tournament => // <--- GARANTE QUE O MAP RETORNE O TIPO Tournament
                t.id === updatedTournament.id ? updatedTournament : t
              ));
              setSelectedTournament(updatedTournament);

              // O onUpdate do Dashboard não precisa retornar nada (void)
            }}
            onBack={handleCloseAdmin} // <--- ADICIONE ESTA PROP, POIS ELA É OBRIGATÓRIA (onBack)
          />
        </div>
      </div>
    )
  }

  if (showTournamentCreation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowTournamentCreation(false)}
              className="shadow-sm"
            >
              ← Voltar ao Dashboard
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">Criar Novo Torneio</h1>
          </div>
          
          <TournamentCreation 
            onTournamentCreated={handleTournamentCreated}
            createdBy={user.id}
          />
        </div>
      </div>
    )
  }

  if (showTournamentEdit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowTournamentEdit(null)}
              className="shadow-sm"
            >
              ← Voltar aos Torneios
            </Button>
            <h1 className="text-xl md:text-2xl font-bold">Editar Torneio</h1>
          </div>
          
          <TournamentCreation 
            onTournamentCreated={handleTournamentCreated}
            createdBy={user.id}
            editTournament={showTournamentEdit}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header com Logout */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard do Clube
              </h1>
              <p className="text-muted-foreground mt-1">Bem-vindo, {user.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setShowTournamentCreation(true)}
                className="flex-1 md:flex-none shadow-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Torneio
              </Button>
              {onLogout && (
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="shadow-sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Sair</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Total de Torneios</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">{stats.totalTournaments}</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Trophy className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Ativos</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">{stats.activeTournaments}</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Target className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Finalizados</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">{stats.finishedTournaments}</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Award className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs md:text-sm font-medium text-muted-foreground">Participantes</p>
                  <p className="text-2xl md:text-3xl font-bold mt-1">{stats.totalParticipants}</p>
                </div>
                <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="shadow-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="border-b">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto gap-2">
                <TabsTrigger value="overview" className="text-xs md:text-sm">
                  <BarChart3 className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Visão Geral</span>
                  <span className="sm:hidden">Geral</span>
                </TabsTrigger>
                <TabsTrigger value="tournaments" className="text-xs md:text-sm">
                  <Trophy className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Meus Torneios</span>
                  <span className="sm:hidden">Torneios</span>
                </TabsTrigger>
                <TabsTrigger value="test-data" className="text-xs md:text-sm">
                  <Database className="h-4 w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Gerar Atletas</span>
                  <span className="sm:hidden">Atletas</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="text-xs md:text-sm">
                  <Users className="h-4 w-4 mr-1 md:mr-2" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger value="settings" className="text-xs md:text-sm">
                  <Settings className="h-4 w-4 mr-1 md:mr-2" />
                  Config
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-4 md:p-6">
              <TabsContent value="overview" className="space-y-4 mt-0">
                {/* Recent Tournaments */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Torneios Recentes</CardTitle>
                    <CardDescription>
                      Seus torneios mais recentes e seu status atual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tournaments.slice(0, 3).map(tournament => (
                        <div key={tournament.id} className="flex flex-col lg:flex-row lg:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-slate-50 transition-colors gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm md:text-base truncate">{tournament.name}</h4>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground mt-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{new Date(tournament.startDate).toLocaleDateString('pt-BR')}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{tournament.location}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3 flex-shrink-0" />
                                <span>{tournament.maxParticipants} vagas</span>
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {getStatusBadge(tournament.status)}
                            
                            {canManageRegistrations(tournament) && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleManageRegistrations(tournament)}
                                className="text-xs"
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                <span className="hidden md:inline">Gerenciar</span>
                              </Button>
                            )}
                            
                            {canCloseRegistrations(tournament) && (
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => handleCloseRegistrations(tournament)}
                                className="text-xs"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                <span className="hidden md:inline">Encerrar</span>
                              </Button>
                            )}
                            
                            {canStartTournament(tournament) && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleStartTournament(tournament)}
                                className="text-xs"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Iniciar
                              </Button>
                            )}
                            
                            {canAdministerTournament(tournament) && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAdministerTournament(tournament)}
                                className="text-xs"
                              >
                                <Shuffle className="h-3 w-3 mr-1" />
                                Admin
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {tournaments.length === 0 && (
                        <div className="text-center py-12">
                          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                            <Trophy className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">Nenhum torneio criado</h3>
                          <p className="text-muted-foreground mb-4 text-sm">
                            Crie seu primeiro torneio para começar
                          </p>
                          <Button onClick={() => setShowTournamentCreation(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Primeiro Torneio
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button 
                        variant="outline" 
                        className="h-20 md:h-24 flex-col hover:bg-slate-50 hover:border-blue-300 transition-all"
                        onClick={() => setShowTournamentCreation(true)}
                      >
                        <Plus className="h-6 w-6 md:h-8 md:w-8 mb-2 text-blue-600" />
                        <span className="text-xs md:text-sm font-medium">Novo Torneio</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 md:h-24 flex-col hover:bg-slate-50 hover:border-purple-300 transition-all"
                        onClick={() => setActiveTab('test-data')}
                      >
                        <Database className="h-6 w-6 md:h-8 md:w-8 mb-2 text-purple-600" />
                        <span className="text-xs md:text-sm font-medium">Gerar Atletas</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 md:h-24 flex-col hover:bg-slate-50 hover:border-yellow-300 transition-all"
                        onClick={() => setActiveTab('tournaments')}
                      >
                        <Trophy className="h-6 w-6 md:h-8 md:w-8 mb-2 text-yellow-600" />
                        <span className="text-xs md:text-sm font-medium">Meus Torneios</span>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="h-20 md:h-24 flex-col hover:bg-slate-50 hover:border-green-300 transition-all"
                        onClick={() => setActiveTab('profile')}
                      >
                        <Settings className="h-6 w-6 md:h-8 md:w-8 mb-2 text-green-600" />
                        <span className="text-xs md:text-sm font-medium">Editar Perfil</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tournaments" className="space-y-4 mt-0">
                <div className="space-y-3">
                  {tournaments.map(tournament => (
                    <Card key={tournament.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-base md:text-lg">{tournament.name}</h4>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tournament.description}</p>
                            <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(tournament.startDate).toLocaleDateString('pt-BR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {tournament.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {tournament.maxParticipants} vagas
                              </span>
                              <span>R$ {tournament.registrationPrice?.toFixed(2)}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              {getStatusBadge(tournament.status)}
                              <Badge variant="outline">{tournament.categories?.length || 0} categorias</Badge>
                              <Badge variant="outline" className="text-xs">
                                Prazo: {new Date(tournament.registrationDeadline).toLocaleDateString('pt-BR')}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            {canEditTournament(tournament) && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditTournament(tournament)}
                                className="text-xs"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            )}
                            
                            {canManageRegistrations(tournament) && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleManageRegistrations(tournament)}
                                className="text-xs"
                              >
                                <UserPlus className="h-3 w-3 mr-1" />
                                <span className="hidden md:inline">Inscrições</span>
                              </Button>
                            )}
                            
                            {canCloseRegistrations(tournament) && (
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => handleCloseRegistrations(tournament)}
                                className="text-xs"
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Encerrar
                              </Button>
                            )}
                            
                            {canStartTournament(tournament) && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleStartTournament(tournament)}
                                className="text-xs"
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Iniciar
                              </Button>
                            )}
                            
                            {canAdministerTournament(tournament) && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleAdministerTournament(tournament)}
                                className="text-xs"
                              >
                                <Shuffle className="h-3 w-3 mr-1" />
                                Admin
                              </Button>
                            )}
                            
                            {canDeleteTournament(tournament) && (
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleRemoveTournament(tournament)}
                                className="text-xs"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                <span className="hidden md:inline">Remover</span>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {tournaments.length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                        <Trophy className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Nenhum torneio criado</h3>
                      <p className="text-muted-foreground mb-4 text-sm">
                        Crie seu primeiro torneio para começar
                      </p>
                      <Button onClick={() => setShowTournamentCreation(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Torneio
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="test-data" className="mt-0">
                <TestDataManager />
              </TabsContent>

              <TabsContent value="profile" className="mt-0">
                <ClubProfile 
                    user={user} 
                    onUpdate={onUserUpdate} // Corrigido para passar a função de atualização correta
                />
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle>Configurações do Clube</CardTitle>
                    <CardDescription>
                      Personalize as configurações da sua conta
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Configurações avançadas em desenvolvimento. Em breve você poderá personalizar notificações, preferências de torneios e muito mais.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="pt-4">
                        <h3 className="font-semibold mb-2">Informações da Conta</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Nome:</span>
                            <span className="font-medium">{user.name}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Email:</span>
                            <span className="font-medium">{user.email}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b">
                            <span className="text-muted-foreground">Tipo de Conta:</span>
                            <Badge>Clube</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}