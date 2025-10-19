// src/components/tournament/RegistrationManager.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { 
  Users, UserPlus, UserMinus, Search, 
  CheckCircle, AlertCircle, X, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Tournament, TournamentCategory } from '@/lib/types'
import { SupabaseUser } from '@/lib/supabase-auth'

// Interface para representar uma inscrição com detalhes completos
interface EnrichedRegistration {
  registration_id: string;
  category_registration_id?: string;
  category_id: string;
  category_name: string;
  athlete: SupabaseUser;
}

// Interface para os detalhes das categorias do torneio
interface CategoryDetail {
    id: string;
    name: string;
    price: number;
    gender?: 'male' | 'female' | 'mixed';
    age_min?: number;
    age_max?: number;
    rating_min?: number;
    rating_max?: number;
}

interface RegistrationManagerProps {
  tournament: Tournament
  onClose: () => void
  onUpdate: (tournament: Tournament) => void
}

export function RegistrationManager({ tournament, onClose, onUpdate }: RegistrationManagerProps) {
  const [registrations, setRegistrations] = useState<EnrichedRegistration[]>([])
  const [searchedAthletes, setSearchedAthletes] = useState<SupabaseUser[]>([]);
  const [tournamentCategories, setTournamentCategories] = useState<CategoryDetail[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
        await Promise.all([
            loadRegistrations(),
            loadTournamentCategoryDetails()
        ]);
    } catch (err) {
      setError('Falha ao carregar dados do torneio.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [tournament.id]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Busca os detalhes completos das categorias deste torneio
  const loadTournamentCategoryDetails = async () => {
    const categoryIds = tournament.categories?.map(c => c.categoryId) || [];
    if (categoryIds.length === 0) {
        setTournamentCategories([]);
        return;
    }
    const { data, error } = await supabase
        .from('app_5732e5c77b_categories')
        .select('*')
        .in('id', categoryIds);

    if (error) {
        console.error("Error fetching category details:", error);
        return;
    }
    
    // Adiciona o preço à categoria
    const categoriesWithPrices = data.map(cat => {
        const catWithPrice = tournament.categories?.find(tc => tc.categoryId === cat.id);
        return { ...cat, price: catWithPrice?.price || 0 };
    });

    setTournamentCategories(categoriesWithPrices);
    // Seleciona a primeira categoria por padrão
    if (categoriesWithPrices.length > 0) {
        setSelectedCategoryId(categoriesWithPrices[0].id);
    }
  }

  const loadRegistrations = async () => {
    try {
      // Esta função RPC busca todos os inscritos e seus detalhes de forma segura e em uma única chamada
      const { data, error } = await supabase.rpc('get_tournament_registrations_details', { 
        p_tournament_id: tournament.id 
      });

      if (error) {
        console.error('Error calling RPC function:', error);
        throw error;
      }
      
      const formattedRegistrations: EnrichedRegistration[] = data.map((reg: any) => ({
        ...reg,
        athlete: { ...reg.athlete, userType: 'athlete' } // Garante a tipagem correta
      }));

      setRegistrations(formattedRegistrations);
    } catch (err) {
      console.error('Falha no loadRegistrations:', err);
      // Lança o erro para ser pego pelo 'catch' do loadInitialData
      throw err;
    }
  };
  // FUNÇÃO searchAthletes - VERSÃO CORRETA baseada no schema real
  const searchAthletes = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 3) {
      setSearchedAthletes([]);
      return;
    }
    setIsSearching(true);
    setError('');

    try {
      const cleanedTerm = term.replace(/\D/g, '');
      let athleteIds: string[] = [];

      // Busca 1: Por nome na tabela users
      const { data: usersByName, error: nameError } = await supabase
        .from('app_5732e5c77b_users')
        .select('id')
        .eq('user_type', 'athlete')
        .ilike('name', `%${term}%`)
        .limit(10);

      if (nameError) throw nameError;
      
      athleteIds = usersByName?.map(u => u.id) || [];

      // Busca 2: Por CPF na tabela athletes (se o termo for numérico)
      if (cleanedTerm.length >= 3) {
        const { data: athletesByCpf, error: cpfError } = await supabase
          .from('app_5732e5c77b_athletes')
          .select('id')
          .ilike('cpf', `%${cleanedTerm}%`)
          .limit(10);

        if (cpfError) throw cpfError;

        // Adiciona os IDs encontrados por CPF
        if (athletesByCpf && athletesByCpf.length > 0) {
          athleteIds = [...athleteIds, ...athletesByCpf.map(a => a.id)];
        }
      }

      // Remove duplicatas
      athleteIds = [...new Set(athleteIds)];

      if (athleteIds.length === 0) {
        setSearchedAthletes([]);
        setIsSearching(false);
        return;
      }

      // Busca os dados completos dos usuários encontrados
      const { data: usersData, error: usersError } = await supabase
        .from('app_5732e5c77b_users')
        .select('id, name, email, user_type')
        .in('id', athleteIds);

      if (usersError) throw usersError;

      // Busca os dados dos atletas correspondentes
      // Lembre-se: athletes.id = users.id (mesma chave!)
      const { data: athletesData, error: athletesError } = await supabase
        .from('app_5732e5c77b_athletes')
        .select('*')
        .in('id', athleteIds);

      if (athletesError) throw athletesError;

      // Criar mapa dos atletas
      const athletesMap = new Map(athletesData?.map(a => [a.id, a]) || []);

      // Montar o resultado final
      const formattedData: SupabaseUser[] = (usersData || []).map(user => {
        const athleteData = athletesMap.get(user.id);
        return {
          // Dados do athlete
          ...athleteData,
          // Dados do user (sobrescreve)
          id: user.id,
          name: user.name,
          email: user.email,
          userType: 'athlete',
        } as SupabaseUser;
      });

      setSearchedAthletes(formattedData);

    } catch (err: any) {
      console.error("Error searching athletes:", err);
      setError("Erro ao buscar atletas. Verifique as políticas RLS.");
      setSearchedAthletes([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // LÓGICA DE VALIDAÇÃO
  const getAthleteEligibility = (athlete: SupabaseUser, categoryId: string): { eligible: boolean, reason: string } => {
    const category = tournamentCategories.find(c => c.id === categoryId);
    if (!category) return { eligible: false, reason: 'Categoria não encontrada' };
    
    if (registrations.some(r => r.athlete.id === athlete.id && r.category_id === categoryId)) {
        return { eligible: false, reason: 'Já inscrito' };
    }

    const athleteAge = athlete.birth_date ? new Date().getFullYear() - new Date(athlete.birth_date).getFullYear() : undefined;
    if (athleteAge !== undefined) {
        if (category.age_min && athleteAge < category.age_min) return { eligible: false, reason: `Idade mínima: ${category.age_min}` };
        if (category.age_max && athleteAge > category.age_max) return { eligible: false, reason: `Idade máxima: ${category.age_max}` };
    }

    if (athlete.current_rating) {
        if (category.rating_min && athlete.current_rating < category.rating_min) return { eligible: false, reason: `Rating mínimo: ${category.rating_min}` };
        if (category.rating_max && athlete.current_rating > category.rating_max) return { eligible: false, reason: `Rating máximo: ${category.rating_max}` };
    }
    
    if (category.gender !== 'mixed' && athlete.gender && category.gender !== athlete.gender) {
        return { eligible: false, reason: 'Gênero incompatível' };
    }

    return { eligible: true, reason: '' };
  }

const handleRegisterAthlete = async (athlete: SupabaseUser, categoryId: string) => {
  setIsSubmitting(true);
  setError('');
  setMessage('');

  try {
    // 1. Verifica se já existe uma inscrição GERAL para o atleta neste torneio
    const { data: existingRegs } = await supabase
      .from('app_5732e5c77b_tournament_registrations')
      .select('id')
      .eq('tournament_id', tournament.id)
      .eq('athlete_id', athlete.id);

    let registrationId: string;

    if (existingRegs && existingRegs.length > 0) {
      registrationId = existingRegs[0].id;
    } else {
      // Se não existe, cria a inscrição GERAL
      const { data: newReg, error: regError } = await supabase
        .from('app_5732e5c77b_tournament_registrations')
        .insert({ tournament_id: tournament.id, athlete_id: athlete.id, status: 'registered' })
        .select('id')
        .single();
      if (regError) throw regError;
      registrationId = newReg.id;
    }

    // 2. Adiciona o atleta à CATEGORIA específica
    const categoryPrice = tournamentCategories.find(c => c.id === categoryId)?.price || 0;
    const { error: catError } = await supabase
      .from('app_5732e5c77b_registration_categories')
      .insert({ registration_id: registrationId, category_id: categoryId, price_paid: categoryPrice });

    if (catError) throw catError;

    // 3. Recarrega os dados e notifica o pai
    await loadRegistrations();
    onUpdate(tournament); // Força a atualização do ClubDashboard e do TournamentAdministration
    setSearchedAthletes([]);
    setSearchTerm('');
    setMessage(`${athlete.name} adicionado com sucesso!`);

  } catch (err: any) {
    console.error('Error registering athlete:', err);
    setError('Erro ao adicionar atleta: ' + err.message);
  } finally {
    setIsSubmitting(false);
  }
}

const handleUnregisterAthlete = async (registration: EnrichedRegistration) => {
  if (!confirm(`Remover ${registration.athlete.name} da categoria ${registration.category_name}?`)) return;

  setIsSubmitting(true);
  setError('');
  try {
    // 1. Deleta o registro da categoria específica
    const { error: deleteCatError } = await supabase
      .from('app_5732e5c77b_registration_categories')
      .delete()
      .eq('id', registration.category_registration_id);

    if (deleteCatError) throw deleteCatError;

    // 2. Verifica se o atleta ainda tem outras categorias neste torneio
    const { data: remainingCategories, error: checkError } = await supabase
      .from('app_5732e5c77b_registration_categories')
      .select('id')
      .eq('registration_id', registration.registration_id);

    if (checkError) throw checkError;

    // 3. Se não tem mais categorias, deleta o registro principal
    if (!remainingCategories || remainingCategories.length === 0) {
      await supabase
        .from('app_5732e5c77b_tournament_registrations')
        .delete()
        .eq('id', registration.registration_id);
    }

    // 4. Recarrega os dados locais e notifica o pai
    await loadRegistrations();
    onUpdate(tournament); // Força a atualização do ClubDashboard e do TournamentAdministration
    setMessage(`${registration.athlete.name} removido com sucesso!`);

  } catch (err: any) {
    console.error('Error removing registration:', err);
    setError('Erro ao remover inscrição: ' + err.message);
  } finally {
    setIsSubmitting(false);
  }
}

  const categoryRegistrations = registrations.filter(reg => reg.category_id === selectedCategoryId);
  const selectedCategoryDetails = tournamentCategories.find(c => c.id === selectedCategoryId);

  return (
    <TooltipProvider>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Inscrições</h2>
          <p className="text-muted-foreground">{tournament.name}</p>
        </div>
        <Button variant="outline" onClick={onClose}><X className="h-4 w-4 mr-2" /> Fechar</Button>
      </div>

      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-sm font-medium text-muted-foreground">Inscrições Totais</p><p className="text-2xl font-bold">{registrations.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm font-medium text-muted-foreground">Vagas Restantes</p><p className="text-2xl font-bold">{Math.max(0, tournament.maxParticipants - registrations.length)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm font-medium text-muted-foreground">Categorias</p><p className="text-2xl font-bold">{tournamentCategories.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Selecionar Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger><SelectValue placeholder="Escolha uma categoria para visualizar..." /></SelectTrigger>
            <SelectContent>
              {tournamentCategories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      
      {isLoading ? <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin text-muted-foreground" /> :
      selectedCategoryId && (
        <>
          <Card>
            <CardHeader>
                <CardTitle>Inscritos em "{selectedCategoryDetails?.name}"</CardTitle>
                <CardDescription>{categoryRegistrations.length} atleta(s) nesta categoria.</CardDescription>
            </CardHeader>
            <CardContent>
                {categoryRegistrations.length === 0 ? <p className="text-muted-foreground text-center p-4">Nenhum atleta inscrito nesta categoria.</p> :
                <div className="space-y-2">
                    {categoryRegistrations.map(reg => (
                        <div key={reg.registration_id + reg.category_id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                            <h4 className="font-medium">{reg.athlete.name}</h4>
                            <span className="text-sm text-muted-foreground">Rating: {reg.athlete.current_rating || 'N/A'} | Cidade: {reg.athlete.city || 'N/A'}</span>
                        </div>
                        <Button size="sm" variant="destructive" onClick={() => handleUnregisterAthlete(reg)} disabled={isSubmitting}>
                            <UserMinus className="h-4 w-4 mr-2"/> Remover
                        </Button>
                        </div>
                    ))}
                </div>
                }
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader><CardTitle>Adicionar Atleta Manualmente</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input placeholder="Buscar por Nome ou CPF..." className="pl-10" onChange={(e) => searchAthletes(e.target.value)} />
                </div>
                {isSearching ? <Loader2 className="mx-auto h-6 w-6 animate-spin"/> :
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchTerm.length >= 3 && searchedAthletes.length === 0 && <p className="text-muted-foreground text-center text-sm p-4">Nenhum atleta encontrado.</p>}
                    {searchedAthletes.map(athlete => {
                        const eligibility = getAthleteEligibility(athlete, selectedCategoryId);
                        return (
                            <div key={athlete.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                    <p className="font-medium">{athlete.name}</p>
                                    <p className="text-sm text-muted-foreground">Rating: {athlete.current_rating || 'N/A'} | {athlete.city || 'N/A'}</p>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div tabIndex={0}>
                                            <Button size="sm" onClick={() => handleRegisterAthlete(athlete, selectedCategoryId)} disabled={!eligibility.eligible}>
                                                <UserPlus className="h-4 w-4 mr-2" /> Adicionar
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    {!eligibility.eligible && <TooltipContent><p>{eligibility.reason}</p></TooltipContent>}
                                </Tooltip>
                            </div>
                        )
                    })}
                </div>
                }
            </CardContent>
          </Card>
        </>
      )}
    </div>
    </TooltipProvider>
  )
}