'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Building2, 
  Trophy, 
  Users, 
  Calendar,
  TrendingUp,
  MapPin,
  Star
} from 'lucide-react'
import { UserType } from '@/lib/types'

interface UserTypeSelectionProps {
  onSelect: (userType: UserType) => void
  onBack: () => void
}

export function UserTypeSelection({ onSelect, onBack }: UserTypeSelectionProps) {
  const [selectedType, setSelectedType] = useState<UserType | null>(null)

  const handleContinue = () => {
    if (selectedType) {
      onSelect(selectedType)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏓 Bem-vindo ao Tênis de Mesa Pro
          </h1>
          <p className="text-lg text-gray-600">
            Escolha o tipo de conta que melhor se adequa ao seu perfil
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Athlete Card */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedType === UserType.ATHLETE 
                ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                : 'hover:border-blue-300'
            }`}
            onClick={() => setSelectedType(UserType.ATHLETE)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Sou Atleta</CardTitle>
              <CardDescription className="text-base">
                Participe de torneios, desafie outros jogadores e acompanhe sua evolução
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Participar de torneios</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Acompanhar ranking ELO</span>
                </div>
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Desafiar outros jogadores</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="text-sm">Conectar-se com a comunidade</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Badge variant="secondary" className="w-full justify-center">
                  Gratuito para sempre
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Club Card */}
          <Card 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedType === UserType.CLUB 
                ? 'ring-2 ring-orange-500 border-orange-500 bg-orange-50' 
                : 'hover:border-orange-300'
            }`}
            onClick={() => setSelectedType(UserType.CLUB)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
                <Building2 className="h-8 w-8 text-orange-600" />
              </div>
              <CardTitle className="text-xl">Sou Clube/Empresa</CardTitle>
              <CardDescription className="text-base">
                Organize torneios, gerencie atletas e promova eventos esportivos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  <span className="text-sm">Criar e gerenciar torneios</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-orange-600" />
                  <span className="text-sm">Gerenciar atletas associados</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <span className="text-sm">Promover eventos locais</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  <span className="text-sm">Relatórios e estatísticas</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Badge variant="secondary" className="w-full justify-center">
                  Planos a partir de R$ 49/mês
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="px-8"
          >
            Voltar
          </Button>
          <Button 
            onClick={handleContinue}
            disabled={!selectedType}
            className="px-8"
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  )
}