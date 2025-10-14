import { z } from 'zod'
import { PlayingLevel, DominantHand, PlayingStyle, TournamentFormat, Role } from './types'

// User validation schemas
export const userRegistrationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(50, 'Nome muito longo'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  playingLevel: z.nativeEnum(PlayingLevel),
  dominantHand: z.nativeEnum(DominantHand),
  playingStyle: z.nativeEnum(PlayingStyle).optional(),
})

export const userLoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const userProfileUpdateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(50, 'Nome muito longo'),
  username: z.string().min(3, 'Username deve ter pelo menos 3 caracteres').max(20, 'Username muito longo').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio muito longa').optional(),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().optional(),
  playingLevel: z.nativeEnum(PlayingLevel),
  dominantHand: z.nativeEnum(DominantHand),
  playingStyle: z.nativeEnum(PlayingStyle).optional(),
  yearsPlaying: z.number().min(0).max(80).optional(),
})

// Tournament validation schemas
export const tournamentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
  description: z.string().max(1000, 'Descrição muito longa').optional(),
  startDate: z.date().min(new Date(), 'Data deve ser futura'),
  registrationDeadline: z.date().optional(),
  location: z.string().min(3, 'Local é obrigatório'),
  address: z.string().optional(),
  entryFee: z.number().min(0, 'Taxa não pode ser negativa').max(10000, 'Taxa muito alta'),
  maxParticipants: z.number().min(4, 'Mínimo 4 participantes').max(256, 'Máximo 256 participantes').optional(),
  format: z.nativeEnum(TournamentFormat),
  setRule: z.number().min(3).max(7),
  isRanked: z.boolean(),
}).refine((data) => {
  if (data.registrationDeadline) {
    return data.registrationDeadline <= data.startDate
  }
  return true
}, {
  message: 'Prazo de inscrição deve ser antes do início do torneio',
  path: ['registrationDeadline']
})

// Club validation schemas
export const clubSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
  description: z.string().max(1000, 'Descrição muito longa').optional(),
  address: z.string().optional(),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  website: z.string().url('URL inválida').optional(),
})

// Match result validation
export const matchResultSchema = z.object({
  winnerId: z.string().uuid('ID do vencedor inválido'),
  setScores: z.array(z.object({
    player1Score: z.number().min(0).max(21),
    player2Score: z.number().min(0).max(21),
  })).min(2, 'Mínimo 2 sets').max(7, 'Máximo 7 sets'),
}).refine((data) => {
  // Validate that each set has a valid score (someone must reach at least 11 and win by 2)
  return data.setScores.every(set => {
    const { player1Score, player2Score } = set
    const maxScore = Math.max(player1Score, player2Score)
    const minScore = Math.min(player1Score, player2Score)
    
    // Normal game: first to 11, win by 2
    if (maxScore >= 11 && maxScore - minScore >= 2) return true
    
    // Deuce situation: both players at 10+, winner must be 2 ahead
    if (minScore >= 10 && maxScore - minScore >= 2) return true
    
    return false
  })
}, {
  message: 'Placares inválidos - verifique as regras do tênis de mesa',
  path: ['setScores']
})

// Challenge validation
export const challengeSchema = z.object({
  challengedId: z.string().uuid('ID do desafiado inválido'),
  message: z.string().max(500, 'Mensagem muito longa').optional(),
  proposedDate: z.date().min(new Date(), 'Data deve ser futura').optional(),
  location: z.string().max(200, 'Local muito longo').optional(),
})

// Post validation
export const postSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório').max(2000, 'Conteúdo muito longo'),
  images: z.array(z.string().url()).max(4, 'Máximo 4 imagens').optional(),
  tournamentId: z.string().uuid().optional(),
  matchId: z.string().uuid().optional(),
})

// Search and filter schemas
export const tournamentFilterSchema = z.object({
  city: z.string().optional(),
  status: z.string().optional(),
  format: z.nativeEnum(TournamentFormat).optional(),
  minFee: z.number().min(0).optional(),
  maxFee: z.number().min(0).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

export const userSearchSchema = z.object({
  query: z.string().min(1, 'Busca não pode estar vazia').max(100),
  city: z.string().optional(),
  playingLevel: z.nativeEnum(PlayingLevel).optional(),
  minRating: z.number().min(0).max(3000).optional(),
  maxRating: z.number().min(0).max(3000).optional(),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Type exports for use in components
export type UserRegistrationData = z.infer<typeof userRegistrationSchema>
export type UserLoginData = z.infer<typeof userLoginSchema>
export type UserProfileUpdateData = z.infer<typeof userProfileUpdateSchema>
export type TournamentData = z.infer<typeof tournamentSchema>
export type ClubData = z.infer<typeof clubSchema>
export type MatchResultData = z.infer<typeof matchResultSchema>
export type ChallengeData = z.infer<typeof challengeSchema>
export type PostData = z.infer<typeof postSchema>
export type TournamentFilterData = z.infer<typeof tournamentFilterSchema>
export type UserSearchData = z.infer<typeof userSearchSchema>
export type PaginationData = z.infer<typeof paginationSchema>