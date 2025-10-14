'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Trophy, 
  Users, 
  Calendar, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Menu,
  Bell,
  Search,
  Building2,
  Star,
  BarChart3,
  Plus
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { UserType } from '@/lib/types'

interface DashboardLayoutProps {
  children: React.ReactNode
  currentUser?: {
    id: string
    name: string
    email: string
    avatar?: string
    userType: UserType
    currentRating?: number
    city?: string
  }
}

const athleteNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Torneios', href: '/tournaments', icon: Trophy },
  { name: 'Rankings', href: '/rankings', icon: TrendingUp },
  { name: 'Jogadores', href: '/players', icon: Users },
  { name: 'Desafios', href: '/challenges', icon: Star },
  { name: 'Agenda', href: '/calendar', icon: Calendar },
]

const clubNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Meus Torneios', href: '/my-tournaments', icon: Trophy },
  { name: 'Criar Torneio', href: '/create-tournament', icon: Plus },
  { name: 'Atletas', href: '/athletes', icon: Users },
  { name: 'Estatísticas', href: '/statistics', icon: BarChart3 },
  { name: 'Configurações', href: '/settings', icon: Settings },
]

export function DashboardLayout({ children, currentUser }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = currentUser?.userType === UserType.CLUB ? clubNavigation : athleteNavigation
  const isClub = currentUser?.userType === UserType.CLUB

  const handleSignOut = () => {
    // Implement sign out logic
    window.location.href = '/'
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">🏓</div>
          <span className="text-lg font-bold text-blue-600">TM Pro</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => (
          <a
            key={item.name}
            href={item.href}
            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </a>
        ))}
      </nav>
      
      {/* User Type Badge */}
      <div className="px-4 pb-4">
        <Badge 
          variant={isClub ? "default" : "secondary"} 
          className="w-full justify-center"
        >
          {isClub ? (
            <>
              <Building2 className="h-3 w-3 mr-1" />
              Conta Clube
            </>
          ) : (
            <>
              <Star className="h-3 w-3 mr-1" />
              Conta Atleta
            </>
          )}
        </Badge>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white border-b border-gray-200">
          {/* Mobile menu button */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="px-4 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              <div className="flex w-full md:ml-0">
                <div className="relative w-full max-w-md">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <Input
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500"
                    placeholder={isClub ? "Buscar atletas, torneios..." : "Buscar jogadores, torneios..."}
                    type="search"
                  />
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <Button variant="ghost" size="sm" className="p-2">
                <Bell className="h-5 w-5" />
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative ml-3 p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser?.avatar} />
                      <AvatarFallback>
                        {currentUser?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{currentUser?.name || 'Usuário'}</p>
                      <p className="text-xs text-gray-500">{currentUser?.email}</p>
                      {!isClub && currentUser?.currentRating && (
                        <p className="text-xs text-blue-600">Rating: {currentUser.currentRating}</p>
                      )}
                      {currentUser?.city && (
                        <p className="text-xs text-gray-500">{currentUser.city}</p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}