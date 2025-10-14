import { UserType } from './types'

export interface TestAthlete {
  id: string
  name: string
  email: string
  cpf: string
  birthDate: string
  age: number
  gender: 'male' | 'female'
  currentRating: number
  peakRating: number
  gamesPlayed: number
  wins: number
  losses: number
  playingLevel: string
  dominantHand: 'right' | 'left'
  playingStyle: string
  city: string
  clubName?: string
  bio: string
}

const BRAZILIAN_MALE_NAMES = [
  'João Silva', 'Pedro Santos', 'Carlos Oliveira', 'Rafael Costa', 'Lucas Ferreira',
  'Gabriel Souza', 'Bruno Lima', 'Mateus Alves', 'Felipe Rodrigues', 'André Martins',
  'Diego Pereira', 'Thiago Barbosa', 'Marcos Ribeiro', 'Vinicius Carvalho', 'Leonardo Araújo',
  'Gustavo Mendes', 'Ricardo Nascimento', 'Fernando Cardoso', 'Rodrigo Dias', 'Juliano Moreira',
  'Alexandre Ramos', 'Fabio Correia', 'Marcelo Teixeira', 'Roberto Gomes', 'Sergio Castro',
  'Daniel Rocha', 'Renato Nunes', 'Paulo Freitas', 'Edson Monteiro', 'Claudio Pinto',
  'Antonio Lopes', 'José Medeiros', 'Francisco Campos', 'Luiz Vieira', 'Eduardo Cunha',
  'Caio Melo', 'Igor Fonseca', 'Henrique Batista', 'Leandro Machado', 'Otavio Reis',
  'Samuel Azevedo', 'Murilo Caldeira', 'Nicolas Tavares', 'Arthur Moura', 'Enzo Duarte',
  'Davi Barros', 'Miguel Torres', 'Benjamin Nogueira', 'Heitor Siqueira', 'Theo Paiva'
]

const BRAZILIAN_FEMALE_NAMES = [
  'Maria Silva', 'Ana Santos', 'Carla Oliveira', 'Rafaela Costa', 'Lucia Ferreira',
  'Gabriela Souza', 'Bruna Lima', 'Matilde Alves', 'Fernanda Rodrigues', 'Andrea Martins',
  'Diana Pereira', 'Thais Barbosa', 'Marcia Ribeiro', 'Viviane Carvalho', 'Leticia Araújo',
  'Gustava Mendes', 'Rita Nascimento', 'Fabiana Cardoso', 'Roberta Dias', 'Juliana Moreira',
  'Alexandra Ramos', 'Flávia Correia', 'Marcela Teixeira', 'Roberta Gomes', 'Silvia Castro',
  'Daniela Rocha', 'Renata Nunes', 'Paula Freitas', 'Edna Monteiro', 'Claudia Pinto',
  'Antonia Lopes', 'Josefa Medeiros', 'Francisca Campos', 'Luiza Vieira', 'Eduarda Cunha',
  'Camila Melo', 'Ingrid Fonseca', 'Helena Batista', 'Leandra Machado', 'Otávia Reis',
  'Samara Azevedo', 'Muriele Caldeira', 'Nicole Tavares', 'Alice Moura', 'Emanuela Duarte',
  'Dara Barros', 'Mila Torres', 'Beatriz Nogueira', 'Heloisa Siqueira', 'Teodora Paiva'
]

const BRAZILIAN_CITIES = [
  'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador',
  'Fortaleza', 'Curitiba', 'Recife', 'Porto Alegre', 'Goiânia',
  'Belém', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo',
  'Maceió', 'Duque de Caxias', 'Natal', 'Teresina', 'Campo Grande',
  'Nova Iguaçu', 'São Bernardo do Campo', 'João Pessoa', 'Santo André',
  'Osasco', 'Jaboatão dos Guararapes', 'São José dos Campos', 'Ribeirão Preto',
  'Uberlândia', 'Sorocaba', 'Contagem', 'Aracaju', 'Feira de Santana',
  'Cuiabá', 'Joinville', 'Juiz de Fora', 'Londrina', 'Aparecida de Goiânia',
  'Niterói', 'Ananindeua', 'Belford Roxo', 'Caxias do Sul', 'Campos dos Goytacazes'
]

const CLUB_NAMES = [
  'Clube Atlético Mineiro TM', 'Flamengo Tênis de Mesa', 'São Paulo FC TM', 'Palmeiras TM',
  'Grêmio Tênis de Mesa', 'Internacional TM', 'Santos FC TM', 'Corinthians TM',
  'Vasco da Gama TM', 'Botafogo TM', 'Cruzeiro TM', 'Atlético Paranaense TM',
  'Fluminense TM', 'Bahia TM', 'Sport Recife TM', 'Ceará TM',
  'Fortaleza TM', 'Goiás TM', 'Coritiba TM', 'Athletico-PR TM',
  'Associação Tênis de Mesa SP', 'Centro Olímpico TM', 'Academia Champions',
  'Instituto Ping Pong', 'Clube dos Campeões', 'Mesa Redonda TM',
  'Raquete de Ouro', 'Spin Masters', 'Top Spin Club', 'Ace Tênis de Mesa'
]

const PLAYING_STYLES = [
  'Ofensivo', 'Defensivo', 'All-round', 'Contra-atacante', 'Bloqueador',
  'Atacante de forehand', 'Atacante de backhand', 'Jogador de meio da mesa',
  'Jogador próximo à mesa', 'Especialista em top spin'
]

function generateCPF(): string {
  const numbers = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  
  // Calculate first digit
  let sum = numbers.reduce((acc, num, index) => acc + num * (10 - index), 0)
  let digit1 = 11 - (sum % 11)
  if (digit1 > 9) digit1 = 0
  
  // Calculate second digit
  numbers.push(digit1)
  sum = numbers.reduce((acc, num, index) => acc + num * (11 - index), 0)
  let digit2 = 11 - (sum % 11)
  if (digit2 > 9) digit2 = 0
  
  numbers.push(digit2)
  
  return numbers.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

function generateBirthDate(minAge: number, maxAge: number): { birthDate: string; age: number } {
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge
  const currentYear = new Date().getFullYear()
  const birthYear = currentYear - age
  const month = Math.floor(Math.random() * 12) + 1
  const day = Math.floor(Math.random() * 28) + 1
  
  return {
    birthDate: `${birthYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
    age
  }
}

function generateRating(age: number, gender: 'male' | 'female'): { current: number; peak: number; level: string } {
  let baseRating: number
  
  // Age-based rating distribution
  if (age < 15) {
    baseRating = 800 + Math.random() * 600 // 800-1400
  } else if (age < 25) {
    baseRating = 1000 + Math.random() * 800 // 1000-1800
  } else if (age < 35) {
    baseRating = 1200 + Math.random() * 1000 // 1200-2200
  } else if (age < 50) {
    baseRating = 1100 + Math.random() * 900 // 1100-2000
  } else {
    baseRating = 900 + Math.random() * 700 // 900-1600
  }
  
  // Gender adjustment (statistical difference)
  if (gender === 'female') {
    baseRating *= 0.9
  }
  
  const currentRating = Math.round(baseRating)
  const peakRating = Math.round(currentRating + Math.random() * 200)
  
  let level: string
  if (currentRating < 1000) level = 'Iniciante'
  else if (currentRating < 1400) level = 'Intermediário'
  else if (currentRating < 1800) level = 'Avançado'
  else if (currentRating < 2200) level = 'Expert'
  else level = 'Profissional'
  
  return { current: currentRating, peak: peakRating, level }
}

function generateMatchHistory(rating: number): { games: number; wins: number; losses: number } {
  const gamesPlayed = Math.floor(Math.random() * 200) + 50
  const winRate = Math.min(0.8, Math.max(0.3, (rating - 800) / 1600 + Math.random() * 0.2))
  const wins = Math.floor(gamesPlayed * winRate)
  const losses = gamesPlayed - wins
  
  return { games: gamesPlayed, wins, losses }
}

export function generateTestAthletes(count: number = 100): TestAthlete[] {
  const athletes: TestAthlete[] = []
  
  for (let i = 0; i < count; i++) {
    const gender = Math.random() > 0.3 ? 'male' : 'female' // 70% male, 30% female (realistic distribution)
    const names = gender === 'male' ? BRAZILIAN_MALE_NAMES : BRAZILIAN_FEMALE_NAMES
    const name = names[Math.floor(Math.random() * names.length)]
    
    const { birthDate, age } = generateBirthDate(8, 75)
    const { current: currentRating, peak: peakRating, level } = generateRating(age, gender)
    const { games: gamesPlayed, wins, losses } = generateMatchHistory(currentRating)
    
    const athlete: TestAthlete = {
      id: `test_athlete_${i + 1}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}${i + 1}@teste.com`,
      cpf: generateCPF(),
      birthDate,
      age,
      gender,
      currentRating,
      peakRating,
      gamesPlayed,
      wins,
      losses,
      playingLevel: level,
      dominantHand: Math.random() > 0.1 ? 'right' : 'left', // 90% right-handed
      playingStyle: PLAYING_STYLES[Math.floor(Math.random() * PLAYING_STYLES.length)],
      city: BRAZILIAN_CITIES[Math.floor(Math.random() * BRAZILIAN_CITIES.length)],
      clubName: Math.random() > 0.3 ? CLUB_NAMES[Math.floor(Math.random() * CLUB_NAMES.length)] : undefined,
      bio: `Atleta de tênis de mesa ${level.toLowerCase()} com ${gamesPlayed} jogos disputados. Especialista em jogo ${PLAYING_STYLES[Math.floor(Math.random() * PLAYING_STYLES.length)].toLowerCase()}.`
    }
    
    athletes.push(athlete)
  }
  
  return athletes
}

export async function insertTestAthletes(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const athletes = generateTestAthletes(100)
    
    // This would normally insert into Supabase, but for now we'll store in localStorage for testing
    localStorage.setItem('test_athletes', JSON.stringify(athletes))
    
    return { success: true, count: athletes.length }
  } catch (error: any) {
    return { success: false, count: 0, error: error.message }
  }
}

export function getTestAthletes(): TestAthlete[] {
  try {
    const stored = localStorage.getItem('test_athletes')
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function clearTestAthletes(): void {
  localStorage.removeItem('test_athletes')
}