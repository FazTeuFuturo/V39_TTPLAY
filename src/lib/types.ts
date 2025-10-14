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

// UPDATED: Tournament interface to match component usage
export interface Tournament {
  id: string
  name: string
  description?: string
  createdBy: string // Changed from clubId to match component
  startDate: Date
  endDate: Date
  registrationDeadline: Date
  maxParticipants: number
  registrationPrice: number // Changed from entryFee to match component
  format: string // Simplified to string to match component
  status: TournamentStatus
  location: string
  rules?: string
  prizes?: string
  categories?: string[] // Added to match component
  createdAt?: Date
  updatedAt?: Date
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