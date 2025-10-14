'use client'

import { useState, useEffect } from 'react'
import { AuthForms } from '@/components/auth/AuthForms'
import { AthleteDashboard } from '@/components/dashboard/AthleteDashboard'
import { ClubDashboard } from '@/components/dashboard/ClubDashboard'
import { SupabaseAuth } from '@/lib/supabase-auth'
import { UserType } from '@/lib/types'
import type { SupabaseUser } from '@/lib/supabase-auth'

export default function Index() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await SupabaseAuth.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuthSuccess = (userData: SupabaseUser) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    const { success } = await SupabaseAuth.logout()
    if (success) {
      setUser(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 p-6">
        <AuthForms onAuthSuccess={handleAuthSuccess} />
      </div>
    )
  }

  if (user.userType === UserType.ATHLETE) {
    return <AthleteDashboard user={user} onLogout={handleLogout} />
  }

  if (user.userType === UserType.CLUB) {
    return <ClubDashboard user={user} onLogout={handleLogout} />
  }

  return null
}