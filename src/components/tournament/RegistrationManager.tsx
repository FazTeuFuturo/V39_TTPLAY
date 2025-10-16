'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, UserPlus, UserMinus, Search, Filter, 
  Star, MapPin, Calendar, CheckCircle, AlertCircle, X
} from 'lucide-react'
import { supabase } from '@/lib/supabase' // <<< 1. Importado o Supabase

// Tipos ajustados para refletir a estrutura do banco de dados
interface Category {
  id: string
  name: string
  price: number
  // Adicione outros campos da categoria se precisar para validação
  gender?: string
  age_min?: number
  age_max?: number
  rating_min?: number
  rating_max?: number
}

interface Tournament {
  id: string
  name: string
  maxParticipants: number
  categories?: Category[] // <<< 2. Alterado de string[] para um objeto de Categoria
}

interface Athlete {
  id: string
  name: string
  birth_date: string // Mantido como string, mas convertido para Date no uso
  playing_level: string
  current_rating: number
  city: string
  gender: string
  // Adicione outros campos se necessário
  wins: number
  losses: number
  age?: number // Campo calculado
}

interface Registration {
  id: string // ID da tabela registration_categories para remoção
  registration_id: string // ID da tabela tournament_registrations
  athlete_id: string
  category_id: string
  category_name: string
  athlete_name: string
  athlete_rating: number
  athlete_city: string
  athlete_level: string
}

interface RegistrationManagerProps {
  tournament: Tournament
  onClose: () => void
  onUpdate: (tournament: Tournament) => void
}

export function RegistrationManager({ tournament, onClose, onUpdate }: RegistrationManagerProps) {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Função para buscar todos os dados iniciais do Supabase
    const fetchData = async () => {
      setIsLoading(true)
      setError('')
      await Promise.all([
        loadAthletes(),
        loadRegistrations()
      ]).catch(err => {
        setError('Falha ao carregar dados iniciais.')
        console.error(err)
      })
      setIsLoading(false)
    }
    
    if (tournament.id) {
      fetchData()
    }
  }, [tournament.id])

  // <<< 3. Função reescrita para usar Supabase
  const loadAthletes = async () => {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_athletes')
        .select('id, name, birth_date, playing_level, current_rating, city, gender, wins, losses')

      if (error) throw error

      const athletesWithAge = data.map(athlete => ({
        ...athlete,
        age: calculateAge(new Date(athlete.birth_date))
      }))
      setAthletes(athletesWithAge)
    } catch (err) {
      console.error('Error loading athletes:', err)
      setError('Erro ao carregar atletas do banco de dados.')
    }
  }

  // <<< 4. Função reescrita para usar Supabase com joins
  const loadRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_registration_categories')
        .select(`
          id,
          registration_id,
          category_id,
          app_5732e5c77b_categories ( name ),
          app_5732e5c77b_tournament_registrations (
            athlete_id,
            tournament_id,
            app_5732e5c77b_athletes (
              name,
              current_rating,
              city,
              playing_level
            )
          )
        `)
        .eq('app_5732e5c77b_tournament_registrations.tournament_id', tournament.id)

      if (error) throw error
      
      const formattedRegistrations = data.map((reg: any) => ({
        id: reg.id,
        registration_id: reg.registration_id,
        athlete_id: reg.app_5732e5c77b_tournament_registrations.athlete_id,
        category_id: reg.category_id,
        category_name: reg.app_5732e5c77b_categories.name,
        athlete_name: reg.app_5732e5c77b_tournament_registrations.app_5732e5c77b_athletes.name,
        athlete_rating: reg.app_5732e5c77b_tournament_registrations.app_5732e5c77b_athletes.current_rating,
        athlete_city: reg.app_5732e5c77b_tournament_registrations.app_5732e5c77b_athletes.city,
        athlete_level: reg.app_5732e5c77b_tournament_registrations.app_5732e5c77b_athletes.playing_level,
      }))

      setRegistrations(formattedRegistrations)
    } catch (err) {
      console.error('Error loading registrations:', err)
      setError('Erro ao carregar inscrições do banco de dados.')
    }
  }

  const calculateAge = (birthDate: Date): number => {
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }
  
  // As validações agora podem ser mais robustas com os dados da categoria
  const validateAthleteForCategory = (athlete: Athlete, category?: Category): boolean => {
    if (!category) return false;
    
    // Validar gênero
    if (category.gender && category.gender !== 'mixed' && category.gender !== athlete.gender) return false;

    // Validar idade
    if (athlete.age) {
        if (category.age_min && athlete.age < category.age_min) return false;
        if (category.age_max && athlete.age > category.age_max) return false;
    }
    
    // Validar rating
    if (category.rating_min && athlete.current_rating < category.rating_min) return false;
    if (category.rating_max && athlete.current_rating > category.rating_max) return false;

    return true
  }

  const isAthleteRegistered = (athleteId: string, categoryId: string): boolean => {
    return registrations.some(reg => reg.athlete_id === athleteId && reg.category_id === categoryId)
  }
  
  // <<< 5. Função reescrita para inserir no Supabase
  const handleRegisterAthlete = async (athlete: Athlete, categoryId: string) => {
    setIsSubmitting(true)
    setError('')
    setMessage('')
    const category = tournament.categories?.find(c => c.id === categoryId)

    try {
      // 1. Encontrar ou criar a inscrição principal do atleta no torneio
      let { data: registration } = await supabase
        .from('app_5732e5c77b_tournament_registrations')
        .select('id')
        .eq('tournament_id', tournament.id)
        .eq('athlete_id', athlete.id)
        .single()

      if (!registration) {
        const { data: newRegistration, error: createError } = await supabase
          .from('app_5732e5c77b_tournament_registrations')
          .insert({ tournament_id: tournament.id, athlete_id: athlete.id, status: 'registered' })
          .select('id')
          .single()
        if (createError) throw createError
        registration = newRegistration
      }

      // 2. Adicionar a categoria a essa inscrição
      const { error: catError } = await supabase
        .from('app_5732e5c77b_registration_categories')
        .insert({
          registration_id: registration.id,
          category_id: categoryId,
          price_paid: category?.price || 0 // Pega o preço da categoria
        })
      if (catError) throw catError

      setMessage(`${athlete.name} inscrito com sucesso em ${category?.name}!`)
      await loadRegistrations() // Recarrega a lista para atualizar a UI

    } catch (err: any) {
      console.error('Error registering athlete:', err)
      setError(err.message || 'Erro ao inscrever atleta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // <<< 6. Função reescrita para deletar do Supabase
  const handleUnregisterAthlete = async (registration: Registration) => {
    const confirmed = window.confirm(`Remover ${registration.athlete_name} da categoria ${registration.category_name}?`)
    if (confirmed) {
      setIsSubmitting(true)
      try {
        const { error } = await supabase
          .from('app_5732e5c77b_registration_categories')
          .delete()
          .eq('id', registration.id) // Deleta pelo ID único da relação
        
        if (error) throw error

        setMessage(`${registration.athlete_name} removido com sucesso.`)
        await loadRegistrations() // Recarrega para atualizar a UI
      } catch (err: any) {
        setError(err.message || 'Erro ao remover inscrição.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const getLevelText = (level: string): string => {
    const levels: { [key: string]: string } = {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado',
      professional: 'Profissional'
    }
    return levels[level] || level
  }
  
  // ... (getLevelBadgeColor pode ser mantida como está)

  const selectedCategory = tournament.categories?.find(c => c.id === selectedCategoryId)

  const eligibleAthletes = athletes.filter(athlete => {
    if (!selectedCategoryId) return false;
    if (!validateAthleteForCategory(athlete, selectedCategory)) return false
    if (searchTerm && !athlete.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterLevel !== 'all' && athlete.playing_level !== filterLevel) return false
    return true
  })

  const categoryRegistrations = registrations.filter(reg => reg.category_id === selectedCategoryId)
  
  if (isLoading) {
    return <div>Carregando gerenciador de inscrições...</div>
  }

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
        <Alert className="border-green-200 bg-green-50" onClick={() => setMessage('')}>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" onClick={() => setError('')}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Atletas na Base</p>
            <p className="text-2xl font-bold">{athletes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Inscrições Totais</p>
            <p className="text-2xl font-bold">{registrations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Vagas Restantes</p>
            <p className="text-2xl font-bold">{Math.max(0, tournament.maxParticipants - registrations.length)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-muted-foreground">Categorias</p>
            <p className="text-2xl font-bold">{tournament.categories?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>1. Selecionar Categoria</CardTitle>
          <CardDescription>Escolha uma categoria para ver os atletas elegíveis e gerenciar inscrições.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma categoria..." />
            </SelectTrigger>
            <SelectContent>
              {tournament.categories?.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Athletes Management */}
      {selectedCategoryId && (
        <>
          {/* Filters and Eligible Athletes */}
          <Card>
            <CardHeader>
              <CardTitle>2. Inscrever Atletas Elegíveis</CardTitle>
              <CardDescription>
                Filtre e inscreva atletas que cumprem os requisitos para: <span className="font-bold">{selectedCategory?.name}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Buscar atleta por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os níveis</SelectItem>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                    <SelectItem value="professional">Profissional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Eligible Athletes List */}
              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-2">
                {eligibleAthletes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum atleta elegível encontrado com os filtros atuais.</p>
                  </div>
                ) : (
                  eligibleAthletes.map(athlete => {
                    const isRegistered = isAthleteRegistered(athlete.id, selectedCategoryId);
                    return (
                      <div key={athlete.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{athlete.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Rating: {athlete.current_rating}</span>
                            <span>{athlete.city}</span>
                            <span>{athlete.age} anos</span>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleRegisterAthlete(athlete, selectedCategoryId)}
                          disabled={isRegistered || isSubmitting}
                          variant={isRegistered ? "secondary" : "default"}
                        >
                          {isRegistered ? 'Inscrito' : (isSubmitting ? 'Inscrevendo...' : 'Inscrever')}
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Category Registrations List */}
          {categoryRegistrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>3. Inscritos em {selectedCategory?.name}</CardTitle>
                <CardDescription>{categoryRegistrations.length} atleta(s) nesta categoria.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryRegistrations.map(registration => (
                    <div key={registration.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{registration.athlete_name}</h4>
                        <span className="text-sm text-muted-foreground">Rating: {registration.athlete_rating}</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleUnregisterAthlete(registration)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Removendo...' : 'Remover'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}