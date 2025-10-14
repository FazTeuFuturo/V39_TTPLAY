'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  TrendingUp, 
  Users, 
  Calendar,
  Target,
  Award,
  Zap,
  Clock
} from 'lucide-react'

interface DashboardStatsProps {
  user?: {
    currentRating: number
    peakRating: number
    gamesPlayed: number
    wins: number
    losses: number
  }
  upcomingTournaments?: number
  recentMatches?: Array<{
    id: string
    opponent: string
    result: 'win' | 'loss'
    date: string
  }>
}

export function DashboardStats({ user, upcomingTournaments = 0, recentMatches = [] }: DashboardStatsProps) {
  const winRate = user && user.gamesPlayed > 0 ? (user.wins / user.gamesPlayed) * 100 : 0
  const ratingChange = user ? user.currentRating - 1200 : 0 // Assuming 1200 is starting rating
  
  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Atual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.currentRating || 1200}</div>
            <p className="text-xs text-muted-foreground">
              {ratingChange >= 0 ? '+' : ''}{ratingChange} desde o início
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Vitória</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {user?.wins || 0}V / {user?.losses || 0}D
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidas Jogadas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.gamesPlayed || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total de partidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Torneios</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingTournaments}</div>
            <p className="text-xs text-muted-foreground">
              Inscrições confirmadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Rating Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Progresso do Rating
            </CardTitle>
            <CardDescription>
              Sua evolução no sistema ELO
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rating Atual</span>
                <span className="font-medium">{user?.currentRating || 1200}</span>
              </div>
              <Progress 
                value={((user?.currentRating || 1200) / 2000) * 100} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Iniciante (1200)</span>
                <span>Expert (2000)</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Melhor Rating</p>
                <p className="text-lg font-bold text-blue-600">{user?.peakRating || 1200}</p>
              </div>
              <Trophy className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Suas últimas partidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentMatches.length > 0 ? (
              <div className="space-y-3">
                {recentMatches.slice(0, 5).map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        match.result === 'win' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">vs {match.opponent}</p>
                        <p className="text-xs text-muted-foreground">{match.date}</p>
                      </div>
                    </div>
                    <Badge variant={match.result === 'win' ? 'default' : 'destructive'}>
                      {match.result === 'win' ? 'Vitória' : 'Derrota'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma partida recente
                </p>
                <p className="text-xs text-muted-foreground">
                  Participe de um torneio para começar!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}