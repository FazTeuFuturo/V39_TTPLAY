'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Trophy, Users, Calendar, MapPin, Settings, 
  UserPlus, Play, Shuffle, ArrowLeft, CheckCircle,
  Clock, Target, Award, AlertCircle, Edit, Crown
} from 'lucide-react'
import { Tournament } from '@/lib/types'
import { RegistrationManager } from './RegistrationManager'
import { GroupCustomization } from './GroupCustomization'
import { MatchManager } from './MatchManager'
import { BracketManager } from './BracketManager'
import { loadMatches } from '@/lib/match-system'
import { loadBrackets } from '@/lib/bracket-system'

interface TournamentAdministrationProps {
  tournament: Tournament
  onBack: () => void
  onUpdate: (tournament: Tournament) => void
}

interface Registration {
  id: string
  athleteId: string
  athleteName: string
  athleteRating: number
  athleteLevel: string
  athleteCity: string
  category: string
  registeredAt: Date
}

interface TournamentStatus {
  registrationStatus: 'open' | 'closed'
  groupsGenerated: boolean
  bracketGenerated: boolean
  tournamentStarted: boolean
}

interface TournamentGroup {
  id: string
  name: string
  category: string
  athletes: Registration[]
}

export function TournamentAdministration({ tournament, onBack, onUpdate }: TournamentAdministrationProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [showRegistrationManager, setShowRegistrationManager] = useState(false)
  const [showGroupCustomization, setShowGroupCustomization] = useState(false)
  const [showMatchManager, setShowMatchManager] = useState(false)
  const [showBracketManager, setShowBracketManager] = useState(false)
  const [registeredAthletes, setRegisteredAthletes] = useState<Registration[]>([])
  const [groups, setGroups] = useState<TournamentGroup[]>([])
  const [tournamentStatus, setTournamentStatus] = useState<TournamentStatus>({
    registrationStatus: 'open',
    groupsGenerated: false,
    bracketGenerated: false,
    tournamentStarted: false
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Load tournament data and registrations on mount
  useEffect(() => {
    loadTournamentRegistrations()
    loadTournamentStatus()
    loadTournamentGroups()
  }, [tournament.id])

  const loadTournamentRegistrations = () => {
    try {
      const savedRegistrations = localStorage.getItem(`registrations_${tournament.id}`)
      if (savedRegistrations) {
        const registrations = JSON.parse(savedRegistrations)
        const parsedRegistrations = Array.isArray(registrations) ? registrations.map((reg: any) => ({
          ...reg,
          registeredAt: new Date(reg.registeredAt)
        })) : []
        setRegisteredAthletes(parsedRegistrations)
        console.log('🔵 LOADED TOURNAMENT REGISTRATIONS:', parsedRegistrations.length)
      }
    } catch (error) {
      console.error('🔴 ERROR LOADING REGISTRATIONS:', error)
      setRegisteredAthletes([])
    }
  }

  const loadTournamentStatus = () => {
    try {
      const savedStatus = localStorage.getItem(`tournament_status_${tournament.id}`)
      if (savedStatus) {
        const status = JSON.parse(savedStatus)
        setTournamentStatus(status)
        console.log('🔵 LOADED TOURNAMENT STATUS:', status)
      }
    } catch (error) {
      console.error('🔴 ERROR LOADING TOURNAMENT STATUS:', error)
    }
  }

  const loadTournamentGroups = () => {
    try {
      const savedGroups = localStorage.getItem(`tournament_groups_${tournament.id}`)
      if (savedGroups) {
        const groups = JSON.parse(savedGroups)
        const parsedGroups = Array.isArray(groups) ? groups : []
        setGroups(parsedGroups)
        console.log('🔵 LOADED TOURNAMENT GROUPS:', parsedGroups.length)
      }
    } catch (error) {
      console.error('🔴 ERROR LOADING GROUPS:', error)
      setGroups([])
    }
  }

  const saveTournamentStatus = (newStatus: TournamentStatus) => {
    try {
      localStorage.setItem(`tournament_status_${tournament.id}`, JSON.stringify(newStatus))
      setTournamentStatus(newStatus)
      console.log('🔵 SAVED TOURNAMENT STATUS:', newStatus)
    } catch (error) {
      console.error('🔴 ERROR SAVING TOURNAMENT STATUS:', error)
    }
  }

  const handleCloseRegistrations = () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja encerrar as inscrições?\n\nApós encerrar, não será possível adicionar novos atletas.'
    )
    
    if (confirmed) {
      const newStatus = {
        ...tournamentStatus,
        registrationStatus: 'closed' as const
      }
      saveTournamentStatus(newStatus)
      setMessage('Inscrições encerradas com sucesso!')
    }
  }

  const handleReopenRegistrations = () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja reabrir as inscrições?\n\nIsto permitirá adicionar novos atletas.'
    )
    
    if (confirmed) {
      const newStatus = {
        ...tournamentStatus,
        registrationStatus: 'open' as const
      }
      saveTournamentStatus(newStatus)
      setMessage('Inscrições reabertas com sucesso!')
    }
  }

  const handleQuickGenerateGroups = () => {
    if (!Array.isArray(registeredAthletes) || registeredAthletes.length === 0) {
      setError('Não há atletas inscritos para gerar grupos.')
      return
    }

    const confirmed = window.confirm(
      `Gerar grupos automaticamente com ${registeredAthletes.length} atletas inscritos?\n\nEsta ação criará grupos de 4 atletas cada.`
    )
    
    if (confirmed) {
      // Quick generation with 4 athletes per group
      try {
        const athletesByCategory = registeredAthletes.reduce((acc, athlete) => {
          if (!acc[athlete.category]) {
            acc[athlete.category] = []
          }
          acc[athlete.category].push(athlete)
          return acc
        }, {} as Record<string, Registration[]>)

        const newGroups: TournamentGroup[] = []
        const athletesPerGroup = 4

        Object.entries(athletesByCategory).forEach(([category, athletes]) => {
          const shuffledAthletes = [...athletes].sort(() => Math.random() - 0.5)
          const numberOfGroups = Math.ceil(shuffledAthletes.length / athletesPerGroup)
          
          for (let i = 0; i < numberOfGroups; i++) {
            const startIndex = i * athletesPerGroup
            const endIndex = Math.min(startIndex + athletesPerGroup, shuffledAthletes.length)
            const groupAthletes = shuffledAthletes.slice(startIndex, endIndex)
            
            if (groupAthletes.length > 0) {
              newGroups.push({
                id: `group_${category}_${i + 1}`,
                name: `${category} - Grupo ${String.fromCharCode(65 + i)}`,
                category,
                athletes: groupAthletes
              })
            }
          }
        })

        setGroups(newGroups)
        localStorage.setItem(`tournament_groups_${tournament.id}`, JSON.stringify(newGroups))

        const newStatus = {
          ...tournamentStatus,
          groupsGenerated: true
        }
        saveTournamentStatus(newStatus)
        setMessage(`${newGroups.length} grupos gerados com sucesso!`)
      } catch (err) {
        setError('Erro ao gerar grupos. Tente novamente.')
      }
    }
  }

  const handleStartTournament = () => {
    if (!tournamentStatus.groupsGenerated) {
      setError('Gere os grupos antes de iniciar o torneio.')
      return
    }

    const confirmed = window.confirm(
      'Iniciar o torneio?\n\nEsta ação dará início às partidas.'
    )
    
    if (confirmed) {
      const newStatus = {
        ...tournamentStatus,
        tournamentStarted: true
      }
      saveTournamentStatus(newStatus)
      setMessage('Torneio iniciado com sucesso!')
    }
  }

  const handleRegistrationManagerClose = () => {
    setShowRegistrationManager(false)
    loadTournamentRegistrations()
    loadTournamentStatus()
  }

  const handleGroupCustomizationClose = () => {
    setShowGroupCustomization(false)
    loadTournamentGroups()
    loadTournamentStatus()
  }

  const handleMatchManagerClose = () => {
    setShowMatchManager(false)
    loadTournamentStatus()
  }

  const handleBracketManagerClose = () => {
    setShowBracketManager(false)
    loadTournamentStatus()
  }

  const handleGroupsSaved = (newGroups: TournamentGroup[]) => {
    setGroups(Array.isArray(newGroups) ? newGroups : [])
    setShowGroupCustomization(false)
    setMessage('Grupos personalizados salvos com sucesso!')
  }

  // Group registrations by category - ensure registeredAthletes is an array
  const registrationsByCategory = Array.isArray(registeredAthletes) 
    ? registeredAthletes.reduce((acc, reg) => {
        if (!acc[reg.category]) {
          acc[reg.category] = []
        }
        acc[reg.category].push(reg)
        return acc
      }, {} as Record<string, Registration[]>)
    : {}

  // Get match statistics - ensure arrays exist
  const matches = loadMatches(tournament.id) || []
  const totalMatches = Array.isArray(matches) ? matches.length : 0
  const completedMatches = Array.isArray(matches) ? matches.filter(m => m.status === 'completed').length : 0

  // Get bracket statistics - ensure arrays exist
  const brackets = loadBrackets(tournament.id) || []
  const totalBracketMatches = Array.isArray(brackets) 
    ? brackets.reduce((sum, b) => sum + (Array.isArray(b.matches) ? b.matches.length : 0), 0)
    : 0
  const completedBracketMatches = Array.isArray(brackets)
    ? brackets.reduce((sum, b) => sum + (Array.isArray(b.matches) ? b.matches.filter(m => m.status === 'completed').length : 0), 0)
    : 0
  const champions = Array.isArray(brackets) ? brackets.filter(b => b.champion).length : 0

  // Safe date formatting function
  const formatDate = (date: any): string => {
    if (!date) return 'Data não definida'
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      if (isNaN(dateObj.getTime())) return 'Data inválida'
      return dateObj.toLocaleDateString('pt-BR')
    } catch {
      return 'Data inválida'
    }
  }

  if (showRegistrationManager) {
    return (
      <RegistrationManager
        tournament={tournament}
        onClose={handleRegistrationManagerClose}
        onUpdate={onUpdate}
      />
    )
  }

  if (showGroupCustomization) {
    return (
      <GroupCustomization
        tournament={tournament}
        onBack={handleGroupCustomizationClose}
        onSave={handleGroupsSaved}
      />
    )
  }

  if (showMatchManager) {
    return (
      <MatchManager
        tournament={tournament}
        groups={groups}
        onBack={handleMatchManagerClose}
      />
    )
  }

  if (showBracketManager) {
    return (
      <BracketManager
        tournament={tournament}
        groups={groups}
        onBack={handleBracketManagerClose}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              {tournament.name}
            </h1>
            <p className="text-muted-foreground">
              Administração do Torneio • {Array.isArray(registeredAthletes) ? registeredAthletes.length : 0} atletas inscritos
            </p>
          </div>
        </div>
        <Badge variant={tournamentStatus.registrationStatus === 'open' ? 'default' : 'secondary'}>
          {tournamentStatus.registrationStatus === 'open' ? 'Inscrições Abertas' : 'Inscrições Encerradas'}
        </Badge>
      </div>

      {/* Messages */}
      {message && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tournament Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Torneio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Data</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(tournament.date)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Local</p>
                <p className="text-sm text-muted-foreground">{tournament.location || 'Local não definido'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Vagas</p>
                <p className="text-sm text-muted-foreground">
                  {Array.isArray(registeredAthletes) ? registeredAthletes.length : 0} de {tournament.maxParticipants || 0}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Categorias</p>
                <p className="text-sm text-muted-foreground">
                  {Array.isArray(tournament.categories) ? tournament.categories.length : 0} categorias
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('overview')}
          className="flex-1"
        >
          Visão Geral
        </Button>
        <Button
          variant={activeTab === 'registrations' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('registrations')}
          className="flex-1"
        >
          Inscrições
        </Button>
        <Button
          variant={activeTab === 'groups' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('groups')}
          className="flex-1"
        >
          Grupos
        </Button>
        <Button
          variant={activeTab === 'matches' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('matches')}
          className="flex-1"
        >
          Partidas
        </Button>
        <Button
          variant={activeTab === 'eliminations' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('eliminations')}
          className="flex-1"
        >
          Eliminatórias
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Status das Inscrições */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <UserPlus className="h-5 w-5 text-blue-500" />
                <h3 className="font-medium">Inscrições</h3>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {Array.isArray(registeredAthletes) ? registeredAthletes.length : 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {tournamentStatus.registrationStatus === 'open' ? 'Abertas' : 'Encerradas'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Grupos Criados */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="h-5 w-5 text-green-500" />
                <h3 className="font-medium">Grupos</h3>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {Array.isArray(groups) ? groups.length : 0}
                </p>
                <p className="text-sm text-muted-foreground">
                  {Array.isArray(groups) && groups.length > 0 ? 'grupos criados' : 'Nenhum grupo'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Partidas */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Play className="h-5 w-5 text-orange-500" />
                <h3 className="font-medium">Partidas</h3>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {completedMatches}/{totalMatches}
                </p>
                <p className="text-sm text-muted-foreground">
                  {totalMatches > 0 ? 'finalizadas' : 'Nenhuma partida'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Eliminatórias */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="h-5 w-5 text-purple-500" />
                <h3 className="font-medium">Eliminatórias</h3>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {completedBracketMatches}/{totalBracketMatches}
                </p>
                <p className="text-sm text-muted-foreground">
                  {totalBracketMatches > 0 ? 'finalizadas' : 'Não iniciadas'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Campeões */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Crown className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium">Campeões</h3>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {champions}
                </p>
                <p className="text-sm text-muted-foreground">
                  {champions > 0 ? 'categorias definidas' : 'Nenhum campeão'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'registrations' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inscrições por Categoria</CardTitle>
              <CardDescription>
                {Array.isArray(registeredAthletes) ? registeredAthletes.length : 0} atletas inscritos em {Object.keys(registrationsByCategory).length} categorias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(registrationsByCategory).length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma inscrição</h3>
                  <p className="text-muted-foreground mb-4">
                    Ainda não há atletas inscritos neste torneio.
                  </p>
                  {tournamentStatus.registrationStatus === 'open' && (
                    <Button onClick={() => setShowRegistrationManager(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Gerenciar Inscrições
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(registrationsByCategory).map(([category, athletes]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{category}</h4>
                        <Badge variant="outline">{Array.isArray(athletes) ? athletes.length : 0} inscritos</Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Array.isArray(athletes) && athletes.map(athlete => (
                          <div key={athlete.id} className="text-sm p-2 border rounded">
                            <div className="font-medium">{athlete.athleteName}</div>
                            <div className="text-muted-foreground">
                              Rating: {athlete.athleteRating} • {athlete.athleteCity}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Grupos</CardTitle>
              <CardDescription>
                Organize os atletas em grupos para as eliminatórias
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!Array.isArray(groups) || groups.length === 0 ? (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum grupo criado</h3>
                  <p className="text-muted-foreground mb-4">
                    Escolha uma opção para criar os grupos do torneio
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={handleQuickGenerateGroups}
                      disabled={!Array.isArray(registeredAthletes) || registeredAthletes.length === 0}
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      Gerar Automaticamente
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowGroupCustomization(true)}
                      disabled={!Array.isArray(registeredAthletes) || registeredAthletes.length === 0}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Personalizar Grupos
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{groups.length} grupos criados</h4>
                      <p className="text-sm text-muted-foreground">
                        {groups.reduce((sum, g) => sum + (Array.isArray(g.athletes) ? g.athletes.length : 0), 0)} atletas distribuídos
                      </p>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => setShowGroupCustomization(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Grupos
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map(group => (
                      <Card key={group.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{group.name}</CardTitle>
                          <CardDescription>
                            {Array.isArray(group.athletes) ? group.athletes.length : 0} atletas
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {Array.isArray(group.athletes) && group.athletes.slice(0, 3).map(athlete => (
                              <div key={athlete.id} className="text-sm">
                                <span className="font-medium">{athlete.athleteName}</span>
                                <span className="text-muted-foreground ml-2">({athlete.athleteRating})</span>
                              </div>
                            ))}
                            {Array.isArray(group.athletes) && group.athletes.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{group.athletes.length - 3} atletas
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'matches' && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Partidas</CardTitle>
            <CardDescription>
              Acompanhe e gerencie as partidas do torneio
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!Array.isArray(groups) || groups.length === 0 ? (
              <div className="text-center py-8">
                <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Grupos necessários</h3>
                <p className="text-muted-foreground mb-4">
                  Crie os grupos primeiro para gerar as partidas
                </p>
                <Button onClick={() => setActiveTab('groups')}>
                  <Award className="h-4 w-4 mr-2" />
                  Ir para Grupos
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalMatches}</div>
                      <div className="text-sm text-muted-foreground">Total de Partidas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{completedMatches}</div>
                      <div className="text-sm text-muted-foreground">Finalizadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalMatches - completedMatches}</div>
                      <div className="text-sm text-muted-foreground">Pendentes</div>
                    </div>
                  </div>
                  
                  <Button onClick={() => setShowMatchManager(true)}>
                    <Play className="h-4 w-4 mr-2" />
                    Gerenciar Partidas
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'eliminations' && (
        <Card>
          <CardHeader>
            <CardTitle>Eliminatórias</CardTitle>
            <CardDescription>
              Chaveamento eliminatório com os classificados dos grupos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!Array.isArray(groups) || groups.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Grupos necessários</h3>
                <p className="text-muted-foreground mb-4">
                  Crie os grupos primeiro para gerar as eliminatórias
                </p>
                <Button onClick={() => setActiveTab('groups')}>
                  <Award className="h-4 w-4 mr-2" />
                  Ir para Grupos
                </Button>
              </div>
            ) : completedMatches < totalMatches ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aguardando fase de grupos</h3>
                <p className="text-muted-foreground mb-4">
                  Complete as partidas dos grupos para gerar as eliminatórias
                </p>
                <div className="mb-4">
                  <div className="text-sm text-muted-foreground">
                    Progresso: {completedMatches}/{totalMatches} partidas finalizadas
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <Button onClick={() => setShowMatchManager(true)}>
                  <Play className="h-4 w-4 mr-2" />
                  Finalizar Partidas
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalBracketMatches}</div>
                      <div className="text-sm text-muted-foreground">Total de Partidas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{completedBracketMatches}</div>
                      <div className="text-sm text-muted-foreground">Finalizadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{champions}</div>
                      <div className="text-sm text-muted-foreground">Campeões</div>
                    </div>
                  </div>
                  
                  <Button onClick={() => setShowBracketManager(true)}>
                    <Trophy className="h-4 w-4 mr-2" />
                    Gerenciar Eliminatórias
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações do Torneio</CardTitle>
          <CardDescription>
            Gerencie as fases do seu torneio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {tournamentStatus.registrationStatus === 'open' ? (
              <>
                <Button onClick={() => setShowRegistrationManager(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Gerenciar Inscrições
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCloseRegistrations}
                  disabled={!Array.isArray(registeredAthletes) || registeredAthletes.length === 0}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Encerrar Inscrições
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleReopenRegistrations}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Reabrir Inscrições
                </Button>
                {!tournamentStatus.groupsGenerated && (
                  <>
                    <Button onClick={handleQuickGenerateGroups}>
                      <Shuffle className="h-4 w-4 mr-2" />
                      Gerar Grupos
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowGroupCustomization(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Personalizar Grupos
                    </Button>
                  </>
                )}
                {Array.isArray(groups) && groups.length > 0 && (
                  <>
                    <Button onClick={() => setShowMatchManager(true)}>
                      <Play className="h-4 w-4 mr-2" />
                      Gerenciar Partidas
                    </Button>
                    {completedMatches >= totalMatches && (
                      <Button onClick={() => setShowBracketManager(true)}>
                        <Trophy className="h-4 w-4 mr-2" />
                        Gerenciar Eliminatórias
                      </Button>
                    )}
                  </>
                )}
                {tournamentStatus.groupsGenerated && !tournamentStatus.tournamentStarted && (
                  <Button onClick={handleStartTournament}>
                    <Trophy className="h-4 w-4 mr-2" />
                    Iniciar Torneio
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}