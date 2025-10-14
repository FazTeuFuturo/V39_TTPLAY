'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trophy, Users, Calendar, Plus, Settings, 
  BarChart3, Target, Award, MapPin, Edit, Database,
  Shuffle, CheckCircle, AlertCircle, Clock, X, Trash2, Play, UserPlus
} from 'lucide-react'
import { Tournament, TournamentStatus } from '@/lib/types'
import { TournamentCreation } from '@/components/tournament/TournamentCreation'
import { TournamentList } from '@/components/tournament/TournamentList'
import { TournamentAdministration } from '@/components/tournament/TournamentAdministration'
import { RegistrationManager } from '@/components/tournament/RegistrationManager'
import { TestDataManager } from './TestDataManager'
import { ClubProfile } from './ClubProfile'
import { SupabaseUser } from '@/lib/supabase-auth'

interface ClubDashboardProps {
  user: SupabaseUser
  onUserUpdate: (user: SupabaseUser) => void
}

export function ClubDashboard({ user, onUserUpdate }: ClubDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showTournamentCreation, setShowTournamentCreation] = useState(false)
  const [showTournamentEdit, setShowTournamentEdit] = useState<Tournament | null>(null)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [showRegistrationManager, setShowRegistrationManager] = useState<Tournament | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  // REMOVED: Mock data - no longer loading mock tournaments automatically
  useEffect(() => {
    console.log('🔵 DASHBOARD LOADED FOR USER:', user.id)
    // Load tournaments from localStorage or Supabase here in the future
    const savedTournaments = localStorage.getItem(`tournaments_${user.id}`)
    if (savedTournaments) {
      try {
        const parsed = JSON.parse(savedTournaments)
        setTournaments(parsed.map((t: any) => ({
          ...t,
          startDate: new Date(t.startDate),
          endDate: new Date(t.endDate),
          registrationDeadline: new Date(t.registrationDeadline)
        })))
      } catch (error) {
        console.error('Error loading saved tournaments:', error)
        setTournaments([])
      }
    }
  }, [user.id])

  // Save tournaments to localStorage whenever tournaments change
  useEffect(() => {
    if (tournaments.length > 0) {
      localStorage.setItem(`tournaments_${user.id}`, JSON.stringify(tournaments))
    }
  }, [tournaments, user.id])

  const handleTournamentCreated = (tournament: Tournament) => {
    console.log('🔵 TOURNAMENT CREATED/UPDATED:', tournament)
    if (showTournamentEdit) {
      // Update existing tournament
      setTournaments(prev => prev.map(t => 
        t.id === tournament.id ? tournament : t
      ))
      setShowTournamentEdit(null)
    } else {
      // Add new tournament
      setTournaments(prev => [...prev, tournament])
      setShowTournamentCreation(false)
    }
  }

  const handleEditTournament = (tournament: Tournament) => {
    console.log('🔵 EDIT TOURNAMENT CLICKED:', tournament.id)
    setShowTournamentEdit(tournament)
  }

  const handleAdministerTournament = (tournament: Tournament) => {
    console.log('🔵 ADMINISTER TOURNAMENT CLICKED:', tournament.id)
    setSelectedTournament(tournament)
  }

  // ADDED: Manage registrations function
  const handleManageRegistrations = (tournament: Tournament) => {
    console.log('🔵 MANAGE REGISTRATIONS CLICKED:', tournament.id)
    setShowRegistrationManager(tournament)
  }

  // ADDED: Close registrations function
  const handleCloseRegistrations = (tournament: Tournament) => {
    console.log('🔵 CLOSING REGISTRATIONS:', tournament.id)
    
    const confirmed = window.confirm(
      `Tem certeza que deseja encerrar as inscrições do torneio "${tournament.name}"?\n\nApós encerrar, não será possível aceitar novos participantes.`
    )
    
    if (confirmed) {
      const updatedTournament = {
        ...tournament,
        status: TournamentStatus.CLOSED
      }
      
      setTournaments(prev => prev.map(t => 
        t.id === tournament.id ? updatedTournament : t
      ))
      
      console.log('🔵 REGISTRATIONS CLOSED FOR:', tournament.id)
    }
  }

  // ADDED: Start tournament function
  const handleStartTournament = (tournament: Tournament) => {
    console.log('🔵 STARTING TOURNAMENT:', tournament.id)
    
    const confirmed = window.confirm(
      `Tem certeza que deseja iniciar o campeonato "${tournament.name}"?\n\nO torneio entrará em andamento e você poderá administrar as partidas.`
    )
    
    if (confirmed) {
      const updatedTournament = {
        ...tournament,
        status: TournamentStatus.IN_PROGRESS
      }
      
      setTournaments(prev => prev.map(t => 
        t.id === tournament.id ? updatedTournament : t
      ))
      
      console.log('🔵 TOURNAMENT STARTED:', tournament.id)
      
      // Automatically go to administration
      setSelectedTournament(updatedTournament)
    }
  }

  const handleRemoveTournament = (tournament: Tournament) => {
    console.log('🔴 REMOVE TOURNAMENT CLICKED:', tournament.id, tournament.name)
    
    const confirmed = window.confirm(
      `Tem certeza que deseja remover o torneio "${tournament.name}"?\n\nEsta ação não pode ser desfeita.`
    )
    
    if (confirmed) {
      console.log('🔴 REMOVAL CONFIRMED - REMOVING TOURNAMENT:', tournament.id)
      
      try {
        setTournaments(prev => {
          const updated = prev.filter(t => t.id !== tournament.id)
          console.log('🔴 TOURNAMENTS AFTER REMOVAL:', updated.length)
          return updated
        })
        
        // Also remove from localStorage
        const remaining = tournaments.filter(t => t.id !== tournament.id)
        if (remaining.length > 0) {
          localStorage.setItem(`tournaments_${user.id}`, JSON.stringify(remaining))
        } else {
          localStorage.removeItem(`tournaments_${user.id}`)
        }
        
        console.log('🔴 TOURNAMENT SUCCESSFULLY REMOVED')
        alert('Torneio removido com sucesso!')
        
      } catch (error) {
        console.error('🔴 ERROR REMOVING TOURNAMENT:', error)
        alert('Erro ao remover torneio. Tente novamente.')
      }
    } else {
      console.log('🔴 REMOVAL CANCELLED BY USER')
    }
  }

  const handleCloseAdmin = () => {
    setSelectedTournament(null)
  }

  const handleCloseRegistrationManager = () => {
    setShowRegistrationManager(null)
  }

  const getStatusBadge = (status: TournamentStatus) => {
    const statusConfig = {
      [TournamentStatus.DRAFT]: { color: 'secondary', text: 'Rascunho' },
      [TournamentStatus.OPEN]: { color: 'default', text: 'Inscrições Abertas' },
      [TournamentStatus.CLOSED]: { color: 'destructive', text: 'Inscrições Encerradas' },
      [TournamentStatus.IN_PROGRESS]: { color: 'default', text: 'Em Andamento' },
      [TournamentStatus.FINISHED]: { color: 'secondary', text: 'Finalizado' },
      [TournamentStatus.CANCELLED]: { color: 'destructive', text: 'Cancelado' }
    }
    
    const config = statusConfig[status]
    
    if (!config) {
      console.warn('Unknown tournament status:', status)
      return <Badge variant="secondary">Status Desconhecido</Badge>
    }
    
    return <Badge variant={config.color as any}>{config.text}</Badge>
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
    totalParticipants: tournaments.reduce((sum, t) => sum + (t.maxParticipants || 0), 0)
  }

  // Show Registration Manager
  if (showRegistrationManager) {
    return (
      <div className="space-y-6">
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
    )
  }

  // Show Tournament Administration
  if (selectedTournament) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={handleCloseAdmin}
          >
            ← Voltar ao Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Administração do Torneio</h1>
        </div>
        
        <TournamentAdministration 
          tournament={selectedTournament}
          onUpdate={(updatedTournament) => {
            setTournaments(prev => prev.map(t => 
              t.id === updatedTournament.id ? updatedTournament : t
            ))
            setSelectedTournament(updatedTournament)
          }}
        />
      </div>
    )
  }

  // Show Tournament Creation
  if (showTournamentCreation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setShowTournamentCreation(false)}
          >
            ← Voltar ao Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Criar Novo Torneio</h1>
        </div>
        
        <TournamentCreation 
          onTournamentCreated={handleTournamentCreated}
          createdBy={user.id}
        />
      </div>
    )
  }

  // Show Tournament Edit
  if (showTournamentEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setShowTournamentEdit(null)}
          >
            ← Voltar aos Torneios
          </Button>
          <h1 className="text-2xl font-bold">Editar Torneio</h1>
        </div>
        
        <TournamentCreation 
          onTournamentCreated={handleTournamentCreated}
          createdBy={user.id}
          editTournament={showTournamentEdit}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard do Clube</h1>
          <p className="text-muted-foreground">Bem-vindo, {user.name}</p>
        </div>
        <Button onClick={() => setShowTournamentCreation(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Torneio
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Total de Torneios</p>
                <p className="text-2xl font-bold">{stats.totalTournaments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Ativos</p>
                <p className="text-2xl font-bold">{stats.activeTournaments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Finalizados</p>
                <p className="text-2xl font-bold">{stats.finishedTournaments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Participantes</p>
                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tournaments">Meus Torneios</TabsTrigger>
          <TabsTrigger value="test-data">Gerar Atletas</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Tournaments */}
          <Card>
            <CardHeader>
              <CardTitle>Torneios Recentes</CardTitle>
              <CardDescription>
                Seus torneios mais recentes e seu status atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tournaments.slice(0, 3).map(tournament => (
                  <div key={tournament.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <h4 className="font-medium">{tournament.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(tournament.startDate).toLocaleDateString('pt-BR')}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{tournament.location}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{tournament.maxParticipants} vagas</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>Prazo: {new Date(tournament.registrationDeadline).toLocaleDateString('pt-BR')}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(tournament.status)}
                      
                      {/* ADDED: Manage Registrations Button */}
                      {canManageRegistrations(tournament) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleManageRegistrations(tournament)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Gerenciar Inscrições
                        </Button>
                      )}
                      
                      {/* ADDED: Close Registrations Button */}
                      {canCloseRegistrations(tournament) && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleCloseRegistrations(tournament)}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Encerrar Inscrições
                        </Button>
                      )}
                      
                      {/* ADDED: Start Tournament Button */}
                      {canStartTournament(tournament) && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleStartTournament(tournament)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Iniciar Campeonato
                        </Button>
                      )}
                      
                      {/* Administer Button */}
                      {canAdministerTournament(tournament) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleAdministerTournament(tournament)}
                        >
                          <Shuffle className="h-4 w-4 mr-1" />
                          Administrar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {tournaments.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum torneio criado</h3>
                    <p className="text-muted-foreground mb-4">
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
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => setShowTournamentCreation(true)}
                >
                  <Plus className="h-6 w-6 mb-2" />
                  Novo Torneio
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => setActiveTab('test-data')}
                >
                  <Database className="h-6 w-6 mb-2" />
                  Gerar Atletas
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => setActiveTab('tournaments')}
                >
                  <Trophy className="h-6 w-6 mb-2" />
                  Meus Torneios
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col"
                  onClick={() => setActiveTab('profile')}
                >
                  <Settings className="h-6 w-6 mb-2" />
                  Editar Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournaments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Meus Torneios</CardTitle>
              <CardDescription>
                Gerencie todos os seus torneios criados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tournaments.map(tournament => (
                  <div key={tournament.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{tournament.name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{tournament.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(tournament.startDate).toLocaleDateString('pt-BR')}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{tournament.location}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Users className="h-3 w-3" />
                          <span>{tournament.maxParticipants} vagas</span>
                        </span>
                        <span>R$ {tournament.registrationPrice?.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        {getStatusBadge(tournament.status)}
                        <Badge variant="outline">{tournament.categories?.length || 0} categorias</Badge>
                        <Badge variant="outline" className="text-xs">
                          Prazo: {new Date(tournament.registrationDeadline).toLocaleDateString('pt-BR')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Edit Button */}
                      {canEditTournament(tournament) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditTournament(tournament)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      
                      {/* Manage Registrations Button */}
                      {canManageRegistrations(tournament) && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleManageRegistrations(tournament)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Gerenciar Inscrições
                        </Button>
                      )}
                      
                      {/* Close Registrations Button */}
                      {canCloseRegistrations(tournament) && (
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => handleCloseRegistrations(tournament)}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Encerrar Inscrições
                        </Button>
                      )}
                      
                      {/* Start Tournament Button */}
                      {canStartTournament(tournament) && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleStartTournament(tournament)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Iniciar Campeonato
                        </Button>
                      )}
                      
                      {/* Administer Button */}
                      {canAdministerTournament(tournament) && (
                        <Button 
                          size="sm" 
                          variant="default"
                          onClick={() => handleAdministerTournament(tournament)}
                        >
                          <Shuffle className="h-4 w-4 mr-1" />
                          Administrar
                        </Button>
                      )}
                      
                      {/* Remove Button */}
                      {canDeleteTournament(tournament) && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleRemoveTournament(tournament)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {tournaments.length === 0 && (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum torneio criado</h3>
                    <p className="text-muted-foreground mb-4">
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
        </TabsContent>

        <TabsContent value="test-data">
          <TestDataManager />
        </TabsContent>

        <TabsContent value="profile">
          <ClubProfile user={user} onUpdate={onUserUpdate} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Clube</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configurações avançadas em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}