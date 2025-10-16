export interface Tournament {
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
  createdBy: string // Club ID
  createdAt: string
  status: 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled'
  participants: string[] // Array of athlete IDs
}

export interface TournamentRegistration {
  tournamentId: string
  athleteId: string
  registeredAt: string
  status: 'registered' | 'confirmed' | 'cancelled'
}

const TOURNAMENTS_KEY = 'tm_tournaments'
const REGISTRATIONS_KEY = 'tm_registrations'

export class TournamentStorage {
  static getTournaments(): Tournament[] {
    try {
      const tournaments = localStorage.getItem(TOURNAMENTS_KEY)
      return tournaments ? JSON.parse(tournaments) : []
    } catch {
      return []
    }
  }

  static saveTournament(tournament: Tournament): void {
    const tournaments = this.getTournaments()
    const existingIndex = tournaments.findIndex(t => t.id === tournament.id)
    
    if (existingIndex >= 0) {
      tournaments[existingIndex] = tournament
    } else {
      tournaments.push(tournament)
    }
    
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments))
  }

  static getTournamentById(id: string): Tournament | null {
    const tournaments = this.getTournaments()
    return tournaments.find(t => t.id === id) || null
  }

  static getTournamentsByClub(clubId: string): Tournament[] {
    const tournaments = this.getTournaments()
    return tournaments.filter(t => t.createdBy === clubId)
  }

  static getAvailableTournaments(): Tournament[] {
    const tournaments = this.getTournaments()
    const now = new Date()
    return tournaments.filter(t => 
      t.status === 'open' && 
      new Date(t.registrationDeadline) > now &&
      t.participants.length < t.maxParticipants
    )
  }

  static createTournament(tournamentData: Omit<Tournament, 'id' | 'createdAt' | 'participants'>): Tournament {
    const tournament: Tournament = {
      ...tournamentData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      participants: [],
      status: 'open'
    }
    
    this.saveTournament(tournament)
    return tournament
  }

  static deleteTournament(id: string): boolean {
    const tournaments = this.getTournaments()
    const filteredTournaments = tournaments.filter(t => t.id !== id)
    
    if (filteredTournaments.length !== tournaments.length) {
      localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(filteredTournaments))
      return true
    }
    return false
  }

  // Registration methods
  static getRegistrations(): TournamentRegistration[] {
    try {
      const registrations = localStorage.getItem(REGISTRATIONS_KEY)
      return registrations ? JSON.parse(registrations) : []
    } catch {
      return []
    }
  }

  static saveRegistration(registration: TournamentRegistration): void {
    const registrations = this.getRegistrations()
    const existingIndex = registrations.findIndex(r => 
      r.tournamentId === registration.tournamentId && r.athleteId === registration.athleteId
    )
    
    if (existingIndex >= 0) {
      registrations[existingIndex] = registration
    } else {
      registrations.push(registration)
    }
    
    localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations))
  }

  static registerAthlete(tournamentId: string, athleteId: string): boolean {
    const tournament = this.getTournamentById(tournamentId)
    if (!tournament) return false

    // Check if already registered
    const existingRegistration = this.getRegistrations().find(r => 
      r.tournamentId === tournamentId && r.athleteId === athleteId
    )
    if (existingRegistration) return false

    // Check if tournament is full
    if (tournament.participants.length >= tournament.maxParticipants) return false

    // Check if registration is still open
    if (new Date() > new Date(tournament.registrationDeadline)) return false

    // Add to participants
    tournament.participants.push(athleteId)
    this.saveTournament(tournament)

    // Save registration
    const registration: TournamentRegistration = {
      tournamentId,
      athleteId,
      registeredAt: new Date().toISOString(),
      status: 'registered'
    }
    this.saveRegistration(registration)

    return true
  }

  static unregisterAthlete(tournamentId: string, athleteId: string): boolean {
    const tournament = this.getTournamentById(tournamentId)
    if (!tournament) return false

    // Remove from participants
    tournament.participants = tournament.participants.filter(id => id !== athleteId)
    this.saveTournament(tournament)

    // Update registration status
    const registrations = this.getRegistrations()
    const registration = registrations.find(r => 
      r.tournamentId === tournamentId && r.athleteId === athleteId
    )
    if (registration) {
      registration.status = 'cancelled'
      this.saveRegistration(registration)
    }

    return true
  }

  static getAthleteRegistrations(athleteId: string): TournamentRegistration[] {
    return this.getRegistrations().filter(r => 
      r.athleteId === athleteId && r.status === 'registered'
    )
  }

  static getTournamentRegistrations(tournamentId: string): TournamentRegistration[] {
    return this.getRegistrations().filter(r => 
      r.tournamentId === tournamentId && r.status === 'registered'
    )
  }
}