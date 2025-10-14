import { supabase, getUser } from './supabase'

export interface SupabaseTournament {
  id: string
  name: string
  description?: string
  startDate: string
  endDate: string
  registrationDeadline: string
  maxParticipants: number
  entryFee: number
  format: string
  location: string
  rules?: string
  prizes?: string
  createdBy: string
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
  participants: string[]
}

export interface SupabaseTournamentRegistration {
  id: string
  tournamentId: string
  athleteId: string
  registeredAt: string
  status: 'registered' | 'confirmed' | 'cancelled'
}

export class SupabaseTournaments {
  static async getTournaments(): Promise<SupabaseTournament[]> {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_tournaments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tournaments:', error)
        return []
      }

      // Get participants for each tournament
      const tournamentsWithParticipants = await Promise.all(
        (data || []).map(async (tournament) => {
          const { data: registrations } = await supabase
            .from('app_5732e5c77b_tournament_registrations')
            .select('athlete_id')
            .eq('tournament_id', tournament.id)
            .eq('status', 'registered')

          return {
            id: tournament.id,
            name: tournament.name,
            description: tournament.description,
            startDate: tournament.start_date,
            endDate: tournament.end_date,
            registrationDeadline: tournament.registration_deadline,
            maxParticipants: tournament.max_participants,
            entryFee: tournament.entry_fee,
            format: tournament.format,
            location: tournament.location,
            rules: tournament.rules,
            prizes: tournament.prizes,
            createdBy: tournament.created_by,
            status: tournament.status,
            createdAt: tournament.created_at,
            participants: registrations?.map(r => r.athlete_id) || []
          }
        })
      )

      return tournamentsWithParticipants
    } catch (error) {
      console.error('Error in getTournaments:', error)
      return []
    }
  }

  static async getTournamentById(id: string): Promise<SupabaseTournament | null> {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_tournaments')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) return null

      // Get participants
      const { data: registrations } = await supabase
        .from('app_5732e5c77b_tournament_registrations')
        .select('athlete_id')
        .eq('tournament_id', id)
        .eq('status', 'registered')

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        startDate: data.start_date,
        endDate: data.end_date,
        registrationDeadline: data.registration_deadline,
        maxParticipants: data.max_participants,
        entryFee: data.entry_fee,
        format: data.format,
        location: data.location,
        rules: data.rules,
        prizes: data.prizes,
        createdBy: data.created_by,
        status: data.status,
        createdAt: data.created_at,
        participants: registrations?.map(r => r.athlete_id) || []
      }
    } catch (error) {
      console.error('Error in getTournamentById:', error)
      return null
    }
  }

  static async getTournamentsByClub(clubId: string): Promise<SupabaseTournament[]> {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_tournaments')
        .select('*')
        .eq('created_by', clubId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching club tournaments:', error)
        return []
      }

      // Get participants for each tournament
      const tournamentsWithParticipants = await Promise.all(
        (data || []).map(async (tournament) => {
          const { data: registrations } = await supabase
            .from('app_5732e5c77b_tournament_registrations')
            .select('athlete_id')
            .eq('tournament_id', tournament.id)
            .eq('status', 'registered')

          return {
            id: tournament.id,
            name: tournament.name,
            description: tournament.description,
            startDate: tournament.start_date,
            endDate: tournament.end_date,
            registrationDeadline: tournament.registration_deadline,
            maxParticipants: tournament.max_participants,
            entryFee: tournament.entry_fee,
            format: tournament.format,
            location: tournament.location,
            rules: tournament.rules,
            prizes: tournament.prizes,
            createdBy: tournament.created_by,
            status: tournament.status,
            createdAt: tournament.created_at,
            participants: registrations?.map(r => r.athlete_id) || []
          }
        })
      )

      return tournamentsWithParticipants
    } catch (error) {
      console.error('Error in getTournamentsByClub:', error)
      return []
    }
  }

  static async getAvailableTournaments(): Promise<SupabaseTournament[]> {
    try {
      const now = new Date().toISOString()

      const { data, error } = await supabase
        .from('app_5732e5c77b_tournaments')
        .select('*')
        .eq('status', 'open')
        .gt('registration_deadline', now)
        .order('start_date', { ascending: true })

      if (error) {
        console.error('Error fetching available tournaments:', error)
        return []
      }

      // Get participants and filter by availability
      const availableTournaments = await Promise.all(
        (data || []).map(async (tournament) => {
          const { data: registrations } = await supabase
            .from('app_5732e5c77b_tournament_registrations')
            .select('athlete_id')
            .eq('tournament_id', tournament.id)
            .eq('status', 'registered')

          const participants = registrations?.map(r => r.athlete_id) || []

          return {
            id: tournament.id,
            name: tournament.name,
            description: tournament.description,
            startDate: tournament.start_date,
            endDate: tournament.end_date,
            registrationDeadline: tournament.registration_deadline,
            maxParticipants: tournament.max_participants,
            entryFee: tournament.entry_fee,
            format: tournament.format,
            location: tournament.location,
            rules: tournament.rules,
            prizes: tournament.prizes,
            createdBy: tournament.created_by,
            status: tournament.status,
            createdAt: tournament.created_at,
            participants
          }
        })
      )

      // Filter tournaments that still have space
      return availableTournaments.filter(t => t.participants.length < t.maxParticipants)
    } catch (error) {
      console.error('Error in getAvailableTournaments:', error)
      return []
    }
  }

  static async createTournament(tournamentData: Omit<SupabaseTournament, 'id' | 'createdAt' | 'participants'>): Promise<SupabaseTournament | null> {
    try {
      const { data: { user } } = await getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from('app_5732e5c77b_tournaments')
        .insert({
          name: tournamentData.name,
          description: tournamentData.description,
          start_date: tournamentData.startDate,
          end_date: tournamentData.endDate,
          registration_deadline: tournamentData.registrationDeadline,
          max_participants: tournamentData.maxParticipants,
          entry_fee: tournamentData.entryFee,
          format: tournamentData.format,
          location: tournamentData.location,
          rules: tournamentData.rules,
          prizes: tournamentData.prizes,
          created_by: user.id,
          status: tournamentData.status
        })
        .select()
        .single()

      if (error || !data) {
        console.error('Error creating tournament:', error)
        return null
      }

      // Update club statistics
      await supabase.rpc('increment_club_tournaments', { club_id: user.id })

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        startDate: data.start_date,
        endDate: data.end_date,
        registrationDeadline: data.registration_deadline,
        maxParticipants: data.max_participants,
        entryFee: data.entry_fee,
        format: data.format,
        location: data.location,
        rules: data.rules,
        prizes: data.prizes,
        createdBy: data.created_by,
        status: data.status,
        createdAt: data.created_at,
        participants: []
      }
    } catch (error) {
      console.error('Error in createTournament:', error)
      return null
    }
  }

  static async deleteTournament(id: string): Promise<boolean> {
    try {
      const { data: { user } } = await getUser()
      
      if (!user) return false

      const { error } = await supabase
        .from('app_5732e5c77b_tournaments')
        .delete()
        .eq('id', id)
        .eq('created_by', user.id)

      if (error) {
        console.error('Error deleting tournament:', error)
        return false
      }

      // Update club statistics
      await supabase.rpc('decrement_club_tournaments', { club_id: user.id })

      return true
    } catch (error) {
      console.error('Error in deleteTournament:', error)
      return false
    }
  }

  static async registerAthlete(tournamentId: string, athleteId: string): Promise<boolean> {
    try {
      // Check if tournament exists and has space
      const tournament = await this.getTournamentById(tournamentId)
      if (!tournament) return false

      if (tournament.participants.length >= tournament.maxParticipants) return false
      if (new Date() > new Date(tournament.registrationDeadline)) return false

      // Check if already registered
      const { data: existingRegistration } = await supabase
        .from('app_5732e5c77b_tournament_registrations')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('athlete_id', athleteId)
        .single()

      if (existingRegistration) return false

      // Register athlete
      const { error } = await supabase
        .from('app_5732e5c77b_tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          athlete_id: athleteId,
          status: 'registered'
        })

      if (error) {
        console.error('Error registering athlete:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in registerAthlete:', error)
      return false
    }
  }

  static async unregisterAthlete(tournamentId: string, athleteId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_5732e5c77b_tournament_registrations')
        .update({ status: 'cancelled' })
        .eq('tournament_id', tournamentId)
        .eq('athlete_id', athleteId)

      if (error) {
        console.error('Error unregistering athlete:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in unregisterAthlete:', error)
      return false
    }
  }

  static async getAthleteRegistrations(athleteId: string): Promise<SupabaseTournamentRegistration[]> {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_tournament_registrations')
        .select('*')
        .eq('athlete_id', athleteId)
        .eq('status', 'registered')

      if (error) {
        console.error('Error fetching athlete registrations:', error)
        return []
      }

      return (data || []).map(reg => ({
        id: reg.id,
        tournamentId: reg.tournament_id,
        athleteId: reg.athlete_id,
        registeredAt: reg.registered_at,
        status: reg.status
      }))
    } catch (error) {
      console.error('Error in getAthleteRegistrations:', error)
      return []
    }
  }

  static async getTournamentRegistrations(tournamentId: string): Promise<SupabaseTournamentRegistration[]> {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_tournament_registrations')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('status', 'registered')

      if (error) {
        console.error('Error fetching tournament registrations:', error)
        return []
      }

      return (data || []).map(reg => ({
        id: reg.id,
        tournamentId: reg.tournament_id,
        athleteId: reg.athlete_id,
        registeredAt: reg.registered_at,
        status: reg.status
      }))
    } catch (error) {
      console.error('Error in getTournamentRegistrations:', error)
      return []
    }
  }
}