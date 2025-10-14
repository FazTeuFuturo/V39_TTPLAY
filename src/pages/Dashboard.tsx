'use client'

import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { AthleteDashboard } from '@/components/dashboard/AthleteDashboard'
import { ClubDashboard } from '@/components/dashboard/ClubDashboard'
import { UserType } from '@/lib/types'

// Mock data - in real app, this would come from API/database based on authentication
const mockAthleteUser = {
  id: '1',
  name: 'João Silva',
  email: 'joao@email.com',
  userType: UserType.ATHLETE,
  currentRating: 1450,
  peakRating: 1520,
  gamesPlayed: 25,
  wins: 18,
  losses: 7,
  playingLevel: 'Intermediário',
  city: 'São Paulo'
}

const mockClubUser = {
  id: '2',
  name: 'Clube Tênis de Mesa SP',
  email: 'contato@clubesp.com',
  userType: UserType.CLUB,
  city: 'São Paulo',
  state: 'SP',
  athletesCount: 28,
  tournamentsCreated: 12,
  activeTournaments: 2
}

export default function Dashboard() {
  // In a real app, you would get this from authentication context
  const userType = UserType.ATHLETE // This would be determined by auth
  const currentUser = userType === UserType.ATHLETE ? mockAthleteUser : mockClubUser

  return (
    <DashboardLayout currentUser={currentUser}>
      {userType === UserType.ATHLETE ? (
        <AthleteDashboard user={mockAthleteUser} />
      ) : (
        <ClubDashboard club={mockClubUser} />
      )}
    </DashboardLayout>
  )
}