'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, ArrowLeft, CheckCircle, AlertCircle, 
  Users, Target, Play, Crown, Award,
  Zap, ChevronRight, Star
} from 'lucide-react'
import { 
  BracketMatch, 
  generateSingleEliminationBracket, 
  updateBracketWithResult,
} from '@/lib/tournament-generator'
import { MatchStatus } from '@/lib/types'

interface TournamentGroup {
  id: string
  name: string
  category: string
  athletes: any[]
}

interface BracketManagerProps {
  tournament: any
  groups: TournamentGroup[]
  onBack: () => void
}

export interface QualifiedAthlete {
  id: string
  name: string
  rating: number
  category: string
  groupName: string
  position: number
}

export function BracketManager({ tournament, groups, onBack }: BracketManagerProps) {
  const [brackets, setBrackets] = useState<{ [category: string]: BracketMatch[] }>({})
  const [qualifiedAthletes, setQualifiedAthletes] = useState<QualifiedAthlete[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    loadQualifiedAthletes()
    loadExistingBrackets()
  }, [tournament.id, groups])

  const loadQualifiedAthletes = () => {
    try {
      // Load group standings to determine qualified athletes
      const qualified: QualifiedAthlete[] = []
      
      groups.forEach(group => {
        // Load matches for this group to calculate standings
        const matches = JSON.parse(localStorage.getItem(`tournament_matches_${tournament.id}`) || '[]')
        const groupMatches = matches.filter((m: any) => m.groupId === group.id && m.status === 'completed')
        
        // Calculate standings
        const standings = calculateGroupStandings(group.athletes, groupMatches)
        
        // Take top 2 from each group (configurable)
        const qualifiedFromGroup = standings.slice(0, 2).map((standing, index) => ({
          id: standing.athlete.id,
          name: standing.athlete.name,
          rating: standing.athlete.rating,
          category: group.category,
          groupName: group.name,
          position: index + 1
        }))
        
        qualified.push(...qualifiedFromGroup)
      })
      console.log("qualified", qualified);
      console.log("groups", groups);
      setQualifiedAthletes(qualified)
      
      // Set first category as default
      if (qualified.length > 0 && !selectedCategory) {
        const categories = [...new Set(qualified.map(a => a.category))]
        console.log("categories", categories);
        setSelectedCategory(categories[0])
      }
      
    } catch (error) {
      console.error('Error loading qualified athletes:', error)
      setError('Erro ao carregar atletas classificados')
    }
  }

  const loadExistingBrackets = () => {
    try {
      const savedBrackets = localStorage.getItem(`tournament_brackets_${tournament.id}`)
      if (savedBrackets) {
        setBrackets(JSON.parse(savedBrackets))
      }
    } catch (error) {
      console.error('Error loading brackets:', error)
    }
  }

     const generateBrackets = () => {
        if (qualifiedAthletes.length === 0) {
          setError('Nenhum atleta classificado encontrado')
          return
        }

        setIsGenerating(true)
        setError('')

        try {
          const newBrackets: { [category: string]: BracketMatch[] } = {}

          const athletesByCategory = qualifiedAthletes.reduce((acc, athlete) => {
            if (!acc[athlete.category]) {
              acc[athlete.category] = []
            }
            acc[athlete.category].push(athlete)
            return acc
          }, {} as Record<string, QualifiedAthlete[]>)

          // Gera as chaves para cada categoria
          Object.entries(athletesByCategory).forEach(([category, athletes]) => {
            if (athletes.length >= 2) {
              // =============================================================
              // MUDANÇA PRINCIPAL AQUI
              // Removemos o `.map()` que perdia os dados.
              // Passamos a lista de `QualifiedAthlete` diretamente para a nossa
              // nova função, que agora sabe como lidar com a `position`.
              // =============================================================
              const bracketMatches = generateSingleEliminationBracket(athletes, `${tournament.id}_${category}`)
              newBrackets[category] = bracketMatches
            }
          })

          setBrackets(newBrackets)
          // ... (resto da função permanece igual)
          localStorage.setItem(`tournament_brackets_${tournament.id}`, JSON.stringify(newBrackets))
          const tournamentStatus = JSON.parse(localStorage.getItem(`tournament_status_${tournament.id}`) || '{}')
          tournamentStatus.bracketGenerated = true
          localStorage.setItem(`tournament_status_${tournament.id}`, JSON.stringify(tournamentStatus))
          const totalMatches = Object.values(newBrackets).reduce((sum, matches) => sum + matches.length, 0)
          setMessage(`Chaveamento gerado com sucesso! ${totalMatches} partidas criadas.`)
        } catch (err) {
          console.error('Error generating brackets:', err)
          setError('Erro ao gerar chaveamento. Tente novamente.')
        } finally {
          setIsGenerating(false)
        }
    }

  const updateMatchResult = (matchId: string, winnerId: string, player1Score: number, player2Score: number) => {
    if (!selectedCategory || !brackets[selectedCategory]) return

    try {
      const updatedMatches = updateBracketWithResult(brackets[selectedCategory], matchId, winnerId)
      
      // Update the match scores
      const match = updatedMatches.find(m => m.id === matchId)
      if (match) {
        match.player1Score = player1Score
        match.player2Score = player2Score
      }

      const newBrackets = {
        ...brackets,
        [selectedCategory]: updatedMatches
      }
      
      setBrackets(newBrackets)
      localStorage.setItem(`tournament_brackets_${tournament.id}`, JSON.stringify(newBrackets))
      
      setMessage('Resultado atualizado e atleta avançado!')
      
    } catch (err) {
      setError('Erro ao atualizar resultado')
    }
  }

  // Helper function to calculate group standings (simplified)
  const calculateGroupStandings = (athletes: any[], matches: any[]) => {
    const standings = athletes.map(athlete => ({
      athlete: {
        id: athlete.id,
        name: athlete.athleteName,
        rating: athlete.athleteRating
      },
      wins: 0,
      losses: 0,
      points: 0
    }))

    matches.forEach(match => {
      if (match.winner) {
        const winner = standings.find(s => s.athlete.id === (match.winner === 1 ? match.player1.id : match.player2.id))
        const loser = standings.find(s => s.athlete.id === (match.winner === 1 ? match.player2.id : match.player1.id))
        
        if (winner && loser) {
          winner.wins++
          winner.points += 3
          loser.losses++
        }
      }
    })

    return standings.sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      return b.wins - a.wins
    })
  }

  const categories = [...new Set(qualifiedAthletes.map(a => a.category))]
  const categoryBracket = selectedCategory ? brackets[selectedCategory] || [] : []
  const categoryQualified = qualifiedAthletes.filter(a => a.category === selectedCategory)

  // Calculate bracket statistics
  const totalBrackets = Object.keys(brackets).length
  const totalMatches = Object.values(brackets).reduce((sum, matches) => sum + matches.length, 0)
  const completedMatches = Object.values(brackets).reduce(
    (sum, matches) => sum + matches.filter(m => m.status === MatchStatus.COMPLETED).length, 
    0
  )

  const renderBracketTree = (matches: BracketMatch[]) => {
    if (matches.length === 0) return null

    const rounds = Math.max(...matches.map(m => m.round))
    const matchesByRound: { [round: number]: BracketMatch[] } = {}
    
    matches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = []
      }
      matchesByRound[match.round].push(match)
    })

    return (
      <div className="flex space-x-8 overflow-x-auto pb-4">
        {Array.from({ length: rounds }, (_, i) => i + 1).map(round => (
          <div key={round} className="flex flex-col space-y-4 min-w-[250px]">
            <h4 className="text-center font-medium text-sm text-muted-foreground">
              {round === rounds ? 'Final' : 
               round === rounds - 1 ? 'Semifinal' : 
               round === rounds - 2 ? 'Quartas' : 
               `${round}ª Rodada`}
            </h4>
            
            {matchesByRound[round]?.sort((a, b) => a.position - b.position).map(match => (
              <Card key={match.id} className="w-full">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {/* Player 1 */}
                    <div className={`flex items-center justify-between p-2 rounded ${
                      match.winnerId === match.player1Id ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}>
                      <span className="text-sm font-medium">
                        {match.player1Name || 'TBD'}
                      </span>
                      <div className="flex items-center space-x-2">
                        {match.winnerId === match.player1Id && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {match.player1Score}
                        </Badge>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="text-center text-xs text-muted-foreground">vs</div>

                    {/* Player 2 */}
                    <div className={`flex items-center justify-between p-2 rounded ${
                      match.winnerId === match.player2Id ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                    }`}>
                      <span className="text-sm font-medium">
                        {match.player2Name || 'TBD'}
                      </span>
                      <div className="flex items-center space-x-2">
                        {match.winnerId === match.player2Id && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {match.player2Score}
                        </Badge>
                      </div>
                    </div>

                    {/* Match Status */}
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant={
                        match.status === MatchStatus.COMPLETED ? 'default' :
                        match.status === MatchStatus.IN_PROGRESS ? 'secondary' : 'outline'
                      } className="text-xs">
                        {match.status === MatchStatus.COMPLETED ? 'Finalizada' :
                         match.status === MatchStatus.IN_PROGRESS ? 'Em andamento' : 'Pendente'}
                      </Badge>
                      
                      {match.player1Id && match.player2Id && match.status !== MatchStatus.COMPLETED && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Simple result input - in real app would be a modal
                            const result = prompt('Digite o resultado (formato: "3-1" para sets)')
                            if (result) {
                              const [p1Score, p2Score] = result.split('-').map(s => parseInt(s.trim()))
                              const winnerId = p1Score > p2Score ? match.player1Id! : match.player2Id!
                              updateMatchResult(match.id, winnerId, p1Score, p2Score)
                            }
                          }}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Resultado
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Chaveamento Eliminatório
            </h1>
            <p className="text-muted-foreground">
              {qualifiedAthletes.length} atletas classificados • {totalBrackets} categorias
            </p>
          </div>
        </div>
        
        {totalBrackets === 0 && (
          <Button onClick={generateBrackets} disabled={isGenerating || qualifiedAthletes.length === 0}>
            <Zap className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar Chaveamento'}
          </Button>
        )}
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
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Classificados</p>
                <p className="text-2xl font-bold">{qualifiedAthletes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Chaves</p>
                <p className="text-2xl font-bold">{totalBrackets}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Partidas</p>
                <p className="text-2xl font-bold">{totalMatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Finalizadas</p>
                <p className="text-2xl font-bold">{completedMatches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {totalBrackets === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Chaveamento não gerado</h3>
            <p className="text-muted-foreground mb-4">
              {qualifiedAthletes.length === 0 
                ? 'Complete a fase de grupos primeiro para classificar atletas'
                : 'Clique em "Gerar Chaveamento" para criar as eliminatórias'
              }
            </p>
            
            {qualifiedAthletes.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Atletas Classificados por Categoria:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map(category => {
                    const categoryAthletes = qualifiedAthletes.filter(a => a.category === category)
                    return (
                      <Card key={category}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {categoryAthletes.map(athlete => (
                              <div key={athlete.id} className="flex items-center justify-between text-sm">
                                <span>{athlete.name}</span>
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {athlete.position}º {athlete.groupName.split(' - ')[1]}
                                  </Badge>
                                  <span className="text-muted-foreground">({athlete.rating})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-auto">
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(category => (
            <TabsContent key={category} value={category} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Chaveamento - {category}</span>
                    <Badge variant="outline">
                      {categoryQualified.length} atletas
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Eliminação simples - O vencedor de cada partida avança para a próxima fase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderBracketTree(categoryBracket)}
                </CardContent>
              </Card>

              {/* Tournament Champion */}
              {(() => {
                const finalMatch = categoryBracket.find(m => m.round === Math.max(...categoryBracket.map(m => m.round)))
                const champion = finalMatch?.status === MatchStatus.COMPLETED ? 
                  (finalMatch.winnerId === finalMatch.player1Id ? finalMatch.player1Name : finalMatch.player2Name) : null
                
                return champion && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-6 text-center">
                      <Crown className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
                      <h3 className="text-xl font-bold text-yellow-800 mb-2">
                        🏆 Campeão - {category}
                      </h3>
                      <p className="text-lg font-medium text-yellow-700">
                        {champion}
                      </p>
                    </CardContent>
                  </Card>
                )
              })()}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}