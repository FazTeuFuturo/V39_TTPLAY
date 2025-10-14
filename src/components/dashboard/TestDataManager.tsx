'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Database, Users, Trophy, CheckCircle, AlertCircle, 
  User, Calendar, MapPin, Phone, Mail, Star, RefreshCw
} from 'lucide-react'
import { PlayingLevel, DominantHand, PlayingStyle } from '@/lib/types'

interface TestAthlete {
  id: string
  name: string
  email: string
  phone: string
  birthDate: Date
  playingLevel: PlayingLevel
  dominantHand: DominantHand
  playingStyle: PlayingStyle
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

export function TestDataManager() {
  const [athleteCount, setAthleteCount] = useState(100)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAthletes, setGeneratedAthletes] = useState<TestAthlete[]>([])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // MODIFIED: Separate male and female names for controlled gender distribution
  const maleNames = [
    'João', 'José', 'Carlos', 'Antonio', 'Luiz', 'Paulo', 'Pedro', 'Marcos',
    'Raimundo', 'Francisco', 'Daniel', 'Marcelo', 'Bruno', 'Eduardo', 'Felipe',
    'Guilherme', 'Rafael', 'Lucas', 'Rodrigo', 'Leandro', 'Diego', 'Gabriel',
    'Thiago', 'Ricardo', 'André', 'Matheus', 'Leonardo', 'Alessandro', 'Vinícius',
    'Fábio', 'Gustavo', 'Igor', 'Caio', 'Henrique', 'Renato', 'Sérgio', 'Márcio'
  ]

  const femaleNames = [
    'Maria', 'Ana', 'Francisca', 'Antonia', 'Fernanda', 'Adriana', 'Juliana',
    'Marcia', 'Aline', 'Sandra', 'Cristiane', 'Patrícia', 'Camila', 'Luciana',
    'Carla', 'Renata', 'Andréa', 'Simone', 'Eliane', 'Vanessa', 'Priscila',
    'Mônica', 'Débora', 'Tatiana', 'Silvia', 'Rosana', 'Denise', 'Karina',
    'Sabrina', 'Roberta', 'Claudia', 'Michele', 'Beatriz', 'Amanda', 'Larissa'
  ]

  const lastNames = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
    'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
    'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Monteiro', 'Cardoso',
    'Reis', 'Araújo', 'Nascimento', 'Freitas', 'Campos', 'Miranda', 'Correia', 'Teixeira',
    'Machado', 'Pinto', 'Mendes', 'Moreira', 'Cavalcanti', 'Ramos', 'Nunes', 'Castro'
  ]

  const cities = [
    'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte',
    'Manaus', 'Curitiba', 'Recife', 'Goiânia', 'Belém', 'Porto Alegre', 'Guarulhos',
    'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal', 'Teresina',
    'Campo Grande', 'Nova Iguaçu', 'São Bernardo do Campo', 'João Pessoa', 'Santo André',
    'Osasco', 'Jaboatão dos Guararapes', 'São José dos Campos', 'Ribeirão Preto', 'Uberlândia'
  ]

  // MODIFIED: Strategic age generation to cover all categories
  const generateAge = (): number => {
    const ageDistribution = [
      ...Array(8).fill(16), // Sub-19 (15-19 anos)
      ...Array(8).fill(17), 
      ...Array(8).fill(18),
      ...Array(15).fill(25), // Absoluto adulto (20-39 anos)
      ...Array(15).fill(30),
      ...Array(15).fill(35),
      ...Array(10).fill(42), // Veterano 40+ (40-54 anos)
      ...Array(10).fill(47),
      ...Array(10).fill(52),
      ...Array(6).fill(57),  // Veterano 55+ (55-65 anos)
      ...Array(5).fill(62)
    ]
    return ageDistribution[Math.floor(Math.random() * ageDistribution.length)]
  }

  // MODIFIED: Strategic rating generation to cover all Absoluto categories
  const generateRating = (): number => {
    const ratingDistribution = [
      ...Array(6).fill([400, 799]),   // Absoluto E-F
      ...Array(8).fill([800, 1199]),  // Absoluto D
      ...Array(12).fill([1200, 1599]), // Absoluto C
      ...Array(10).fill([1600, 1999]), // Absoluto B
      ...Array(8).fill([2000, 2400])  // Absoluto A
    ]
    const [min, max] = ratingDistribution[Math.floor(Math.random() * ratingDistribution.length)]
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // MODIFIED: Balanced gender generation
  const generateGender = (): string => {
    return Math.random() > 0.5 ? 'male' : 'female'
  }

  const generateCPF = (): string => {
    const randomDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
    
    // Calculate first verification digit
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += randomDigits[i] * (10 - i)
    }
    let firstDigit = 11 - (sum % 11)
    if (firstDigit >= 10) firstDigit = 0
    
    // Calculate second verification digit
    sum = 0
    for (let i = 0; i < 9; i++) {
      sum += randomDigits[i] * (11 - i)
    }
    sum += firstDigit * 2
    let secondDigit = 11 - (sum % 11)
    if (secondDigit >= 10) secondDigit = 0
    
    const cpf = [...randomDigits, firstDigit, secondDigit]
    return cpf.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const generatePhone = (): string => {
    const ddd = Math.floor(Math.random() * 90) + 11 // DDD between 11-99
    const number = Math.floor(Math.random() * 900000000) + 100000000 // 9 digits
    return `(${ddd}) 9${number.toString().substring(0, 4)}-${number.toString().substring(4, 8)}`
  }

  const generateBio = (name: string, level: PlayingLevel): string => {
    const bios = {
      [PlayingLevel.BEGINNER]: [
        `${name} começou a jogar tênis de mesa recentemente e está animado para aprender mais sobre o esporte.`,
        `Novo no tênis de mesa, ${name} está focado em desenvolver os fundamentos básicos do jogo.`,
        `${name} descobriu o tênis de mesa há pouco tempo e já se apaixonou pelo esporte.`
      ],
      [PlayingLevel.INTERMEDIATE]: [
        `${name} joga tênis de mesa há alguns anos e está sempre buscando melhorar sua técnica.`,
        `Com experiência intermediária, ${name} participa regularmente de torneios locais.`,
        `${name} tem um bom domínio dos fundamentos e está trabalhando em estratégias mais avançadas.`
      ],
      [PlayingLevel.ADVANCED]: [
        `${name} é um jogador experiente com anos de prática e várias vitórias em competições.`,
        `Atleta avançado, ${name} é conhecido por sua técnica refinada e estratégia inteligente.`,
        `${name} compete em nível estadual e é respeitado pela comunidade do tênis de mesa.`
      ],
      [PlayingLevel.PROFESSIONAL]: [
        `${name} é um atleta profissional com participações em campeonatos nacionais.`,
        `Profissional dedicado, ${name} treina diariamente e compete em alto nível.`,
        `${name} representa seu estado em competições nacionais e tem patrocínio esportivo.`
      ]
    }
    
    const levelBios = bios[level]
    return levelBios[Math.floor(Math.random() * levelBios.length)]
  }

  const generateTestAthletes = (count: number): TestAthlete[] => {
    const athletes: TestAthlete[] = []
    
    for (let i = 0; i < count; i++) {
      // MODIFIED: Generate gender first, then select appropriate name
      const gender = generateGender()
      const firstName = gender === 'male' 
        ? maleNames[Math.floor(Math.random() * maleNames.length)]
        : femaleNames[Math.floor(Math.random() * femaleNames.length)]
      
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const name = `${firstName} ${lastName}`
      
      // MODIFIED: Strategic age and rating generation
      const age = generateAge()
      const currentRating = generateRating()
      
      // Level based on rating (for consistency)
      let level: PlayingLevel
      if (currentRating >= 1800) {
        level = PlayingLevel.PROFESSIONAL
      } else if (currentRating >= 1400) {
        level = PlayingLevel.ADVANCED
      } else if (currentRating >= 1000) {
        level = PlayingLevel.INTERMEDIATE
      } else {
        level = PlayingLevel.BEGINNER
      }
      
      const gamesPlayed = Math.floor(Math.random() * 200) + 10
      const winRate = Math.random() * 0.4 + 0.3 // 30-70% win rate
      const wins = Math.floor(gamesPlayed * winRate)
      const losses = gamesPlayed - wins
      
      const peakRating = currentRating + Math.floor(Math.random() * 200)
      
      // MODIFIED: Calculate birth date from age
      const currentYear = new Date().getFullYear()
      const birthYear = currentYear - age
      const birthDate = new Date(
        birthYear,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      )
      
      const athlete: TestAthlete = {
        id: `test_athlete_${i + 1}`,
        name,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        phone: generatePhone(),
        birthDate,
        playingLevel: level,
        dominantHand: Object.values(DominantHand)[Math.floor(Math.random() * Object.values(DominantHand).length)],
        playingStyle: Object.values(PlayingStyle)[Math.floor(Math.random() * Object.values(PlayingStyle).length)],
        currentRating,
        peakRating,
        gamesPlayed,
        wins,
        losses,
        cpf: generateCPF(),
        city: cities[Math.floor(Math.random() * cities.length)],
        bio: generateBio(firstName, level),
        gender, // ADDED: Include gender for registration validation
        age // ADDED: Include age for registration validation
      }
      
      athletes.push(athlete)
    }
    
    // Sort by rating (highest first)
    return athletes.sort((a, b) => b.currentRating - a.currentRating)
  }

  const handleGenerateAthletes = async () => {
    if (athleteCount < 1 || athleteCount > 1000) {
      setError('A quantidade deve estar entre 1 e 1000 atletas')
      return
    }

    setIsGenerating(true)
    setError('')
    setSuccess('')
    
    try {
      console.log(`🔵 GENERATING ${athleteCount} TEST ATHLETES FOR ALL CATEGORIES...`)
      
      const athletes = generateTestAthletes(athleteCount)
      setGeneratedAthletes(athletes)
      
      // FIXED: Save to localStorage with correct key for RegistrationManager
      localStorage.setItem('test_athletes', JSON.stringify(athletes))
      console.log('🔵 ATHLETES SAVED TO LOCALSTORAGE:', athletes.length)
      console.log('🔵 SAMPLE ATHLETE:', athletes[0])
      
      // Log category distribution for verification
      const maleCount = athletes.filter(a => a.gender === 'male').length
      const femaleCount = athletes.filter(a => a.gender === 'female').length
      const youngCount = athletes.filter(a => a.age && a.age <= 19).length
      const veteranCount = athletes.filter(a => a.age && a.age >= 40).length
      const highRatingCount = athletes.filter(a => a.currentRating >= 2000).length
      
      console.log('🔵 CATEGORY DISTRIBUTION:')
      console.log(`- Masculino: ${maleCount}, Feminino: ${femaleCount}`)
      console.log(`- Sub-19: ${youngCount}, Veterano 40+: ${veteranCount}`)
      console.log(`- Rating 2000+: ${highRatingCount}`)
      
      setSuccess(`${athleteCount} atletas de teste gerados e salvos com sucesso! Distribuição estratégica para todas as categorias.`)
      
    } catch (error) {
      console.error('🔴 ERROR GENERATING ATHLETES:', error)
      setError('Erro ao gerar atletas de teste. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClearAthletes = () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja limpar todos os atletas de teste?\n\nEsta ação não pode ser desfeita.'
    )
    
    if (confirmed) {
      localStorage.removeItem('test_athletes')
      setGeneratedAthletes([])
      setSuccess('')
      setError('')
      console.log('🔴 ATHLETES CLEARED FROM LOCALSTORAGE')
    }
  }

  const loadExistingAthletes = () => {
    try {
      const savedAthletes = localStorage.getItem('test_athletes')
      if (savedAthletes) {
        const parsed = JSON.parse(savedAthletes)
        const athletesWithGenderAge = parsed.map((athlete: any) => ({
          ...athlete,
          birthDate: new Date(athlete.birthDate),
          gender: athlete.gender || (athlete.name.split(' ')[0].includes('João') ? 'male' : 'female'),
          age: athlete.age || Math.floor((new Date().getTime() - new Date(athlete.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        }))
        setGeneratedAthletes(athletesWithGenderAge)
        console.log('🔵 LOADED EXISTING ATHLETES:', athletesWithGenderAge.length)
      }
    } catch (error) {
      console.error('🔴 ERROR LOADING EXISTING ATHLETES:', error)
    }
  }

  // Load existing athletes on component mount
  useEffect(() => {
    loadExistingAthletes()
  }, [])

  const getLevelBadgeColor = (level: PlayingLevel) => {
    switch (level) {
      case PlayingLevel.BEGINNER:
        return 'bg-gray-100 text-gray-800'
      case PlayingLevel.INTERMEDIATE:
        return 'bg-blue-100 text-blue-800'
      case PlayingLevel.ADVANCED:
        return 'bg-green-100 text-green-800'
      case PlayingLevel.PROFESSIONAL:
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelText = (level: PlayingLevel) => {
    switch (level) {
      case PlayingLevel.BEGINNER:
        return 'Iniciante'
      case PlayingLevel.INTERMEDIATE:
        return 'Intermediário'
      case PlayingLevel.ADVANCED:
        return 'Avançado'
      case PlayingLevel.PROFESSIONAL:
        return 'Profissional'
      default:
        return level
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Gerador de Atletas de Teste
          </CardTitle>
          <CardDescription>
            Gere atletas fictícios estratégicos para testar TODAS as categorias de torneios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-end space-x-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="athleteCount">Quantidade de Atletas</Label>
              <Input
                id="athleteCount"
                type="number"
                value={athleteCount}
                onChange={(e) => setAthleteCount(parseInt(e.target.value) || 100)}
                placeholder="100"
                min="1"
                max="1000"
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Entre 1 e 1000 atletas (recomendado: 50-200 para cobertura completa)
              </p>
            </div>
            
            <Button 
              onClick={handleGenerateAthletes}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Gerar Atletas
                </>
              )}
            </Button>

            <Button 
              onClick={loadExistingAthletes}
              disabled={isGenerating}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar
            </Button>

            {generatedAthletes.length > 0 && (
              <Button 
                onClick={handleClearAthletes}
                disabled={isGenerating}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                Limpar Dados
              </Button>
            )}
          </div>

          {generatedAthletes.length > 0 && (
            <>
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Atletas Gerados</h3>
                  <Badge variant="secondary">
                    {generatedAthletes.length} atletas
                  </Badge>
                </div>
                
                {/* Category Coverage Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 border rounded">
                    <Badge className="bg-blue-100 text-blue-800">Masculino</Badge>
                    <p className="text-2xl font-bold mt-1">
                      {generatedAthletes.filter(a => a.gender === 'male').length}
                    </p>
                    <p className="text-xs text-muted-foreground">atletas</p>
                  </div>
                  
                  <div className="text-center p-3 border rounded">
                    <Badge className="bg-pink-100 text-pink-800">Feminino</Badge>
                    <p className="text-2xl font-bold mt-1">
                      {generatedAthletes.filter(a => a.gender === 'female').length}
                    </p>
                    <p className="text-xs text-muted-foreground">atletas</p>
                  </div>
                  
                  <div className="text-center p-3 border rounded">
                    <Badge className="bg-green-100 text-green-800">Sub-19</Badge>
                    <p className="text-2xl font-bold mt-1">
                      {generatedAthletes.filter(a => a.age && a.age <= 19).length}
                    </p>
                    <p className="text-xs text-muted-foreground">jovens</p>
                  </div>
                  
                  <div className="text-center p-3 border rounded">
                    <Badge className="bg-orange-100 text-orange-800">Veterano 40+</Badge>
                    <p className="text-2xl font-bold mt-1">
                      {generatedAthletes.filter(a => a.age && a.age >= 40).length}
                    </p>
                    <p className="text-xs text-muted-foreground">veteranos</p>
                  </div>
                  
                  <div className="text-center p-3 border rounded">
                    <Badge className="bg-purple-100 text-purple-800">Rating 2000+</Badge>
                    <p className="text-2xl font-bold mt-1">
                      {generatedAthletes.filter(a => a.currentRating >= 2000).length}
                    </p>
                    <p className="text-xs text-muted-foreground">elite</p>
                  </div>
                  
                  <div className="text-center p-3 border rounded">
                    <Badge className="bg-gray-100 text-gray-800">Rating 800-1199</Badge>
                    <p className="text-2xl font-bold mt-1">
                      {generatedAthletes.filter(a => a.currentRating >= 800 && a.currentRating <= 1199).length}
                    </p>
                    <p className="text-xs text-muted-foreground">categoria D</p>
                  </div>
                </div>
                
                {/* Sample Athletes */}
                <div className="space-y-2">
                  <h4 className="font-medium">Primeiros 10 Atletas (por rating):</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {generatedAthletes.slice(0, 10).map((athlete, index) => (
                      <div key={athlete.id} className="flex items-center justify-between p-3 border rounded text-sm">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{athlete.name}</p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3" />
                                {athlete.city}
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                {athlete.age} anos
                              </span>
                              <span className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                {athlete.gender === 'male' ? 'M' : 'F'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getLevelBadgeColor(athlete.playingLevel)}>
                            {getLevelText(athlete.playingLevel)}
                          </Badge>
                          <div className="text-right">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="font-bold">{athlete.currentRating}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {athlete.wins}V-{athlete.losses}D
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {generatedAthletes.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center">
                      ... e mais {generatedAthletes.length - 10} atletas
                    </p>
                  )}
                </div>

                {/* Integration Status */}
                <Alert className="border-blue-200 bg-blue-50">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>✅ Integração Ativa:</strong> Os atletas gerados cobrem TODAS as categorias possíveis. 
                    Vá para "Meus Torneios" → "Gerenciar Inscrições" para testá-los em qualquer categoria.
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}