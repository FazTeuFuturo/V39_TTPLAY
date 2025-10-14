'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Trophy, 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  Edit, 
  Trash2,
  Eye,
  Plus,
  Tag
} from 'lucide-react'
import { SupabaseTournaments } from '@/lib/supabase-tournaments'
import { SupabaseCategories, Category } from '@/lib/supabase-categories'
import { SupabaseAuth } from '@/lib/supabase-auth'
import type { SupabaseTournament } from '@/lib/supabase-tournaments'

interface TournamentListProps {
  onCreateTournament: () => void
  onEditTournament?: (tournament: SupabaseTournament) => void
  showCreateButton?: boolean
  userType: 'club' | 'athlete'
}

export function TournamentList({ 
  onCreateTournament, 
  onEditTournament, 
  showCreateButton = true,
  userType 
}: TournamentListProps) {
  const [tournaments, setTournaments] = useState<SupabaseTournament[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournament, setSelectedTournament] = useState<SupabaseTournament | null>(null)
  const [tournamentCategories, setTournamentCategories] = useState<Category[]>([])

  useEffect(() => {
    loadTournaments()
  }, [userType])

  const loadTournaments = async () => {
    setLoading(true)
    const currentUser = await SupabaseAuth.getCurrentUser()
    
    if (!currentUser) {
      setLoading(false)
      return
    }

    let tournamentList: SupabaseTournament[]
    
    if (userType === 'club') {
      // Show tournaments created by this club
      tournamentList = await SupabaseTournaments.getTournamentsByClub(currentUser.id)
    } else {
      // Show available tournaments for athletes
      tournamentList = await SupabaseTournaments.getAvailableTournaments()
    }
    
    setTournaments(tournamentList)
    setLoading(false)
  }

  const handleDeleteTournament = async (tournamentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este torneio?')) {
      const success = await SupabaseTournaments.deleteTournament(tournamentId)
      if (success) {
        loadTournaments()
      } else {
        alert('Erro ao excluir torneio')
      }
    }
  }

  const handleRegisterForTournament = async (tournamentId: string) => {
    const currentUser = await SupabaseAuth.getCurrentUser()
    if (!currentUser) return

    const success = await SupabaseTournaments.registerAthlete(tournamentId, currentUser.id)
    if (success) {
      alert('Inscrição realizada com sucesso!')
      loadTournaments()
    } else {
      alert('Não foi possível realizar a inscrição. Verifique se o torneio ainda está aberto.')
    }
  }

  const handleViewTournament = async (tournament: SupabaseTournament) => {
    setSelectedTournament(tournament)
    const categories = await SupabaseCategories.getTournamentCategories(tournament.id)
    setTournamentCategories(categories)
  }

  const getStatusBadge = (tournament: SupabaseTournament) => {
    const now = new Date()
    const deadline = new Date(tournament.registrationDeadline)
    const startDate = new Date(tournament.startDate)
    const endDate = new Date(tournament.endDate)

    if (now > endDate) {
      return <Badge variant="secondary">Finalizado</Badge>
    } else if (now > startDate) {
      return <Badge className="bg-orange-100 text-orange-800">Em Andamento</Badge>
    } else if (now > deadline) {
      return <Badge className="bg-yellow-100 text-yellow-800">Inscrições Encerradas</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">Inscrições Abertas</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showCreateButton && userType === 'club' && (
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Meus Torneios</h2>
            <p className="text-gray-600">Gerencie os torneios criados pelo seu clube</p>
          </div>
          <Button onClick={onCreateTournament}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Torneio
          </Button>
        </div>
      )}

      {userType === 'athlete' && (
        <div>
          <h2 className="text-2xl font-bold">Torneios Disponíveis</h2>
          <p className="text-gray-600">Encontre e inscreva-se em torneios próximos a você</p>
        </div>
      )}

      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {userType === 'club' 
                ? 'Nenhum torneio criado ainda'
                : 'Nenhum torneio disponível no momento'
              }
            </p>
            {userType === 'club' && (
              <Button onClick={onCreateTournament} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Torneio
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tournament.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {tournament.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  {getStatusBadge(tournament)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(tournament.startDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{tournament.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>
                      {tournament.participants.length}/{tournament.maxParticipants === 999999 ? '∞' : tournament.maxParticipants} participantes
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span>{tournament.entryFee > 0 ? formatCurrency(tournament.entryFee) : 'Gratuito'}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Inscrições até: {formatDate(tournament.registrationDeadline)}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {userType === 'club' ? (
                    <>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleViewTournament(tournament)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{selectedTournament?.name}</DialogTitle>
                          </DialogHeader>
                          {selectedTournament && (
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Informações Gerais</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p><strong>Tipo:</strong> {selectedTournament.tournamentType}</p>
                                    <p><strong>Formato:</strong> {selectedTournament.format}</p>
                                    <p><strong>Local:</strong> {selectedTournament.location}</p>
                                  </div>
                                  <div>
                                    <p><strong>Participantes:</strong> {selectedTournament.participants.length}/{selectedTournament.maxParticipants === 999999 ? '∞' : selectedTournament.maxParticipants}</p>
                                    <p><strong>Taxa:</strong> {selectedTournament.entryFee > 0 ? formatCurrency(selectedTournament.entryFee) : 'Gratuito'}</p>
                                    <p><strong>Status:</strong> {selectedTournament.status}</p>
                                  </div>
                                </div>
                              </div>

                              {selectedTournament.description && (
                                <div>
                                  <h4 className="font-medium mb-2">Descrição</h4>
                                  <p className="text-sm text-gray-600">{selectedTournament.description}</p>
                                </div>
                              )}

                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <Tag className="h-4 w-4" />
                                  Categorias ({tournamentCategories.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {tournamentCategories.map((category) => (
                                    <Badge key={category.id} variant="outline">
                                      {SupabaseCategories.getCategoryDisplayName(category)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {selectedTournament.rules && (
                                <div>
                                  <h4 className="font-medium mb-2">Regras</h4>
                                  <p className="text-sm text-gray-600">{selectedTournament.rules}</p>
                                </div>
                              )}

                              {selectedTournament.prizes && (
                                <div>
                                  <h4 className="font-medium mb-2">Premiação</h4>
                                  <p className="text-sm text-gray-600">{selectedTournament.prizes}</p>
                                </div>
                              )}

                              <div>
                                <h4 className="font-medium mb-2">Datas Importantes</h4>
                                <div className="text-sm space-y-1">
                                  <p><strong>Inscrições até:</strong> {formatDate(selectedTournament.registrationDeadline)}</p>
                                  <p><strong>Início:</strong> {formatDate(selectedTournament.startDate)}</p>
                                  <p><strong>Término:</strong> {formatDate(selectedTournament.endDate)}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      {onEditTournament && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onEditTournament(tournament)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteTournament(tournament.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleRegisterForTournament(tournament.id)}
                      disabled={
                        tournament.participants.length >= tournament.maxParticipants ||
                        new Date() > new Date(tournament.registrationDeadline)
                      }
                    >
                      {tournament.participants.length >= tournament.maxParticipants 
                        ? 'Lotado' 
                        : new Date() > new Date(tournament.registrationDeadline)
                        ? 'Encerrado'
                        : 'Inscrever-se'
                      }
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}