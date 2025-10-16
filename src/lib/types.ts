// Enums
export enum UserType {
  ATHLETE = 'ATHLETE',
  CLUB = 'CLUB'
}

export enum PlayingLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE', 
  ADVANCED = 'ADVANCED',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum DominantHand {
  RIGHT = 'RIGHT',
  LEFT = 'LEFT',
  AMBIDEXTROUS = 'AMBIDEXTROUS'
}

export enum PlayingStyle {
  OFFENSIVE = 'OFFENSIVE',
  DEFENSIVE = 'DEFENSIVE',
  ALL_ROUND = 'ALL_ROUND'
}

// FIXED: Updated TournamentStatus to match component usage
export enum TournamentStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  IN_PROGRESS = 'in_progress',
  FINISHED = 'finished',
  CANCELLED = 'cancelled'
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  SWISS = 'SWISS'
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
}

export enum ChallengeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED'
}

export enum RegistrationStatus { // <--- PRECISA DO 'export'
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  WITHDRAWN = 'WITHDRAWN'
}

// Base User Interface
export interface User {
  id: string
  email: string
  userType: UserType
  createdAt: Date
  updatedAt: Date
}

// Athlete-specific interface
export interface Athlete {
  id: string
  userId: string
  name: string
  phone?: string
  birthDate?: Date
  playingLevel: PlayingLevel
  dominantHand?: DominantHand
  playingStyle?: PlayingStyle
  currentRating: number
  peakRating: number
  gamesPlayed: number
  wins: number
  losses: number
  profileImage?: string
  cpf?: string
  clubId?: string
  city?: string
  bio?: string
  createdAt: Date
  updatedAt: Date
}

// Club-specific interface
export interface Club {
  id: string
  userId: string
  name: string
  cnpj: string
  phone: string
  address: string
  cep: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  responsibleName: string
  website?: string
  socialMedia?: string
  description?: string
  logo?: string
  createdAt: Date
  updatedAt: Date
}

export interface Tournament {
  id: string
  name: string
  description?: string
  createdBy: string 
  startDate: Date
  endDate?: Date // Corrigido para ser opcional
  registrationDeadline?: Date // Corrigido para ser opcional
  location: string // Adicionado, pois é usado no frontend
  rules?: string // Adicionado, pois é usado no frontend
  prizes?: string // Adicionado, pois é usado no frontend
  categories?: string[]
 setRule: number; // <--- ADICIONE ESTA PROPRIEDADE
 pointsPerSet: number
 isRanked: boolean // <--- ADICIONE ESTA PROPRIEDADE
 kFactor: number// Adicionado, pois é usado no frontend
  
  // CORREÇÃO CRÍTICA DE PREÇOS E PARTICIPANTES:
  maxParticipants: number
 minParticipants?: number
  // Manter entryFee e registrationPrice separados (conforme seu código anterior)
  entryFee: number
  registrationPrice: number 
  
  format: TournamentFormat // Assuming TournamentFormat is correctly imported/exported
  status: TournamentStatus // Assuming TournamentStatus is correctly imported/exported
  
  // CORREÇÃO CRÍTICA DO CAMPO QUE ESTAVA CAUSANDO O ERRO:
  players: PlayerOnTournament[] // <--- AGORA DEFINIDO ACIMA
  matches: Match[]
  
  createdAt?: Date // Corrigido para ser opcional
  updatedAt?: Date // Corrigido para ser opcional
  
  // Adicionar outros campos necessários (ex: clubId)
  clubId?: string
  club: any
  tournamentType?: string; // Adicionado para resolver o TS2339 no TournamentList
}

export interface PlayerOnTournament { // Necessário para a interface Tournament
  id: string
  playerId: string
  tournamentId: string
  registrationStatus: RegistrationStatus
  // Adicionar placeholders para os objetos complexos que você usa:
  player: User; 
  registeredAt: Date;
}

// Match interface
export interface Match {
  id: string
  tournamentId: string
  player1Id: string
  player2Id: string
  scheduledAt?: Date
  completedAt?: Date
  status: MatchStatus
  player1Score: number
  player2Score: number
  round: number
  position: number
  winnerId?: string
  createdAt: Date
  updatedAt: Date
}

// Challenge interface
export interface Challenge {
  id: string
  challengerId: string
  challengedId: string
  message?: string
  proposedDate?: Date
  location?: string
  status: ChallengeStatus
  matchId?: string
  createdAt: Date
  updatedAt: Date
}

// Rating History interface
export interface RatingHistory {
  id: string
  athleteId: string
  matchId: string
  ratingBefore: number
  ratingAfter: number
  ratingChange: number
  createdAt: Date
}

// Tournament Registration interface
export interface TournamentRegistration {
  id: string
  tournamentId: string
  athleteId: string
  registeredAt: Date
  confirmed: boolean
}

// Social Post interface
export interface SocialPost {
  id: string
  authorId: string
  content: string
  imageUrl?: string
  likes: number
  comments: number
  createdAt: Date
  updatedAt: Date
}

// Notification interface
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: Date
}