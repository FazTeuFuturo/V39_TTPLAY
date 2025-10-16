// src/components/dashboard/AthleteStatsGrid.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Award, Target, TrendingUp, Trophy } from 'lucide-react'
import type { StoredUser } from '@/lib/auth-storage'

interface AthleteStatsGridProps {
  user: StoredUser;
}

export function AthleteStatsGrid({ user }: AthleteStatsGridProps) {
  const winRate = user.gamesPlayed && user.wins ? Math.round((user.wins / user.gamesPlayed) * 100) : 0;

  return (
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
  );
}