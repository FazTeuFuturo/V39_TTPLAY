// src/components/tournament/TournamentAdministration.tsx

'use client'

import { Registration } from '@/lib/types';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Trophy, Users, Calendar, MapPin, Settings, 
  UserPlus, Play, Shuffle, ArrowLeft, CheckCircle,
  Clock, Target, Award, AlertCircle, Edit, Crown, Loader2, Trash2, LockOpen
} from 'lucide-react'
import { Tournament, TournamentStatus } from '@/lib/types'
import { SupabaseTournaments, SupabaseTournamentRegistration } from '@/lib/supabase-tournaments'
import { supabase } from '@/lib/supabase'

import { GroupCustomization } from './GroupCustomization'
import { MatchManager } from './MatchManager'
import { BracketManager } from './BracketManager'
import { RegistrationManager } from './RegistrationManager'


interface TournamentGroup {
  id: string
  name: string
  category: string
  athletes: EnrichedRegistration[]
}

interface TournamentAdministrationProps {
  tournament: Tournament
  onBack: () => void
  onUpdate: (tournament: Tournament) => void
}

export function TournamentAdministration({ tournament: initialTournament, onBack, onUpdate }: TournamentAdministrationProps) {
  const [tournament, setTournament] = useState<Tournament>(initialTournament)
  const [activeTab, setActiveTab] = useState('overview')
  const [showGroupCustomization, setShowGroupCustomization] = useState(false)
  const [showMatchManager, setShowMatchManager] = useState(false)
  const [showBracketManager, setShowBracketManager] = useState(false)
  const [registeredAthletes, setRegisteredAthletes] = useState<Registration[]>([]); // <-- Use Registration[]
  const [groups, setGroups] = useState<TournamentGroup[]>([])
  const [tournamentCategories, setTournamentCategories] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Função auxiliar: Verifica se as inscrições estão abertas (fonte da verdade: registration_deadline)
  const areRegistrationsOpen = () => {
    return new Date() < new Date(tournament.registration_deadline)
  }

  // Função para carregar dados do torneio
  const loadTournamentData = async () => {
    setIsLoading(true)
    setError('')
    try {
      // 1. Carrega dados do torneio
      const latestTournamentData = await SupabaseTournaments.getTournamentById(tournament.id)
      if (!latestTournamentData) throw new Error("Torneio não encontrado.")
      setTournament(latestTournamentData as Tournament)

      // 2. Busca as inscrições (apenas IDs)
      const { data: registrationsData, error: registrationsError } = await supabase
        .from('app_5732e5c77b_tournament_registrations')
        .select('id, athlete_id')
        .eq('tournament_id', tournament.id)
      
      if (registrationsError) throw registrationsError
      
      if (!registrationsData || registrationsData.length === 0) {
        setRegisteredAthletes([])
        setGroups([])
        setIsLoading(false)
        return
      }
      
      const athleteIds = registrationsData.map(reg => reg.athlete_id)
      
      // 3. Busca dados dos usuários
      const { data: usersData, error: usersError } = await supabase
        .from('app_5732e5c77b_users')
        .select('id, name, email')
        .in('id', athleteIds)
      
      if (usersError) throw usersError
      
      // 4. Busca dados dos atletas
      const { data: athletesData, error: athletesError } = await supabase
        .from('app_5732e5c77b_athletes')
        .select('id, current_rating, city')
        .in('id', athleteIds)
      
      if (athletesError) throw athletesError
      
      // NOTA: Sua lógica atual de `registeredAthletes` não pega a categoria
      // corretamente. A RPC `get_tournament_registrations_details` seria melhor aqui.
    const athletes: Registration[] = usersData?.map((user: any) => {
    const athleteData = athletesData?.find((a: any) => a.id === user.id);
    const registrationData = registrationsData?.find((r: any) => r.athlete_id === user.id); // Pega a data de registro
        return {
        id: user.id,
        athleteId: user.id,
        athleteName: user.name,
        athleteRating: athleteData?.current_rating || 1200,
        athleteLevel: athleteData?.playing_level || null, // Preenche athleteLevel
        athleteCity: athleteData?.city || null,         // Preenche athleteCity
        category: 'Geral', // Precisa buscar a categoria real aqui
        registeredAt: registrationData?.registered_at ? new Date(registrationData.registered_at) : new Date() // Preenche registeredAt
    }
      }) || []
      setRegisteredAthletes(athletes)

      // 6. Carrega as categorias do torneio (Mantém sua lógica original)
      const { data: tournamentCategoriesData, error: tcError } = await supabase
          .from('app_5732e5c77b_tournament_categories')
          .select('category_id, price')
          .eq('tournament_id', tournament.id);

      if (!tcError && tournamentCategoriesData && tournamentCategoriesData.length > 0) {
          const categoryIds = tournamentCategoriesData.map(tc => tc.category_id);
          const { data: categoriesData, error: catError } = await supabase
              .from('app_5732e5c77b_categories')
              .select('*') // Pega todos os campos da categoria
              .in('id', categoryIds);

          if (!catError && categoriesData) {
              const categoriesWithPrices = categoriesData.map(cat => {
                  const tcRelation = tournamentCategoriesData.find(tc => tc.category_id === cat.id);
                  return { ...cat, price: tcRelation?.price || 0 };
              });
              setTournamentCategories(categoriesWithPrices); // Salva as categorias completas
          }
      } else {
          setTournamentCategories([]); // Garante que esteja vazio se não houver categorias
      }

      // 7. CARREGA OS GRUPOS SALVOS (Substitui o setGroups([]) )
      console.log(`🔄 Carregando grupos para o torneio ID: ${tournament.id}`);
      const { data: savedGroupsData, error: groupsError } = await supabase
        .from('tournament_groups')
        .select(`
          id,
          name,
          category:app_5732e5c77b_categories(name)
        `)
        .eq('tournament_id', tournament.id);

      if (groupsError) throw groupsError;

      // Reconstrói o formato esperado pela sua interface TournamentGroup
      const reconstructedGroups: TournamentGroup[] = (savedGroupsData || []).map(group => ({
        id: group.id,
        name: group.name,
        category: group.category?.name || 'Sem Categoria',
        athletes: [] // Carregamos apenas a estrutura do grupo aqui para simplificar
      }));

      console.log(`✅ ${reconstructedGroups.length} grupos carregados.`);
      setGroups(reconstructedGroups); // <<< DEFINE OS GRUPOS CARREGADOS

    } catch (err: any) {
      setError("Falha ao carregar dados de administração: " + err.message)
      console.error(err);
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTournamentData()
  }, [])

useEffect(() => {
  // Sincroniza o estado local quando o prop mudar
  console.log('🔄 Prop initialTournament mudou:', initialTournament.registration_deadline);
  setTournament(initialTournament);
}, [initialTournament.registration_deadline, initialTournament.status])

  // NOVA LÓGICA: Encerrar inscrições alterando apenas a registration_deadline
const handleCloseRegistrations = async () => {
    console.log('%c--- Botão ENCERRAR clicado ---', 'color: orange; font-weight: bold;');
    if (window.confirm('Tem certeza que deseja encerrar as inscrições imediatamente?')) {
        try {
            const now = new Date().toISOString();
            
            console.log('Tentando ATUALIZAR o torneio ID:', tournament.id, 'para a data:', now);

            // 1. Captura o objeto de resultado COMPLETO
            const result = await supabase
                .from('app_5732e5c77b_tournaments')
                .update({ registration_deadline: now })
                .eq('id', tournament.id)
                .select(); // Essencial para obter uma resposta

            // 2. MOSTRA EXATAMENTE O QUE O SUPABASE RESPONDEU
            console.log('%cRESPOSTA COMPLETA DO SUPABASE (FECHAR):', 'color: red; font-weight: bold;', result);

            // 3. Verifica o erro a partir do objeto 'result'
            if (result.error) {
                throw result.error;
            }

            // Se a UI ainda não persistir, o problema pode ser o count ser 0
            if (result.count === 0) {
                 console.warn('Supabase respondeu com sucesso, mas 0 linhas foram alteradas. Verifique as permissões RLS ou o ID do torneio.');
            }
            
            console.log('Atualização no Supabase bem-sucedida. Atualizando a UI...');
            const updatedTournament = { ...tournament, registration_deadline: now };
            setTournament(updatedTournament);
            onUpdate(updatedTournament);
            setMessage('Inscrições encerradas com sucesso!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            console.error('ERRO DETALHADO CAPTURADO NO CATCH (FECHAR):', err);
            setError('Falha ao encerrar inscrições: ' + err.message);
        }
    }
};
  // NOVA FUNÇÃO: Reabrir inscrições estendendo a registration_deadline
const handleReopenRegistrations = async () => {
    console.log('%c--- Botão REABRIR clicado ---', 'color: cyan; font-weight: bold;');
    if (window.confirm('Deseja reabrir as inscrições por mais 7 dias?')) {
        try {
            const newDeadline = new Date();
            newDeadline.setDate(newDeadline.getDate() + 7);
            const newDeadlineISO = newDeadline.toISOString();

            console.log('Tentando ATUALIZAR o torneio ID:', tournament.id, 'para a data:', newDeadlineISO);
            
            // 1. Captura o objeto de resultado COMPLETO
            const result = await supabase
                .from('app_5732e5c77b_tournaments')
                .update({ registration_deadline: newDeadlineISO })
                .eq('id', tournament.id)
                .select(); // Essencial para obter uma resposta

            // 2. MOSTRA EXATAMENTE O QUE O SUPABASE RESPONDEU
            console.log('%cRESPOSTA COMPLETA DO SUPABASE (REABRIR):', 'color: lightgreen; font-weight: bold;', result);

            // 3. Verifica o erro a partir do objeto 'result'
            if (result.error) {
                throw result.error;
            }

            if (result.count === 0) {
                 console.warn('Supabase respondeu com sucesso, mas 0 linhas foram alteradas. Verifique as permissões RLS ou o ID do torneio.');
            }

            console.log('Atualização no Supabase bem-sucedida. Atualizando a UI...');
            const updatedTournament = { ...tournament, registration_deadline: newDeadlineISO };
            setTournament(updatedTournament);
            onUpdate(updatedTournament);
            setMessage('Inscrições reabertas até ' + newDeadline.toLocaleDateString('pt-BR'));
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            console.error('ERRO DETALHADO CAPTURADO NO CATCH (REABRIR):', err);
            setError('Falha ao reabrir inscrições: ' + err.message);
        }
    }
};

  // Funções de mudança de status do torneio (separado das inscrições)
  const handleStartTournament = async () => {
    if (window.confirm('Tem certeza que deseja iniciar o torneio?')) {
      const success = await SupabaseTournaments.updateTournamentStatus(tournament.id, TournamentStatus.IN_PROGRESS)
      if (success) {
        const updatedTournament = { ...tournament, status: TournamentStatus.IN_PROGRESS }
        setTournament(updatedTournament)
        onUpdate(updatedTournament)
        setMessage('Torneio iniciado com sucesso!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError('Falha ao iniciar o torneio.')
      }
    }
  }

  const handleCompleteTournament = async () => {
    if (window.confirm('Tem certeza que deseja finalizar o torneio?')) {
      const success = await SupabaseTournaments.updateTournamentStatus(tournament.id, TournamentStatus.COMPLETED)
      if (success) {
        const updatedTournament = { ...tournament, status: TournamentStatus.COMPLETED }
        setTournament(updatedTournament)
        onUpdate(updatedTournament)
        setMessage('Torneio finalizado com sucesso!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setError('Falha ao finalizar o torneio.')
      }
    }
  }
  
  const handleGroupsSaved = () => {
    setShowGroupCustomization(false)
    setMessage('Grupos salvos com sucesso! Recarregando dados...')
    loadTournamentData()
  }

  const formatDate = (date: any): string => {
    if (!date) return 'Data não definida'
    try {
      const dateObj = date instanceof Date ? date : new Date(date)
      if (isNaN(dateObj.getTime())) return 'Data inválida'
      return dateObj.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Data inválida'
    }
  }

  // Função para obter badge do status das inscrições
  const getRegistrationStatusBadge = () => {
    if (areRegistrationsOpen()) {
      return <Badge className="bg-green-500">Inscrições Abertas</Badge>
    } else {
      return <Badge variant="secondary">Inscrições Encerradas</Badge>
    }
  }

  // Função para obter badge do status do torneio
  const getTournamentStatusBadge = () => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      draft: { label: 'Rascunho', variant: 'outline' },
      open: { label: 'Aberto', variant: 'default' },
      closed: { label: 'Fechado', variant: 'secondary' },
      in_progress: { label: 'Em Andamento', variant: 'default' },
      completed: { label: 'Finalizado', variant: 'secondary' },
      cancelled: { label: 'Cancelado', variant: 'destructive' }
    }
    
    const config = statusConfig[tournament.status] || { label: tournament.status, variant: 'outline' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // Lógica para os sub-componentes (modais)
  if (showGroupCustomization) {
  return <GroupCustomization 
    tournament={tournament} 
    registeredAthletes={registeredAthletes}
    tournamentCategories={tournamentCategories}
    onSave={handleGroupsSaved} 
    onBack={() => setShowGroupCustomization(false)} 
  />
}

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tournament.name}</h1>
            <p className="text-muted-foreground">
              Administração • {registeredAthletes.length} atletas inscritos
              <br />
              <span className="text-sm">
                Prazo: {formatDate(tournament.registration_deadline)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {getRegistrationStatusBadge()}
          {getTournamentStatusBadge()}
        </div>
      </div>

      {message && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="overview">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="registrations">Inscrições</TabsTrigger>
              <TabsTrigger value="groups">Grupos</TabsTrigger>
              <TabsTrigger value="matches">Partidas</TabsTrigger>
              <TabsTrigger value="eliminations">Eliminatórias</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <Card>
                  <CardContent className="p-6 text-center">
                    <UserPlus className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-3xl font-bold">{registeredAthletes.length}</p>
                    <p className="text-sm text-muted-foreground">Inscrições</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-green-500" />
                    <p className="text-3xl font-bold">{groups.length}</p>
                    <p className="text-sm text-muted-foreground">Grupos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Play className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                    <p className="text-3xl font-bold">0/0</p>
                    <p className="text-sm text-muted-foreground">Partidas</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Trophy className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                    <p className="text-3xl font-bold">0/0</p>
                    <p className="text-sm text-muted-foreground">Eliminatórias</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <Crown className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Campeões</p>
                  </CardContent>
                </Card>
              </div>

              {/* Card de informações do torneio */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Informações do Torneio</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Início</p>
                    <p className="font-semibold">{formatDate(tournament.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Término</p>
                    <p className="font-semibold">{formatDate(tournament.end_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Local</p>
                    <p className="font-semibold">{tournament.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Formato</p>
                    <p className="font-semibold">{tournament.format}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

<TabsContent value="registrations" className="mt-4">
  <Card>
    <CardHeader>
      <div className="flex justify-between items-center">
        <div>
          <CardTitle>Gerenciar Inscrições</CardTitle>
          <CardDescription>
            {registeredAthletes.length} atletas inscritos • 
            Prazo: {formatDate(tournament.registration_deadline)}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {areRegistrationsOpen() ? (
            <Button onClick={handleCloseRegistrations} variant="outline">
              <Clock className="h-4 w-4 mr-2"/>
              Encerrar Inscrições
            </Button>
          ) : (
            <Button onClick={handleReopenRegistrations} variant="outline">
              <LockOpen className="h-4 w-4 mr-2"/>
              Reabrir Inscrições
            </Button>
          )}
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {showMatchManager ? (
        <RegistrationManager 
          tournament={tournament}
          onClose={() => setShowMatchManager(false)}
          onUpdate={(updatedTournament) => {
            setTournament(updatedTournament)
            onUpdate(updatedTournament)
            loadTournamentData()
          }}
        />
      ) : (
        <div className="text-center space-y-4 p-8">
          <UserPlus className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-medium mb-2">Gerenciamento de Inscrições</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione ou remova atletas manualmente, busque por nome ou CPF, e gerencie as categorias.
            </p>
          </div>
          <Button onClick={() => setShowMatchManager(true)} size="lg">
            <UserPlus className="h-4 w-4 mr-2" />
            Abrir Gerenciador
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
            
            <TabsContent value="groups" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Gerenciamento de Grupos</CardTitle>
                  <CardDescription>
                    {!areRegistrationsOpen() 
                      ? 'Inscrições encerradas. Você pode gerar os grupos agora.' 
                      : 'Aguarde o encerramento das inscrições para gerar grupos.'}
                  </CardDescription>
                </CardHeader>
<CardContent className="space-y-4 p-4 md:p-6">
                    {isLoading ? ( // Usa o isLoading geral
                        <p className="text-center text-muted-foreground py-4">Carregando grupos...</p>
                    ) : groups.length === 0 ? (
                        // Estado vazio original
                        <div className="text-center p-8">
                            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Nenhum grupo gerado ainda</h3>
                        </div>
                    ) : (
                        // NOVO: Estado com grupos carregados
                        // Organiza por categoria
                        Object.entries(
                            groups.reduce((acc, group) => {
                                const categoryName = group.category || 'Sem Categoria';
                                if (!acc[categoryName]) acc[categoryName] = [];
                                acc[categoryName].push(group);
                                return acc;
                            }, {} as Record<string, TournamentGroup[]>) // Usa a sua interface TournamentGroup
                        ).map(([categoryName, categoryGroups]) => (
                            <Card key={categoryName}>
                                <CardHeader className="py-3 px-4">
                                    {/* Exibe o nome da categoria e quantos grupos */}
                                    <CardTitle className="flex justify-between items-center text-base">
                                        <span>{categoryName}</span>
                                        <Badge variant="outline">{categoryGroups.length} grupos</Badge>
                                    </CardTitle>
                                </CardHeader>
                                {/* Opcional: Mostrar os nomes dos grupos */}
                                {/* <CardContent className="flex flex-wrap gap-2 px-4 pb-3">
                                    {categoryGroups.map(group => (
                                        <Badge key={group.id} variant="secondary">
                                            {group.name.replace(`${categoryName} - `, '')}
                                        </Badge>
                                    ))}
                                </CardContent> 
                                */}
                            </Card>
                        ))
                    )}

                    {/* Botão para Gerenciar/Gerar Grupos (Mantém sua lógica) */}
                    <div className="text-center pt-4">
                        <Button
                            onClick={() => setShowGroupCustomization(true)}
                            disabled={areRegistrationsOpen()}
                            size="lg"
                        >
                            <Shuffle className="h-4 w-4 mr-2" />
                            {groups.length > 0 ? 'Gerenciar Grupos' : 'Gerar Grupos'}
                        </Button>
                        {areRegistrationsOpen() && (
                            <p className="text-xs text-muted-foreground mt-2">
                                As inscrições ainda estão abertas. Encerre-as primeiro para {groups.length > 0 ? 'gerenciar' : 'gerar'} os grupos.
                            </p>
                        )}
                    </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="matches" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Partidas</CardTitle>
                </CardHeader>
                <CardContent className="text-center p-8">
                  <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="eliminations" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Eliminatórias</CardTitle>
                </CardHeader>
                <CardContent className="text-center p-8">
                  <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        
          {/* Card de Controle do Torneio */}
          <Card>
            <CardHeader>
              <CardTitle>Controle do Torneio</CardTitle>
              <CardDescription>Gerencie o status e ciclo de vida do torneio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {tournament.status === TournamentStatus.OPEN && (
                  <Button onClick={handleStartTournament} disabled={areRegistrationsOpen()}>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Torneio
                  </Button>
                )}
                {tournament.status === TournamentStatus.IN_PROGRESS && (
                  <Button onClick={handleCompleteTournament}>
                    <Award className="h-4 w-4 mr-2" />
                    Finalizar Torneio
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => alert('Lógica para duplicar torneio a ser implementada')}
                >
                  Duplicar Torneio
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => alert('Lógica para remover torneio a ser implementada')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Torneio
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}