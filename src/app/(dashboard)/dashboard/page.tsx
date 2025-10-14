'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Trophy, 
  Users, 
  Calendar,
  ArrowRight,
  MapPin,
  Clock
} from 'lucide-react'

// Mock data - in real app, this would come from API/database
const mockUser = {
  id: '1',
  name: 'João Silva',
  email: 'joao@email.com',
  currentRating: 1450,
  peakRating: 1520,
  gamesPlayed: 25,
  wins: 18,
  losses: 7,
}

const mockTournaments = [
  {
    id: '1',
    name: 'Torneio de Verão 2024',
    location: 'São Paulo, SP',
    date: '2024-12-15',
    participants: 32,
    entryFee: 50,
    status: 'REGISTRATION' as const
  },
  {
    id: '2',
    name: 'Copa Iniciantes',
    location: 'Rio de Janeiro, RJ',
    date: '2024-12-20',
    participants: 16,
    entryFee: 25,
    status: 'REGISTRATION' as const
  },
  {
    id: '3',
    name: 'Campeonato Regional',
    location: 'Belo Horizonte, MG',
    date: '2024-12-28',
    participants: 64,
    entryFee: 75,
    status: 'REGISTRATION' as const
  }
]

const mockRecentMatches = [
  { id: '1', opponent: 'Maria Santos', result: 'win' as const, date: '2 dias atrás' },
  { id: '2', opponent: 'Carlos Lima', result: 'win' as const, date: '5 dias atrás' },
  { id: '3', opponent: 'Ana Costa', result: 'loss' as const, date: '1 semana atrás' },
]

export default function DashboardPage() {
  return (
    <DashboardLayout currentUser={mockUser}>
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bem-vindo, {mockUser.name}! 👋
            </h1>
            <p className="text-gray-600">
              Acompanhe seu progresso e encontre novos desafios
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Criar Torneio
            </Button>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Encontrar Jogadores
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <DashboardStats 
          user={mockUser}
          upcomingTournaments={2}
          recentMatches={mockRecentMatches}
        />

        {/* Quick Actions & Featured Tournaments */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Available Tournaments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Torneios Disponíveis
              </CardTitle>
              <CardDescription>
                Encontre torneios para participar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockTournaments.slice(0, 3).map((tournament) => (
                <div key={tournament.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{tournament.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {tournament.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {tournament.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {tournament.participants} vagas
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">R$ {tournament.entryFee}</p>
                    <Badge variant="outline" className="text-xs">
                      Inscrições Abertas
                    </Badge>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full">
                Ver Todos os Torneios
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
              <CardDescription>
                O que você gostaria de fazer hoje?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Trophy className="h-4 w-4 mr-2" />
                Participar de um Torneio
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Desafiar um Jogador
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Agendar Treino
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Criar Clube
              </Button>

              <div className="pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Dica do Dia 💡</h4>
                <p className="text-xs text-gray-600">
                  Pratique regularmente contra jogadores de níveis diferentes para melhorar mais rapidamente seu ranking ELO.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle>Feed de Atividades</CardTitle>
            <CardDescription>
              Veja o que está acontecendo na comunidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">Maria Santos</span> venceu o 
                    <span className="font-medium"> Torneio Iniciantes SP</span>
                  </p>
                  <p className="text-xs text-gray-500">2 horas atrás</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium">Carlos Lima</span> alcançou rating 
                    <span className="font-medium">1600</span> - Nível Intermediário+
                  </p>
                  <p className="text-xs text-gray-500">5 horas atrás</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm">
                    Novo torneio <span className="font-medium">"Copa de Natal"</span> foi criado em 
                    <span className="font-medium">Rio de Janeiro</span>
                  </p>
                  <p className="text-xs text-gray-500">1 dia atrás</p>
                </div>
              </div>

              <Button variant="ghost" className="w-full">
                Ver Mais Atividades
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}