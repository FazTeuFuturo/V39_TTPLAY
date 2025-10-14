import { supabase, signUp, signIn, signOut, getUser } from './supabase'
import { UserType } from './types'

export interface SupabaseUser {
  id: string
  email: string
  userType: UserType
  name: string
  // Athlete fields
  phone?: string
  cpf?: string
  birthDate?: string
  playingLevel?: string
  dominantHand?: string
  playingStyle?: string
  city?: string
  bio?: string
  currentRating?: number
  peakRating?: number
  gamesPlayed?: number
  wins?: number
  losses?: number
  clubId?: string
  // Club fields
  cnpj?: string
  corporateEmail?: string
  zipCode?: string
  street?: string
  number?: string
  neighborhood?: string
  state?: string
  legalRepresentative?: string
  website?: string
  instagram?: string
  facebook?: string
  description?: string
  athletesCount?: number
  tournamentsCreated?: number
  activeTournaments?: number
}

export class SupabaseAuth {
  static async createUser(userData: {
    email: string
    password: string
    userType: UserType
    name: string
    [key: string]: any
  }): Promise<{ user: SupabaseUser | null; error: string | null }> {
    try {
      // Convert UserType enum to exact string values expected by database
      const dbUserType = userData.userType === UserType.ATHLETE ? 'athlete' : 'club'
      
      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            user_type: dbUserType,
            name: userData.name
          }
        }
      })

      if (authError) {
        return { user: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, error: 'Failed to create user account' }
      }

      const userId = authData.user.id

      // Step 2: Wait for user to be authenticated (important for RLS)
      let attempts = 0
      const maxAttempts = 10
      
      while (attempts < maxAttempts) {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (currentUser && currentUser.id === userId) {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 500))
        attempts++
      }

      // Step 3: Insert into users table with exact constraint values
      const { error: userError } = await supabase
        .from('app_5732e5c77b_users')
        .insert({
          id: userId,
          user_type: dbUserType, // Use exact string: 'athlete' or 'club'
          name: userData.name,
          email: userData.email
        })

      if (userError) {
        console.error('Error inserting user:', userError)
        return { user: null, error: `Failed to create user profile: ${userError.message}` }
      }

      // Step 4: Insert into specific user type table
      if (userData.userType === UserType.ATHLETE) {
        const { error: athleteError } = await supabase
          .from('app_5732e5c77b_athletes')
          .insert({
            id: userId,
            phone: userData.phone || null,
            cpf: userData.cpf || null,
            birth_date: userData.birthDate || null,
            playing_level: userData.playingLevel || null,
            dominant_hand: userData.dominantHand || null,
            playing_style: userData.playingStyle || null,
            city: userData.city || null,
            bio: userData.bio || null,
            current_rating: 1200,
            peak_rating: 1200,
            games_played: 0,
            wins: 0,
            losses: 0
          })

        if (athleteError) {
          console.error('Error inserting athlete:', athleteError)
          return { user: null, error: `Failed to create athlete profile: ${athleteError.message}` }
        }
      } else if (userData.userType === UserType.CLUB) {
        const { error: clubError } = await supabase
          .from('app_5732e5c77b_clubs')
          .insert({
            id: userId,
            cnpj: userData.cnpj || null,
            corporate_email: userData.corporateEmail || null,
            zip_code: userData.zipCode || null,
            street: userData.street || null,
            number: userData.number || null,
            neighborhood: userData.neighborhood || null,
            city: userData.city || null,
            state: userData.state || null,
            legal_representative: userData.legalRepresentative || null,
            website: userData.website || null,
            instagram: userData.instagram || null,
            facebook: userData.facebook || null,
            description: userData.description || null,
            athletes_count: 0,
            tournaments_created: 0,
            active_tournaments: 0
          })

        if (clubError) {
          console.error('Error inserting club:', clubError)
          return { user: null, error: `Failed to create club profile: ${clubError.message}` }
        }
      }

      // Step 5: Fetch complete user data
      const user = await this.getCurrentUser()
      return { user, error: null }

    } catch (error: any) {
      console.error('Error in createUser:', error)
      return { user: null, error: error.message || 'An unexpected error occurred' }
    }
  }

  static async loginUser(email: string, password: string): Promise<{ user: SupabaseUser | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { user: null, error: error.message }
      }

      if (!data.user) {
        return { user: null, error: 'Login failed' }
      }

      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 100))

      const user = await this.getCurrentUser()
      return { user, error: null }

    } catch (error: any) {
      console.error('Error in loginUser:', error)
      return { user: null, error: error.message || 'Login failed' }
    }
  }

  static async getCurrentUser(): Promise<SupabaseUser | null> {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        return null
      }

      // Get user data from our tables
      const { data: userData, error: userError } = await supabase
        .from('app_5732e5c77b_users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError || !userData) {
        console.error('Error fetching user data:', userError)
        return null
      }

      let specificData = {}

      if (userData.user_type === 'athlete') {
        const { data: athleteData, error: athleteError } = await supabase
          .from('app_5732e5c77b_athletes')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (!athleteError && athleteData) {
          specificData = {
            phone: athleteData.phone,
            cpf: athleteData.cpf,
            birthDate: athleteData.birth_date,
            playingLevel: athleteData.playing_level,
            dominantHand: athleteData.dominant_hand,
            playingStyle: athleteData.playing_style,
            city: athleteData.city,
            bio: athleteData.bio,
            currentRating: athleteData.current_rating,
            peakRating: athleteData.peak_rating,
            gamesPlayed: athleteData.games_played,
            wins: athleteData.wins,
            losses: athleteData.losses,
            clubId: athleteData.club_id
          }
        }
      } else if (userData.user_type === 'club') {
        const { data: clubData, error: clubError } = await supabase
          .from('app_5732e5c77b_clubs')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (!clubError && clubData) {
          specificData = {
            cnpj: clubData.cnpj,
            corporateEmail: clubData.corporate_email,
            zipCode: clubData.zip_code,
            street: clubData.street,
            number: clubData.number,
            neighborhood: clubData.neighborhood,
            city: clubData.city,
            state: clubData.state,
            legalRepresentative: clubData.legal_representative,
            website: clubData.website,
            instagram: clubData.instagram,
            facebook: clubData.facebook,
            description: clubData.description,
            athletesCount: clubData.athletes_count,
            tournamentsCreated: clubData.tournaments_created,
            activeTournaments: clubData.active_tournaments
          }
        }
      }

      return {
        id: userData.id,
        email: userData.email,
        userType: userData.user_type === 'athlete' ? UserType.ATHLETE : UserType.CLUB,
        name: userData.name,
        ...specificData
      }

    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  static async updateUser(userData: Partial<SupabaseUser>): Promise<{ success: boolean; error: string | null }> {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        return { success: false, error: 'User not authenticated' }
      }

      // Update users table
      const { error: userError } = await supabase
        .from('app_5732e5c77b_users')
        .update({
          name: userData.name,
          email: userData.email
        })
        .eq('id', authUser.id)

      if (userError) {
        return { success: false, error: userError.message }
      }

      // Update specific user type table
      if (userData.userType === UserType.ATHLETE) {
        const { error: athleteError } = await supabase
          .from('app_5732e5c77b_athletes')
          .update({
            phone: userData.phone,
            cpf: userData.cpf,
            birth_date: userData.birthDate,
            playing_level: userData.playingLevel,
            dominant_hand: userData.dominantHand,
            playing_style: userData.playingStyle,
            city: userData.city,
            bio: userData.bio,
            current_rating: userData.currentRating,
            peak_rating: userData.peakRating,
            games_played: userData.gamesPlayed,
            wins: userData.wins,
            losses: userData.losses
          })
          .eq('id', authUser.id)

        if (athleteError) {
          return { success: false, error: athleteError.message }
        }
      } else if (userData.userType === UserType.CLUB) {
        const { error: clubError } = await supabase
          .from('app_5732e5c77b_clubs')
          .update({
            cnpj: userData.cnpj,
            corporate_email: userData.corporateEmail,
            zip_code: userData.zipCode,
            street: userData.street,
            number: userData.number,
            neighborhood: userData.neighborhood,
            city: userData.city,
            state: userData.state,
            legal_representative: userData.legalRepresentative,
            website: userData.website,
            instagram: userData.instagram,
            facebook: userData.facebook,
            description: userData.description,
            athletes_count: userData.athletesCount,
            tournaments_created: userData.tournamentsCreated,
            active_tournaments: userData.activeTournaments
          })
          .eq('id', authUser.id)

        if (clubError) {
          return { success: false, error: clubError.message }
        }
      }

      return { success: true, error: null }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  static async logout(): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      return { success: !error, error: error?.message || null }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  static async getUserByEmail(email: string): Promise<SupabaseUser | null> {
    try {
      const { data: userData, error } = await supabase
        .from('app_5732e5c77b_users')
        .select('*')
        .eq('email', email)
        .single()

      if (error || !userData) return null

      // This is a simplified version - in a real app you'd need admin privileges
      // For now, we'll just return basic user data
      return {
        id: userData.id,
        email: userData.email,
        userType: userData.user_type === 'athlete' ? UserType.ATHLETE : UserType.CLUB,
        name: userData.name
      }
    } catch (error) {
      return null
    }
  }
}