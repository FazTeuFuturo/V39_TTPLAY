// TournamentList.tsx - SUBSTITUIR CONTEÚDO COMPLETO

'use client'

import { useState, useEffect, useCallback } from 'react' // ADICIONADO: useCallback
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
// OBS: Assumimos que SupabaseCategories, SupabaseAuth e SupabaseTournaments estão corretos
import { SupabaseTournaments, SupabaseTournament } from '@/lib/supabase-tournaments'
import { SupabaseCategories, Category } from '@/lib/supabase-categories'
import { SupabaseAuth } from '@/lib/supabase-auth'
// O tipo SupabaseTournament agora tem Date objects (corrigido no módulo SupabaseTournaments)

interface TournamentListProps {
  onCreateTournament: () => void
  onEditTournament?: (tournament: SupabaseTournament) => void
  showCreateButton?: boolean
  userType: 'club' | 'athlete'
  onRegister?: (tournamentId: string) => void
  renderMode?: 'full' | 'simple'
}

// Funções utilitárias de formatação (ajustadas para receber Date object)
const formatDate = (date: Date) => {
  return date.toLocaleDateString('pt-BR', {
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


export function TournamentList({ 
  onCreateTournament, 
  onEditTournament, 
  showCreateButton = true,
  userType,
  onRegister,
  renderMode = 'full'
}: TournamentListProps) {
  const [tournaments, setTournaments] = useState<SupabaseTournament[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTournament, setSelectedTournament] = useState<SupabaseTournament | null>(null)
  const [tournamentCategories, setTournamentCategories] = useState<Category[]>([])

const renderEmptyState = (message: string) => (
      <Card>
          <CardContent className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{message}</p>
              {/* ... (o restante do código do botão 'Criar Torneio' se userType for club) */}
              {/* Note: Se o botão 'Criar Torneio' estiver no renderEmptyState, garanta que ele use 'onCreateTournament' */}
          </CardContent>
      </Card>
  );

  // =======================================================
  // FUNÇÃO DE CARREGAMENTO (Usa useCallback e lida com os 2 userTypes)
  // =======================================================

  const loadTournaments = useCallback(async () => {
    setLoading(true)
    const currentUser = await SupabaseAuth.getCurrentUser()
    
    if (!currentUser) {
      setLoading(false)
      return
    }

    let tournamentList: SupabaseTournament[] = [];
    
    try {
        if (userType === 'club') {
            // Busca para Club (torneios criados)
          tournamentList = await SupabaseTournaments.getTournamentsByClub(currentUser.id)
        } else {
            // Busca para Atleta (torneios abertos/disponíveis)
          tournamentList = await SupabaseTournaments.getAvailableTournaments()
        }
    
        setTournaments(tournamentList)
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        alert('Erro ao carregar lista de torneios. Verifique sua conexão ou tente novamente.')
        setTournaments([]);
    } finally {
        setLoading(false)
    }
  }, [userType]) // userType é a chave para a lógica

  useEffect(() => {
    loadTournaments()
  }, [loadTournaments]) // Depende da função de carregamento


  // =======================================================
  // HANDLERS CRUD E AÇÕES
  // =======================================================

  const handleDeleteTournament = async (tournamentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este torneio?')) {
      const success = await SupabaseTournaments.deleteTournament(tournamentId)
      if (success) {
        loadTournaments() // Recarrega a lista
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
      loadTournaments() // Recarrega a lista para atualizar a contagem ou remover o torneio
    } else {
      alert('Não foi possível realizar a inscrição. Verifique se o torneio ainda está aberto.')
    }
  }

  const handleViewTournament = async (tournament: SupabaseTournament) => {
    setSelectedTournament(tournament)
    const categories = await SupabaseCategories.getTournamentCategories(tournament.id)
    setTournamentCategories(categories)
  }

  // =======================================================
  // UTILS (Status e Condicionais)
  // =======================================================

// CORREÇÃO: Recebe objeto SupabaseTournament (que tem Date objects)
  const getStatusBadge = (tournament: SupabaseTournament) => {
    const now = new Date()
    // CORREÇÃO: Usa diretamente o objeto Date
    const deadline = tournament.registrationDeadline 
    const startDate = tournament.startDate
    const endDate = tournament.endDate

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
// Adicionar a função que renderiza um ÚNICO CARD (Usado nos dois modos)
const renderTournamentItem = (tournament: SupabaseTournament) => {
    // Note: Usamos 'players' para contagem, o que corrigimos antes
    const isFull = tournament.players.length >= tournament.maxParticipants;
    const isClosed = new Date() > tournament.registrationDeadline;
    
    return (
        <div key={tournament.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
                <p className="font-medium">{tournament.name}</p>
                {/* As datas são Date objects agora */}
                <p className="text-sm text-gray-500">
                    {tournament.startDate.toLocaleDateString()} - {tournament.endDate?.toLocaleDateString() || 'N/A'}
                </p>
            </div>
            
            {/* Botão de Inscrição/Visualização */}
            <Button 
                size="sm"
                // Se onRegister existir (ou seja, no Dashboard do Atleta), usamos ele
                onClick={() => onRegister ? onRegister(tournament.id) : handleViewTournament(tournament)}
                disabled={isFull || isClosed}
            >
                {isFull ? 'Lotado' : isClosed ? 'Encerrado' : 'Inscrever-se'}
            </Button>
        </div>
    );
};


  // =======================================================
  // RENDERIZAÇÃO
  // =======================================================

  // TournamentList.tsx - SUBSTITUIR o bloco de renderização (A partir de if (loading))

// ----------------------------------------------------------------------------------
// FUNÇÃO AUXILIAR DE RENDERIZAÇÃO DE ITEM (PARA O MODO CLUB E LISTA COMPLETA)
// ----------------------------------------------------------------------------------

// Em TournamentList.tsx, substitua esta função inteira:

const renderFullTournamentCard = (tournament: SupabaseTournament) => {
    const isClub = userType === 'club';
    // O erro "Cannot read properties of null (reading 'registrationDeadline')" pode acontecer se a prop não existir
    const registrationDeadline = tournament.registration_deadline ? new Date(tournament.registration_deadline) : new Date();
    const isClosed = new Date() > registrationDeadline;

    // A contagem de participantes agora precisa ser verificada de outra forma se 'players' não existir
    // Vamos assumir que por enquanto não temos essa informação na lista
    const isFull = false; // Ajustar se tiver a contagem de inscritos

    return (
        <Card key={tournament.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{tournament.name}</CardTitle>
                        <CardDescription className="mt-1">
                            {tournament.description || 'Sem descrição'}
                        </CardDescription>
                    </div>
                    {/* A função getStatusBadge pode precisar de ajuste também */}
                </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {/* CORREÇÃO DA DATA: Usa a propriedade 'start_date' do banco */}
                        <span>{new Date(tournament.start_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{tournament.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span>{tournament.max_participants} vagas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-gray-500" />
                        {/* CORREÇÃO DAS CATEGORIAS: Usa a propriedade 'categoryCount' */}
                        <span>{tournament.categoryCount} categorias</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    {isClub ? (
                        <>
                            {/* A prop 'onEditTournament' será corrigida no componente pai */}
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEditTournament && onEditTournament(tournament)}>
                                <Edit className="h-4 w-4 mr-1" /> Editar
                            </Button>
                            <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteTournament(tournament.id)}>
                                <Trash2 className="h-4 w-4 mr-1" /> Remover
                            </Button>
                        </>
                    ) : (
                        // Lógica para atleta, se necessário
                        <Button className="w-full" size="sm" disabled={isFull || isClosed}>
                            {isFull ? 'Lotado' : isClosed ? 'Encerrado' : 'Inscrever-se'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};


// ----------------------------------------------------------------------------------
// RENDERIZAÇÃO FINAL (Modos)
// ----------------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

// ----------------------------------------------------------------------------------
// Modo SIMPLE (Para a Visão Geral do Atleta - Mantendo o Layout Limpo)
// ----------------------------------------------------------------------------------

const renderSimpleOverview = () => {
    const tournamentsForOverview = tournaments.slice(0, 2); // Limita a 2 itens
    
    if (tournamentsForOverview.length === 0) {
        return (
            <div className="text-center py-4 text-gray-500">
                Nenhum torneio disponível no momento.
            </div>
        );
    }

    // Renderiza a lista simples de itens que se encaixam no Card Pai
    return (
        <div className="space-y-4">
            {tournamentsForOverview.map(tournament => (
                // Usamos um layout simplificado (div) para o modo overview
                <div key={tournament.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p className="font-medium">{tournament.name}</p>
                        <p className="text-xs text-gray-500">Local: {tournament.location}</p>
                        <p className="text-sm text-gray-500">
                            {tournament.startDate.toLocaleDateString()} - {tournament.endDate?.toLocaleDateString() || 'N/A'}
                        </p>
                    </div>
                    <Button 
                        size="sm"
                        onClick={() => onRegister ? onRegister(tournament.id) : handleRegisterForTournament(tournament.id)}
                        disabled={new Date() > tournament.registrationDeadline}
                    >
                        Inscrever-se
                    </Button>
                </div>
            ))}
        </div>
    );
};


// ----------------------------------------------------------------------------------
// RETORNO PRINCIPAL
// ----------------------------------------------------------------------------------

// Se for o modo SIMPLES (usado no Dashboard do Atleta), retorna a lista simples
if (renderMode === 'simple' && userType === 'athlete') {
    return renderSimpleOverview();
}


// Caso contrário, retorna o modo FULL (para a aba "Torneios" ou para o Dashboard do Clube)
const emptyMessage = userType === 'club' ? 'Nenhum torneio criado ainda' : 'Nenhum torneio disponível no momento';

return (
    <div className="space-y-6">
      {/* Título - Modo CLUB ou MODO FULL ATLETA */}
      {userType === 'athlete' && (
        <div>
          <h2 className="text-2xl font-bold">Torneios Disponíveis</h2>
          <p className="text-gray-600">Encontre e inscreva-se em torneios próximos a você</p>
        </div>
      )}
      
      {tournaments.length === 0 ? (
        renderEmptyState(emptyMessage)
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((tournament) => renderFullTournamentCard(tournament))}
        </div>
      )}
    </div>
  )
}