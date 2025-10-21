import { createClient } from '@supabase/supabase-js'


const supabaseUrl = 'https://rdvmuripwkimkkpyjomc.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkdm11cmlwd2tpbWtrcHlqb21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MjQ0MTcsImV4cCI6MjA3MzAwMDQxN30.CPVengYKarY7VfYi0trtZ-ko1gHzxiMG8QVfGdJfdLs'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface DatabaseUser {
  id: string
  user_type: 'athlete' | 'club'
  name: string
  email: string
  created_at: string
  updated_at: string
}

export interface DatabaseAthlete {
  id: string
  phone?: string
  cpf?: string
  birth_date?: string
  playing_level?: 'iniciante' | 'intermediario' | 'avancado' | 'profissional'
  dominant_hand?: 'direita' | 'esquerda'
  playing_style?: 'ofensivo' | 'defensivo' | 'misto'
  city?: string
  bio?: string
  current_rating: number
  peak_rating: number
  games_played: number
  wins: number
  losses: number
  club_id?: string
}

export interface DatabaseClub {
  id: string
  cnpj?: string
  corporate_email?: string
  zip_code?: string
  street?: string
  number?: string
  neighborhood?: string
  city?: string
  state?: string
  legal_representative?: string
  website?: string
  instagram?: string
  facebook?: string
  description?: string
  athletes_count: number
  tournaments_created: number
  active_tournaments: number
}

export interface DatabaseTournament {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  registration_deadline: string
  max_participants: number
  entry_fee: number
  format: string
  location: string
  rules?: string
  prizes?: string
  created_by: string
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface DatabaseTournamentRegistration {
  id: string
  tournament_id: string
  athlete_id: string
  registered_at: string
  status: 'registered' | 'confirmed' | 'cancelled'
}

// Helper functions
export const getUser = () => supabase.auth.getUser()
export const getSession = () => supabase.auth.getSession()


// Auth functions
export const signUp = async (email: string, password: string, userData: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}