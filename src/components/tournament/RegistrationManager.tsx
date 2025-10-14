'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Users, UserPlus, UserMinus, Search, Filter, 
  Star, MapPin, Calendar, CheckCircle, AlertCircle, X
} from 'lucide-react'
import { Tournament, PlayingLevel } from '@/lib/types'

interface RegistrationManagerProps {
  tournament: Tournament
  onClose: () => void
  onUpdate: (tournament: Tournament) => void
}

interface TestAthlete {
  id: string
  name: string
  email: string
  phone: string
  birthDate: Date
  playingLevel: PlayingLevel
  dominantHand: string
  playingStyle: string
  currentRating: number
  peakRating: number
  gamesPlayed: number
  wins: number
  losses: number
  cpf: string
  city: string
  bio: string
  gender?: string
  age?: number
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

export function RegistrationManager({ tournament, onClose, onUpdate }: RegistrationManagerProps) {
  const [athletes, setAthletes] = useState<TestAthlete[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Load test athletes and existing registrations
  useEffect(() => {
    loadAthletes()
    loadRegistrations()
  }, [])

  const loadAthletes = () => {
    try {
      // Load from localStorage (where TestDataManager stores them)
      const savedAthletes = localStorage.getItem('test_athletes')
      if (savedAthletes) {
        const parsed = JSON.parse(savedAthletes)
        const athletesWithGenderAge = parsed.map((athlete: any) => ({
          ...athlete,
          birthDate: new Date(athlete.birthDate),
          gender: inferGender(athlete.name),
          age: calculateAge(new Date(athlete.birthDate))
        }))
        setAthletes(athletesWithGenderAge)
      }
    } catch (error) {
      console.error('Error loading athletes:', error)
      setError('Erro ao carregar atletas. Certifique-se de que atletas foram gerados.')
    }
  }

  const loadRegistrations = () => {
    try {
      const savedRegistrations = localStorage.getItem(`registrations_${tournament.id}`)
      if (savedRegistrations) {
        const parsed = JSON.parse(savedRegistrations)
        setRegistrations(parsed.map((reg: any) => ({
          ...reg,
          registeredAt: new Date(reg.registeredAt)
        })))
      }
    } catch (error) {
      console.error('Error loading registrations:', error)
    }
  }

  const saveRegistrations = (newRegistrations: Registration[]) => {
    localStorage.setItem(`registrations_${tournament.id}`, JSON.stringify(newRegistrations))
  }

  const inferGender = (name: string): string => {
    const maleNames = ['João', 'José', 'Carlos', 'Antonio', 'Luiz', 'Paulo', 'Pedro', 'Marcos', 'Raimundo', 'Francisco', 'Daniel', 'Marcelo', 'Bruno', 'Eduardo', 'Felipe', 'Guilherme', 'Rafael', 'Lucas', 'Rodrigo', 'Leandro', 'Diego', 'Gabriel', 'Thiago', 'Ricardo', 'André', 'Matheus', 'Leonardo', 'Alessandro', 'Vinícius', 'Fábio', 'Gustavo', 'Igor']
    const firstName = name.split(' ')[0]
    return maleNames.includes(firstName) ? 'male' : 'female'
  }

  const calculateAge = (birthDate: Date): number => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // MODIFIED: Bypass validations for virtual test athletes
  const validateAthleteForCategory = (athlete: TestAthlete, category: string): boolean => {
    // ✅ BYPASS: If it's a virtual test athlete, allow registration in any category
    if (athlete.id.startsWith('test_athlete_')) {
      return true
    }

    // Keep normal validations for real athletes
    // Validate age for Sub categories
    if (category.includes('Sub-')) {
      const ageLimit = parseInt(category.match(/Sub-(\d+)/)?.[1] || '0')
      if (athlete.age && athlete.age > ageLimit) return false
    }

    // Validate gender
    if (category.includes('Masculino') && athlete.gender !== 'male') return false
    if (category.includes('Feminino') && athlete.gender !== 'female') return false

    // Validate rating for Absoluto categories
    if (category.includes('Absoluto')) {
      const level = category.match(/Absoluto ([A-F])/)?.[1]
      if (level) {
        const ratingRanges: { [key: string]: [number, number] } = {
          'A': [2000, 2400],
          'B': [1600, 1999],
          'C': [1200, 1599],
          'D': [800, 1199],
          'E': [400, 799],
          'F': [0, 399]
        }
        const [min, max] = ratingRanges[level] || [0, 3000]
        if (athlete.currentRating < min || athlete.currentRating > max) return false
      }
    }

    // Validate age for Veterano categories
    if (category.includes('Veterano')) {
      const ageLimit = parseInt(category.match(/Veterano (\d+)\+/)?.[1] || '0')
      if (athlete.age && athlete.age < ageLimit) return false
    }

    return true
  }

  const isAthleteRegistered = (athleteId: string, category: string): boolean => {
    return registrations.some(reg => reg.athleteId === athleteId && reg.category === category)
  }

  const handleRegisterAthlete = (athlete: TestAthlete, category: string) => {
    if (isAthleteRegistered(athlete.id, category)) {
      setError('Atleta já está inscrito nesta categoria')
      return
    }

    if (registrations.length >= tournament.maxParticipants) {
      setError('Torneio já atingiu o número máximo de participantes')
      return
    }

    const newRegistration: Registration = {
      id: `reg_${Date.now()}_${athlete.id}`,
      athleteId: athlete.id,
      athleteName: athlete.name,
      athleteRating: athlete.currentRating,
      athleteLevel: getLevelText(athlete.playingLevel),
      athleteCity: athlete.city,
      category,
      registeredAt: new Date()
    }

    const updatedRegistrations = [...registrations, newRegistration]
    setRegistrations(updatedRegistrations)
    saveRegistrations(updatedRegistrations)
    setMessage(`${athlete.name} inscrito com sucesso na categoria ${category}`)
    setError('')
  }

  const handleUnregisterAthlete = (registration: Registration) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover ${registration.athleteName} da categoria ${registration.category}?`
    )
    
    if (confirmed) {
      const updatedRegistrations = registrations.filter(reg => reg.id !== registration.id)
      setRegistrations(updatedRegistrations)
      saveRegistrations(updatedRegistrations)
      setMessage(`${registration.athleteName} removido da categoria ${registration.category}`)
    }
  }

  const getLevelText = (level: PlayingLevel): string => {
    switch (level) {
      case PlayingLevel.BEGINNER: return 'Iniciante'
      case PlayingLevel.INTERMEDIATE: return 'Intermediário'
      case PlayingLevel.ADVANCED: return 'Avançado'
      case PlayingLevel.PROFESSIONAL: return 'Profissional'
      default: return level
    }
  }

  const getLevelBadgeColor = (level: PlayingLevel): string => {
    switch (level) {
      case PlayingLevel.BEGINNER: return 'bg-gray-100 text-gray-800'
      case PlayingLevel.INTERMEDIATE: return 'bg-blue-100 text-blue-800'
      case PlayingLevel.ADVANCED: return 'bg-green-100 text-green-800'
      case PlayingLevel.PROFESSIONAL: return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter athletes based on selected category, search term, and level filter
  const eligibleAthletes = athletes.filter(athlete => {
    if (selectedCategory && !validateAthleteForCategory(athlete, selectedCategory)) return false
    if (searchTerm && !athlete.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterLevel !== 'all' && athlete.playingLevel !== filterLevel) return false
    return true
  })

  // Get registrations for selected category
  const categoryRegistrations = selectedCategory 
    ? registrations.filter(reg => reg.category === selectedCategory)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Inscrições</h2>
          <p className="text-muted-foreground">{tournament.name}</p>
        </div>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Fechar
        </Button>
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
                <p className="text-sm font-medium">Atletas Disponíveis</p>
                <p className="text-2xl font-bold">{athletes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Inscritos</p>
                <p className="text-2xl font-bold">{registrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Vagas Restantes</p>
                <p className="text-2xl font-bold">{tournament.maxParticipants - registrations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Categorias</p>
                <p className="text-2xl font-bold">{tournament.categories?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Categoria</CardTitle>
          <CardDescription>
            Escolha uma categoria para ver os atletas elegíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {tournament.categories?.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Athletes Management */}
      {selectedCategory && (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Buscar Atleta</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Digite o nome do atleta..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="levelFilter">Filtrar por Nível</Label>
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os níveis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os níveis</SelectItem>
                      <SelectItem value={PlayingLevel.BEGINNER}>Iniciante</SelectItem>
                      <SelectItem value={PlayingLevel.INTERMEDIATE}>Intermediário</SelectItem>
                      <SelectItem value={PlayingLevel.ADVANCED}>Avançado</SelectItem>
                      <SelectItem value={PlayingLevel.PROFESSIONAL}>Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Eligible Athletes */}
          <Card>
            <CardHeader>
              <CardTitle>Atletas Elegíveis - {selectedCategory}</CardTitle>
              <CardDescription>
                {eligibleAthletes.length} atletas podem se inscrever nesta categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {eligibleAthletes.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum atleta elegível</h3>
                    <p className="text-muted-foreground">
                      {athletes.length === 0 
                        ? 'Gere atletas de teste primeiro na aba "Gerar Atletas"'
                        : 'Nenhum atleta atende aos critérios desta categoria'
                      }
                    </p>
                  </div>
                ) : (
                  eligibleAthletes.map(athlete => (
                    <div key={athlete.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{athlete.name}</h4>
                          <Badge className={getLevelBadgeColor(athlete.playingLevel)}>
                            {getLevelText(athlete.playingLevel)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>Rating: {athlete.currentRating}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{athlete.city}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{athlete.age} anos</span>
                          </span>
                          <span>{athlete.wins}V-{athlete.losses}D</span>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleRegisterAthlete(athlete, selectedCategory)}
                        disabled={isAthleteRegistered(athlete.id, selectedCategory)}
                        variant={isAthleteRegistered(athlete.id, selectedCategory) ? "secondary" : "default"}
                      >
                        {isAthleteRegistered(athlete.id, selectedCategory) ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Inscrito
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Inscrever
                          </>
                        )}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Registrations */}
          {categoryRegistrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Inscritos na Categoria - {selectedCategory}</CardTitle>
                <CardDescription>
                  {categoryRegistrations.length} atletas inscritos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryRegistrations.map(registration => (
                    <div key={registration.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{registration.athleteName}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span>Rating: {registration.athleteRating}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{registration.athleteCity}</span>
                          </span>
                          <span>Nível: {registration.athleteLevel}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleUnregisterAthlete(registration)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* All Registrations Summary */}
      {registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Todas as Inscrições</CardTitle>
            <CardDescription>
              {registrations.length} de {tournament.maxParticipants} vagas preenchidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Group registrations by category */}
              {tournament.categories?.map(category => {
                const categoryRegs = registrations.filter(reg => reg.category === category)
                if (categoryRegs.length === 0) return null
                
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{category}</h4>
                      <Badge variant="outline">{categoryRegs.length} inscritos</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-4">
                      {categoryRegs.map(reg => (
                        <div key={reg.id} className="text-sm p-2 border rounded">
                          <div className="font-medium">{reg.athleteName}</div>
                          <div className="text-muted-foreground">Rating: {reg.athleteRating}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}