import { UserType } from './types'

export interface StoredUser {
  id: string
  email: string
  password: string
  userType: UserType
  name: string
  // Athlete specific fields
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
  // Club specific fields
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

export interface AuthSession {
  user: StoredUser
  isAuthenticated: boolean
}

const USERS_KEY = 'tm_users'
const SESSION_KEY = 'tm_session'

export class AuthStorage {
  static getUsers(): StoredUser[] {
    try {
      const users = localStorage.getItem(USERS_KEY)
      return users ? JSON.parse(users) : []
    } catch {
      return []
    }
  }

  static saveUser(user: StoredUser): void {
    const users = this.getUsers()
    const existingIndex = users.findIndex(u => u.email === user.email)
    
    if (existingIndex >= 0) {
      users[existingIndex] = user
    } else {
      users.push(user)
    }
    
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }

  static getUserByEmail(email: string): StoredUser | null {
    const users = this.getUsers()
    return users.find(u => u.email === email) || null
  }

  static validateCredentials(email: string, password: string): StoredUser | null {
    const user = this.getUserByEmail(email)
    if (user && user.password === password) {
      return user
    }
    return null
  }

  static createUser(userData: Omit<StoredUser, 'id'>): StoredUser {
    const user: StoredUser = {
      ...userData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }
    
    // Set default values for athletes
    if (user.userType === UserType.ATHLETE) {
      user.currentRating = user.currentRating || 1200
      user.peakRating = user.peakRating || user.currentRating
      user.gamesPlayed = user.gamesPlayed || 0
      user.wins = user.wins || 0
      user.losses = user.losses || 0
    }
    
    // Set default values for clubs
    if (user.userType === UserType.CLUB) {
      user.athletesCount = user.athletesCount || 0
      user.tournamentsCreated = user.tournamentsCreated || 0
      user.activeTournaments = user.activeTournaments || 0
    }
    
    this.saveUser(user)
    return user
  }

  static setSession(user: StoredUser): void {
    const session: AuthSession = {
      user,
      isAuthenticated: true
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  }

  static getSession(): AuthSession | null {
    try {
      const session = localStorage.getItem(SESSION_KEY)
      return session ? JSON.parse(session) : null
    } catch {
      return null
    }
  }

  static clearSession(): void {
    localStorage.removeItem(SESSION_KEY)
  }

  static isAuthenticated(): boolean {
    const session = this.getSession()
    return session?.isAuthenticated || false
  }

  static getCurrentUser(): StoredUser | null {
    const session = this.getSession()
    return session?.user || null
  }

  static updateUser(updatedUser: StoredUser): void {
    this.saveUser(updatedUser)
    // Update session if it's the current user
    const session = this.getSession()
    if (session && session.user.id === updatedUser.id) {
      this.setSession(updatedUser)
    }
  }
}