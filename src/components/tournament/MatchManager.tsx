'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, Trophy, CheckCircle, AlertCircle, 
  Clock, Users, Target, X, Edit, Save
} from 'lucide-react'
import { Match, SetScore, GroupStanding, generateRoundRobinMatches, calculateGroupStandings, updateMatchResult, saveMatches, loadMatches } from '@/lib/match-system'

interface TournamentGroup {
  id: string
  name: string
  category: string
  athletes: any[]
}

interface MatchManagerProps {
  tournament: any
  groups: TournamentGroup[]
  onBack: () => void
}

export function MatchManager({ tournament, groups, onBack }: MatchManagerProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadExistingMatches()
    if (groups.length > 0 && !selectedGroup) {
      setSelectedGroup(groups[0].id)
    }
  }, [tournament.id, groups])

  const loadExistingMatches = () => {
    const existingMatches = loadMatches(tournament.id)
    setMatches(existingMatches)
  }

  const generateAllMatches = () => {
    if (groups.length === 0) {
      setError('Nenhum grupo encontrado para gerar partidas')
      return
    }

    const confirmed = window.confirm(
      `Gerar partidas para ${groups.length} grupos?\n\nEsta ação criará todas as partidas round-robin.`
    )

    if (!confirmed) return

    setIsGenerating(true)
    setError('')

    try {
      const allMatches: Match[] = []

      groups.forEach(group => {
        if (group.athletes.length >= 2) {
          const groupMatches = generateRoundRobinMatches(group.id, group.athletes)
          allMatches.push(...groupMatches)
        }
      })

      setMatches(allMatches)
      saveMatches(tournament.id, allMatches)
      
      setMessage(`${allMatches.length} partidas geradas com sucesso!`)
    } catch (err) {
      setError('Erro ao gerar partidas. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleMatchResult = (matchId: string, sets: SetScore[]) => {
    const matchIndex = matches.findIndex(m => m.id === matchId)
    if (matchIndex === -1) return

    const updatedMatch = updateMatchResult(matches[matchIndex], sets)
    const updatedMatches = [...matches]
    updatedMatches[matchIndex] = updatedMatch

    setMatches(updatedMatches)
    saveMatches(tournament.id, updatedMatches)
    setSelectedMatch(null)
    setMessage('Resultado salvo com sucesso!')
  }

  // Get matches for selected group
  const groupMatches = matches.filter(m => m.groupId === selectedGroup)
  const selectedGroupData = groups.find(g => g.id === selectedGroup)
  
  // Calculate standings for selected group
  const standings = selectedGroupData ? calculateGroupStandings(selectedGroupData.athletes, groupMatches) : []

  // Statistics
  const totalMatches = matches.length
  const completedMatches = matches.filter(m => m.status === 'completed').length
  const pendingMatches = totalMatches - completedMatches

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Play className="h-6 w-6 text-blue-500" />
            Gerenciar Partidas
          </h1>
          <p className="text-muted-foreground">
            {totalMatches} partidas • {completedMatches} finalizadas • {pendingMatches} pendentes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          {totalMatches === 0 && (
            <Button onClick={generateAllMatches} disabled={isGenerating || groups.length === 0}>
              <Play className="h-4 w-4 mr-2" />
              {isGenerating ? 'Gerando...' : 'Gerar Todas as Partidas'}
            </Button>
          )}
        </div>
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total de Partidas</p>
                <p className="text-2xl font-bold">{totalMatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Finalizadas</p>
                <p className="text-2xl font-bold">{completedMatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Pendentes</p>
                <p className="text-2xl font-bold">{pendingMatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Grupos</p>
                <p className="text-2xl font-bold">{groups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {totalMatches === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma partida gerada</h3>
            <p className="text-muted-foreground mb-4">
              Clique em "Gerar Todas as Partidas" para criar as partidas round-robin dos grupos
            </p>
            <Button onClick={generateAllMatches} disabled={isGenerating || groups.length === 0}>
              <Play className="h-4 w-4 mr-2" />
              {isGenerating ? 'Gerando...' : 'Gerar Todas as Partidas'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Group Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Grupo</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} ({group.athletes.length} atletas)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedGroup && (
            <Tabs defaultValue="matches" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="matches">Partidas</TabsTrigger>
                <TabsTrigger value="standings">Classificação</TabsTrigger>
              </TabsList>

              <TabsContent value="matches" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedGroupData?.name}</CardTitle>
                    <CardDescription>
                      {groupMatches.length} partidas • {groupMatches.filter(m => m.status === 'completed').length} finalizadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {groupMatches.map(match => (
                        <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <span className="font-medium">{match.player1.name}</span>
                              <span className="text-muted-foreground">vs</span>
                              <span className="font-medium">{match.player2.name}</span>
                            </div>
                            {match.status === 'completed' && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Resultado: {match.setsWon1}-{match.setsWon2}
                                {match.sets.length > 0 && (
                                  <span className="ml-2">
                                    ({match.sets.map(set => `${set.player1Score}-${set.player2Score}`).join(', ')})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              match.status === 'completed' ? 'default' :
                              match.status === 'in_progress' ? 'secondary' : 'outline'
                            }>
                              {match.status === 'completed' ? 'Finalizada' :
                               match.status === 'in_progress' ? 'Em andamento' : 'Pendente'}
                            </Badge>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant={match.status === 'completed' ? 'outline' : 'default'}
                                  onClick={() => setSelectedMatch(match)}
                                >
                                  {match.status === 'completed' ? (
                                    <>
                                      <Edit className="h-3 w-3 mr-1" />
                                      Editar
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-3 w-3 mr-1" />
                                      Resultado
                                    </>
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>
                                    {match.status === 'completed' ? 'Editar Resultado' : 'Inserir Resultado'}
                                  </DialogTitle>
                                  <DialogDescription>
                                    {match.player1.name} vs {match.player2.name}
                                  </DialogDescription>
                                </DialogHeader>
                                <MatchResultForm 
                                  match={match} 
                                  onSubmit={handleMatchResult}
                                  existingSets={match.sets}
                                />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="standings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Classificação - {selectedGroupData?.name}</CardTitle>
                    <CardDescription>
                      Ordenado por pontos, diferença de sets e sets ganhos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {standings.map(standing => (
                        <div key={standing.athlete.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <Badge variant={standing.position <= 2 ? 'default' : 'outline'}>
                              {standing.position}º
                            </Badge>
                            <div>
                              <div className="font-medium">{standing.athlete.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Rating: {standing.athlete.rating}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-medium">{standing.points} pts</div>
                            <div className="text-muted-foreground">
                              {standing.wins}V-{standing.losses}D • Sets: {standing.setsWon}-{standing.setsLost}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  )
}

function MatchResultForm({ 
  match, 
  onSubmit, 
  existingSets = [] 
}: { 
  match: Match; 
  onSubmit: (matchId: string, sets: SetScore[]) => void;
  existingSets?: SetScore[];
}) {
  const [sets, setSets] = useState<SetScore[]>(
    existingSets.length > 0 
      ? existingSets 
      : [{ player1Score: 0, player2Score: 0, winner: 1 }]
  )
  const [error, setError] = useState('')

  const addSet = () => {
    if (sets.length < 7) {
      setSets([...sets, { player1Score: 0, player2Score: 0, winner: 1 }])
    }
  }

  const removeSet = (index: number) => {
    if (sets.length > 1) {
      setSets(sets.filter((_, i) => i !== index))
    }
  }

  const updateSet = (index: number, field: keyof SetScore, value: number) => {
    const newSets = [...sets]
    newSets[index] = { ...newSets[index], [field]: value }
    
    // Auto-determine winner based on scores
    if (field === 'player1Score' || field === 'player2Score') {
      const set = newSets[index]
      if (set.player1Score >= 11 && set.player1Score - set.player2Score >= 2) {
        newSets[index].winner = 1
      } else if (set.player2Score >= 11 && set.player2Score - set.player1Score >= 2) {
        newSets[index].winner = 2
      }
    }
    
    setSets(newSets)
  }

  const validateSets = () => {
    setError('')
    
    for (let i = 0; i < sets.length; i++) {
      const set = sets[i]
      
      if (set.player1Score < 0 || set.player2Score < 0) {
        setError(`Set ${i + 1}: Pontuação não pode ser negativa`)
        return false
      }
      
      const maxScore = Math.max(set.player1Score, set.player2Score)
      const minScore = Math.min(set.player1Score, set.player2Score)
      
      if (maxScore < 11) {
        setError(`Set ${i + 1}: Vencedor deve ter pelo menos 11 pontos`)
        return false
      }
      
      if (maxScore - minScore < 2) {
        setError(`Set ${i + 1}: Diferença mínima de 2 pontos`)
        return false
      }
    }
    
    const player1Sets = sets.filter(set => set.winner === 1).length
    const player2Sets = sets.filter(set => set.winner === 2).length
    
    if (player1Sets === player2Sets) {
      setError('Partida deve ter um vencedor (maioria dos sets)')
      return false
    }
    
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateSets()) {
      onSubmit(match.id, sets)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        {sets.map((set, index) => (
          <div key={index} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-medium">Set {index + 1}</Label>
              {sets.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeSet(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{match.player1.name}</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={set.player1Score}
                  onChange={(e) => updateSet(index, 'player1Score', parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{match.player2.name}</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={set.player2Score}
                  onChange={(e) => updateSet(index, 'player2Score', parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
            </div>
            
            <div className="mt-2 text-center">
              <Badge variant={set.winner === 1 ? 'default' : set.winner === 2 ? 'secondary' : 'outline'}>
                Vencedor: {set.winner === 1 ? match.player1.name : match.player2.name}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={addSet}
          disabled={sets.length >= 7}
        >
          Adicionar Set
        </Button>
        
        <div className="text-sm text-muted-foreground">
          {sets.filter(set => set.winner === 1).length}-{sets.filter(set => set.winner === 2).length}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" >
        Salvar Resultado
      </Button>
    </form>
  )
}