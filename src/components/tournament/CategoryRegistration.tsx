'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Trophy, Users, DollarSign, CheckCircle, AlertCircle, 
  Calendar, MapPin, Clock, Star
} from 'lucide-react'
import { Tournament } from '@/lib/types'
import { generateTestAthletes, TestAthlete } from '@/lib/test-athletes'

interface CategoryRegistrationProps {
  tournament: Tournament
  onRegistrationComplete: (registration: Registration) => void
}

interface Registration {
  athleteId: string
  tournamentId: string
  categories: string[]
  totalPrice: number
  registrationDate: Date
}

interface CategoryPricing {
  [key: string]: number
}

export function CategoryRegistration({ tournament, onRegistrationComplete }: CategoryRegistrationProps) {
  const [selectedAthlete, setSelectedAthlete] = useState<TestAthlete | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [athletes, setAthletes] = useState<TestAthlete[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Category pricing structure
  const categoryPricing: CategoryPricing = {
    'Absoluto A Masculino': 50.00,
    'Absoluto A Feminino': 50.00,
    'Absoluto B Masculino': 40.00,
    'Absoluto B Feminino': 40.00,
    'Absoluto C Masculino': 30.00,
    'Absoluto C Feminino': 30.00,
    'Sub-19 Masculino': 25.00,
    'Sub-19 Feminino': 25.00,
    'Sub-16 Masculino': 20.00,
    'Sub-16 Feminino': 20.00,
    'Veterano 40+ Masculino': 35.00,
    'Veterano 40+ Feminino': 35.00,
    'Veterano 50+ Masculino': 30.00,
    'Veterano 50+ Feminino': 30.00
  }

  useEffect(() => {
    loadAthletes()
  }, [])

  const loadAthletes = () => {
    const testAthletes = generateTestAthletes(50)
    setAthletes(testAthletes)
    // Auto-select first athlete for demo
    if (testAthletes.length > 0) {
      setSelectedAthlete(testAthletes[0])
    }
  }

  const isAthleteEligibleForCategory = (athlete: TestAthlete, category: string): boolean => {
    // Age validation
    if (category.includes('Sub-16') && athlete.age > 16) return false
    if (category.includes('Sub-19') && athlete.age > 19) return false
    if (category.includes('Veterano 40+') && athlete.age < 40) return false
    if (category.includes('Veterano 50+') && athlete.age < 50) return false

    // Gender validation
    if (category.includes('Masculino') && athlete.gender !== 'male') return false
    if (category.includes('Feminino') && athlete.gender !== 'female') return false

    // Rating validation for Absoluto categories
    if (category.includes('Absoluto A') && athlete.currentRating < 1800) return false
    if (category.includes('Absoluto B') && (athlete.currentRating < 1400 || athlete.currentRating >= 1800)) return false
    if (category.includes('Absoluto C') && athlete.currentRating >= 1400) return false

    return true
  }

  const getEligibleCategories = (athlete: TestAthlete): string[] => {
    return tournament.categories?.filter(category => 
      isAthleteEligibleForCategory(athlete, category)
    ) || []
  }

  const calculateTotalPrice = (): number => {
    return selectedCategories.reduce((total, category) => {
      return total + (categoryPricing[category] || 0)
    }, 0)
  }

  const handleCategoryToggle = (category: string, checked: boolean) => {
    if (checked) {
      setSelectedCategories(prev => [...prev, category])
    } else {
      setSelectedCategories(prev => prev.filter(c => c !== category))
    }
  }

  const handleRegistration = async () => {
    if (!selectedAthlete || selectedCategories.length === 0) {
      setError('Selecione pelo menos uma categoria para se inscrever')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const registration: Registration = {
        athleteId: selectedAthlete.id,
        tournamentId: tournament.id,
        categories: selectedCategories,
        totalPrice: calculateTotalPrice(),
        registrationDate: new Date()
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      onRegistrationComplete(registration)
    } catch (error) {
      setError('Erro ao processar inscrição. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedAthlete) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum atleta selecionado</h3>
          <p className="text-muted-foreground">
            Carregando atletas disponíveis...
          </p>
        </CardContent>
      </Card>
    )
  }

  const eligibleCategories = getEligibleCategories(selectedAthlete)
  const totalPrice = calculateTotalPrice()

  return (
    <div className="space-y-6">
      {/* Tournament Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Inscrição no Torneio
          </CardTitle>
          <CardDescription>
            {tournament.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(tournament.startDate).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{tournament.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Prazo: {new Date(tournament.registrationDeadline).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{tournament.maxParticipants} vagas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Athlete Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Atleta Selecionado</CardTitle>
          <CardDescription>
            Dados do atleta que será inscrito no torneio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {selectedAthlete.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div>
                <h4 className="font-medium text-lg">{selectedAthlete.name}</h4>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{selectedAthlete.age} anos</span>
                  <span>{selectedAthlete.gender === 'male' ? 'Masculino' : 'Feminino'}</span>
                  <span>Rating: {selectedAthlete.currentRating}</span>
                  <span>{selectedAthlete.city}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              <Star className="h-4 w-4 mr-1" />
              {selectedAthlete.playingLevel}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Categorias</CardTitle>
          <CardDescription>
            Escolha as categorias em que o atleta irá competir. O preço é calculado por categoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {eligibleCategories.length === 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este atleta não é elegível para nenhuma categoria deste torneio.
                Verifique idade, gênero e rating.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {eligibleCategories.map(category => {
                const price = categoryPricing[category] || 0
                const isSelected = selectedCategories.includes(category)
                
                return (
                  <div 
                    key={category}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleCategoryToggle(category, !isSelected)}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={(checked) => handleCategoryToggle(category, checked as boolean)}
                      />
                      <div>
                        <h4 className="font-medium">{category}</h4>
                        <p className="text-sm text-muted-foreground">
                          Categoria oficial CBTM
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        R$ {price.toFixed(2)}
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="text-xs">
                          Selecionada
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* All Categories (for reference) */}
          <div className="mt-6">
            <h4 className="font-medium mb-3 text-muted-foreground">Todas as categorias do torneio:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {tournament.categories?.map(category => {
                const isEligible = eligibleCategories.includes(category)
                const price = categoryPricing[category] || 0
                
                return (
                  <div 
                    key={category}
                    className={`p-2 border rounded text-sm ${
                      isEligible ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{category}</div>
                    <div className="text-xs text-muted-foreground">
                      R$ {price.toFixed(2)} • {isEligible ? 'Elegível' : 'Não elegível'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Summary */}
      {selectedCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Resumo da Inscrição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedCategories.map(category => (
                <div key={category} className="flex items-center justify-between">
                  <span>{category}</span>
                  <span className="font-medium">R$ {(categoryPricing[category] || 0).toFixed(2)}</span>
                </div>
              ))}
              
              <Separator />
              
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total a Pagar:</span>
                <span className="text-green-600">R$ {totalPrice.toFixed(2)}</span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {selectedCategories.length} categoria{selectedCategories.length > 1 ? 's' : ''} selecionada{selectedCategories.length > 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Registration Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleRegistration}
          disabled={isLoading || selectedCategories.length === 0}
          size="lg"
          className="min-w-[200px]"
        >
          {isLoading ? (
            'Processando Inscrição...'
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Finalizar Inscrição
              {totalPrice > 0 && (
                <span className="ml-2 font-bold">
                  (R$ {totalPrice.toFixed(2)})
                </span>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}