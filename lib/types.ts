// Core types for the table tennis platform
export interface User {
  id: string
  email: string
  name: string
  username?: string
  avatar?: string
  bio?: string
  city?: string
  state?: string
  country: string
  
  // Tennis-specific data
  playingLevel: PlayingLevel
  dominantHand: DominantHand
  playingStyle?: PlayingStyle
  yearsPlaying?: number
  
  // Rating system
  currentRating: number
  peakRating: number
  gamesPlayed: number
  wins: number
  losses: number
  
  // Status
  role: Role
  isEmailVerified: boolean
  isActive: boolean
  lastActiveAt?: Date
  
  createdAt: Date
  updatedAt: Date
}

export interface Club {
  id: string
  name: string
  description?: string
  address?: string
  city?: string
  state?: string
  country: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  
  isVerified: boolean
  subscriptionPlan: SubscriptionPlan
  
  adminId: string
  admin: User
  
  createdAt: Date
  updatedAt: Date
  
  tournaments: Tournament[]
}

export interface Tournament {
  id: string
  name: string
  description?: string
  start_date: string; // <-- Correto
  end_date?: string;   // <-- Correto
  registration_deadline?: string; // <-- Correto
  location: string
  address?: string
  entryFee: number
  maxParticipants?: number
  minParticipants?: number  // Pode tornar opcional se não usar sempre
  state?: string
  
  // Technical settings
  setRule?: number // Tornar opcional se não vier do Supabase
  pointsPerSet?: number // Tornar opcional
  format: TournamentFormat
  status: TournamentStatus
  
  // Ranking settings (tornar opcionais)
  isRanked?: boolean
  kFactor?: number
  
  // Campos do Supabase que estavam faltando
  createdBy: string  // ⭐ ESTE ERA O PRINCIPAL PROBLEMA
  rules?: string
  prizes?: string
  
  createdAt: Date
  updatedAt?: Date
  
  // Dados relacionados
  clubId?: string  // Tornar opcional
  club?: Club      // Tornar opcional (pode não vir sempre)
  players?: PlayerOnTournament[]  // Tornar opcional
  matches?: Match[]  // Tornar opcional
  
  // Propriedades computadas vindas do Supabase
  categoryCount?: number
  participantCount?: number
  categories?: TournamentCategory[]
}
export interface TournamentCategory {
  categoryId: string
  price: number
  tournament_id: string
  // Adicione outros campos da categoria conforme necessário
}
export interface PlayerOnTournament {
  id: string
  playerId: string
  tournamentId: string
  
  registrationStatus: RegistrationStatus
  seed?: number
  finalPosition?: number
  
  registeredAt: Date
  confirmedAt?: Date
  
  player: User
  tournament: Tournament
}

export interface Match {
  id: string
  tournamentId?: string
  player1Id: string
  player2Id: string
  winnerId?: string
  
  matchType: MatchType
  round?: number
  status: MatchStatus
  
  // Scores
  player1Score: number // Sets won
  player2Score: number // Sets won
  setScores?: SetScore[] // Detailed set scores
  
  // Rating data
  player1RatingBefore?: number
  player2RatingBefore?: number
  player1RatingAfter?: number
  player2RatingAfter?: number
  
  scheduledFor?: Date
  startedAt?: Date
  finishedAt?: Date
  createdAt: Date
  updatedAt: Date
  
  tournament?: Tournament
  player1: User
  player2: User
  winner?: User
}

export interface SetScore {
  player1Score: number
  player2Score: number
}

export interface Challenge {
  id: string
  challengerId: string
  challengedId: string
  
  message?: string
  proposedDate?: Date
  location?: string
  status: ChallengeStatus
  
  response?: string
  respondedAt?: Date
  
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
  
  challenger: User
  challenged: User
  match?: Match
}

export interface Follow {
  id: string
  followerId: string
  followingId: string
  createdAt: Date
  
  follower: User
  following: User
}

export interface Post {
  id: string
  authorId: string
  content: string
  images: string[]
  
  type: PostType
  
  tournamentId?: string
  matchId?: string
  
  likesCount: number
  commentsCount: number
  
  createdAt: Date
  updatedAt: Date
  
  author: User
  tournament?: Tournament
}

export interface RatingHistory {
  id: string
  userId: string
  rating: number
  change: number
  reason: string
  matchId?: string
  createdAt: Date
  
  user: User
}

// Enums
export enum Role {
  PLAYER = 'PLAYER',
  CLUB_ADMIN = 'CLUB_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum PlayingLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum DominantHand {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  AMBIDEXTROUS = 'AMBIDEXTROUS'
}

export enum PlayingStyle {
  OFFENSIVE = 'OFFENSIVE',
  DEFENSIVE = 'DEFENSIVE',
  ALL_AROUND = 'ALL_AROUND',
  DEFENSIVE_CHOPPER = 'DEFENSIVE_CHOPPER',
  PIPS_OUT_HITTER = 'PIPS_OUT_HITTER'
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE'
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  SWISS_SYSTEM = 'SWISS_SYSTEM'
}

export enum TournamentStatus {
  REGISTRATION = 'REGISTRATION',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum RegistrationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  WITHDRAWN = 'WITHDRAWN'
}

export enum MatchType {
  TOURNAMENT = 'TOURNAMENT',
  CHALLENGE = 'CHALLENGE',
  FRIENDLY = 'FRIENDLY',
  TRAINING = 'TRAINING'
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  WALKOVER = 'WALKOVER',
  PENDING = 'PENDING'
}

export enum ChallengeStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  COMPLETED = 'COMPLETED'
}

export enum PostType {
  GENERAL = 'GENERAL',
  TRAINING = 'TRAINING',
  MATCH_RESULT = 'MATCH_RESULT',
  TOURNAMENT_UPDATE = 'TOURNAMENT_UPDATE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  TIP = 'TIP'
}

// Form types
export interface TournamentFormData {
  name: string
  description?: string
  startDate: Date
  registrationDeadline?: Date
  location: string
  address?: string
  entryFee: number
  maxParticipants?: number
  format: TournamentFormat
  setRule: number
  isRanked: boolean
}

export interface UserRegistrationData {
  name: string
  email: string
  password: string
  city: string
  playingLevel: PlayingLevel
  dominantHand: DominantHand
  playingStyle?: PlayingStyle
}

export interface MatchResultData {
  winnerId: string
  setScores: SetScore[]
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}