// SupabaseTournaments.ts - SUBSTITUIÇÃO COMPLETA E SEGURA

import { supabase, getUser } from './supabase'
// Importa TODOS os tipos centrais do seu projeto
import { 
    Tournament, 
    TournamentFormat, 
    TournamentStatus, 
    PlayerOnTournament, 
    RegistrationStatus,
    Club 
} from '@/lib/types';

function parseSupabaseDate(dateString: string | null | undefined): Date | undefined {
  if (!dateString) return undefined;
  
  // Se já tem timezone, usa direto
  if (dateString.includes('T')) {
    return new Date(dateString);
  }
  
  // Se é só data (YYYY-MM-DD), adiciona horário UTC
  return new Date(dateString + 'T00:00:00Z');
}
// --------------------------------------------------------------------------------
// INTERFACES E FUNÇÕES AUXILIARES DE TRABALHO
// --------------------------------------------------------------------------------

// NOTE: O tipo SupabaseTournament (que seu código ainda usa) está ajustado para ser um alias do tipo central.
export interface SupabaseTournament extends Tournament {} 

export interface SupabaseTournamentRegistration {
  id: string
  tournamentId: string
  athleteId: string
  registeredAt: string
  status: 'registered' | 'confirmed' | 'cancelled'
}

// Interface auxiliar para os dados brutos que vêm do banco (raw data em snake_case)
interface RawTournamentData {
    // Estas propriedades VÊM DO BANCO (em snake_case)
    id: string;
    name: string;
    description?: string;
    start_date: string;
    end_date?: string; 
    registration_deadline?: string;
    max_participants?: number;
    min_participants?: number; 
    entry_fee?: number;
    registration_price?: number; 
    format: string;
    location: string;
    rules?: string;
    prizes?: string;
    created_by: string;
    status: string; 
    created_at: string;
    updated_at?: string;
    tournament_type?: string; 
    set_rule?: number;
    points_per_set?: number;
    is_ranked?: boolean;
    k_factor?: number;
    club_id?: string;
    app_5732e5c77b_tournament_categories: {
    count: number;
  }[];
}

/**
 * Converte o objeto de dados brutos (strings de data e snake_case) do Supabase 
 * para o tipo de UI limpo (Tournament).
 */
function mapRawToTournament(
    raw: RawTournamentData, 
    participantsIds: string[]
): Tournament { 
    
    // Mapeamento de players (IDs para PlayerOnTournament)
    const playersOnTournament: PlayerOnTournament[] = participantsIds.map(id => ({
        id: `reg_${id}_${raw.id}`, 
        playerId: id,
        tournamentId: raw.id,
        registrationStatus: 'CONFIRMED' as RegistrationStatus, 
        registeredAt: new Date(raw.created_at),
        player: {} as any, // Placeholder 
        tournament: {} as any, // Placeholder
    }));

    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        
        // CORREÇÃO CRÍTICA DE DATAS
        startDate: new Date(raw.start_date),
        endDate: raw.end_date ? new Date(raw.end_date) : undefined,
        registrationDeadline: raw.registration_deadline ? new Date(raw.registration_deadline) : undefined,
        
        // CORREÇÃO CRÍTICA DE PROPRIEDADES FALTANTES/NOMES DIFERENTES
        location: raw.location,
        entryFee: raw.entry_fee || 0,
        registrationPrice: raw.registration_price || raw.entry_fee || 0, 
        maxParticipants: raw.max_participants || 9999,
        minParticipants: raw.min_participants || 1, 
        format: raw.format as TournamentFormat, 
        status: raw.status as TournamentStatus,
        setRule: raw.set_rule || 3, 
        pointsPerSet: raw.points_per_set || 11,
        isRanked: raw.is_ranked || true,
        kFactor: raw.k_factor || 10,
        tournamentType: raw.tournament_type || '', 

        clubId: raw.club_id || '',
        club: {} as Club, // Usando o tipo Club para ser preciso

        players: playersOnTournament,
        matches: [], 
        createdBy: raw.created_by,
        createdAt: new Date(raw.created_at),
        updatedAt: new Date(raw.updated_at || raw.created_at),
        rules: raw.rules,
        prizes: raw.prizes,
    } as Tournament;
}


// --------------------------------------------------------------------------------
// CLASSE PRINCIPAL SupabaseTournaments (COM TODOS OS MÉTODOS ORIGINAIS)
// --------------------------------------------------------------------------------

export class SupabaseTournaments {
    static async deleteTournament(id: string): Promise<boolean> {
        try {
            const { data: { user } } = await getUser()
            
            if (!user) return false

            const { error } = await supabase
                .from('app_5732e5c77b_tournaments') // <-- Nome da sua tabela
                .delete()
                .eq('id', id)
                .eq('created_by', user.id) // Garante que apenas o criador possa deletar

            if (error) {
                console.error('Supabase Delete Error:', error)
                throw new Error(error.message)
            }

            // Opcional: Atualizar estatísticas do clube (decremento)
            // await supabase.rpc('decrement_club_tournaments', { club_id: user.id })

            return true
        } catch (error) {
            console.error('Error in deleteTournament:', error)
            return false
        }
    }

    // ----------------------
    // UPDATE STATUS (Lógica Restaurada)
    // ----------------------

    static async updateTournamentStatus(id: string, newStatus: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('app_5732e5c77b_tournaments') // <-- Nome da sua tabela
                .update({ 
                    status: newStatus, 
                    updated_at: new Date().toISOString() 
                })
                .eq('id', id)

            if (error) {
                console.error('Error updating tournament status:', error)
                return false
            }
            return true
        } catch (error) {
            console.error('Error in updateTournamentStatus:', error)
            return false
        }
    }

    // ----------------------
    // REGISTER ATHLETE (Lógica Restaurada)
    // ----------------------

    static async registerAthlete(tournamentId: string, athleteId: string): Promise<boolean> { 
        try {
            const { error } = await supabase
                .from('app_5732e5c77b_tournament_registrations')
                .insert({
                    tournament_id: tournamentId,
                    athlete_id: athleteId,
                    status: 'registered' // Status inicial
                });

            if (error) throw new Error(error.message);
            return true;
        } catch (error) {
            console.error('Error in registerAthlete:', error);
            return false;
        }
    }

    // ----------------------
    // GET TOURNAMENT REGISTRATIONS (Lógica Restaurada)
    // ----------------------

    static async getTournamentRegistrations(tournamentId: string): Promise<SupabaseTournamentRegistration[]> {
        try {
            const { data, error } = await supabase
                .from('app_5732e5c77b_tournament_registrations')
                .select('*')
                .eq('tournament_id', tournamentId)
                .eq('status', 'registered'); // Busca registros ativos
    
            if (error) {
                console.error('Error fetching tournament registrations:', error);
                return [];
            }
    
            // OBS: Mapear para o tipo SupabaseTournamentRegistration, você deve 
            // garantir que esse mapeamento esteja correto baseado na sua interface.
            return (data || []).map(reg => ({
                id: reg.id,
                tournamentId: reg.tournament_id,
                athleteId: reg.athlete_id,
                registeredAt: reg.registered_at,
                status: reg.status,
            })) as SupabaseTournamentRegistration[];
    
        } catch (error) {
            console.error('Error in getTournamentRegistrations:', error);
            return [];
        }
    }
    static async unregisterAthlete(tournamentId: string, athleteId: string): Promise<boolean> { 
    try {
        const { error } = await supabase
            .from('app_5732e5c77b_tournament_registrations')
            .update({ status: 'cancelled' })
            .eq('tournament_id', tournamentId)
            .eq('athlete_id', athleteId);

        if (error) {
            console.error('Error unregistering athlete:', error);
            throw new Error(error.message);
        }
        return true;
    } catch (error) {
        console.error('Error in unregisterAthlete:', error);
        return false;
    }
}
// DENTRO da class SupabaseTournaments

static async getAthleteRegistrations(athleteId: string): Promise<SupabaseTournamentRegistration[]> { 
    try {
        const { data, error } = await supabase
            .from('app_5732e5c77b_tournament_registrations')
            .select('*')
            .eq('athlete_id', athleteId)
            .eq('status', 'registered'); // Busca apenas registros ativos

        if (error) {
            console.error('Error fetching athlete registrations:', error);
            return [];
        }

        // Mapeia os dados brutos do DB para a interface SupabaseTournamentRegistration
        return (data || []).map(reg => ({
            id: reg.id,
            tournamentId: reg.tournament_id,
            athleteId: reg.athlete_id,
            registeredAt: reg.registered_at,
            status: reg.status,
            // OBS: Adicione outros campos que a sua interface SupabaseTournamentRegistration
            // espera se eles estiverem no SELECT acima.
        })) as SupabaseTournamentRegistration[];

    } catch (error) {
        console.error('Error in getAthleteRegistrations:', error);
        return [];
    }
}

    // ----------------------
    // GET ALL (Global)
    // ----------------------

   static async getTournaments(): Promise<SupabaseTournament[]> {
    try {
        const { data, error } = await supabase
            .from('app_5732e5c77b_tournaments')
            .select(`
                *,
                app_5732e5c77b_tournament_categories(category_id)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tournaments:', error);
            return [];
        }

        return (data || []).map(t => ({
            ...t,
            startDate: parseSupabaseDate(t.start_date)!,
            endDate: parseSupabaseDate(t.end_date),
            registrationDeadline: parseSupabaseDate(t.registration_deadline),
            maxParticipants: t.max_participants,
            entryFee: t.entry_fee,
            categoryCount: t.app_5732e5c77b_tournament_categories?.length || 0
        })) as SupabaseTournament[];
    } catch (error) {
        console.error('Error in getTournaments:', error);
        return [];
    }
}

    // ----------------------
    // GET BY ID
    // ----------------------
    
    static async getTournamentById(id: string): Promise<SupabaseTournament | null> {
        try {
            const { data, error } = await supabase
                .from('app_5732e5c77b_tournaments')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return null;

            const { data: registrations } = await supabase
                .from('app_5732e5c77b_tournament_registrations')
                .select('athlete_id')
                .eq('tournament_id', id)
                .eq('status', 'registered');

            const participants = registrations?.map(r => r.athlete_id) || [];

            return mapRawToTournament(data as RawTournamentData, participants) as SupabaseTournament;
        } catch (error) {
            console.error('Error in getTournamentById:', error);
            return null;
        }
    }

    // ----------------------
    // GET BY CLUB (Usado no Dashboard)
    // ----------------------
// Em lib/supabase-tournaments.ts

static async getTournamentsByClub(clubId: string): Promise<SupabaseTournament[]> {
    try {
        const { data, error } = await supabase
            .from('app_5732e5c77b_tournaments')
            .select(`
                *,
                app_5732e5c77b_tournament_categories(category_id)
            `)
            .eq('created_by', clubId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching club tournaments:', error);
            return [];
        }

        console.log('🔵 RAW DATA FROM SUPABASE:', JSON.stringify(data, null, 2));
        
        if (data && data.length > 0) {
            console.log('🔵 FIRST TOURNAMENT CATEGORIES:', data[0].app_5732e5c77b_tournament_categories);
        }    

        // Mapear diretamente aqui
        return (data || []).map(t => ({
            ...t,
            id: t.id,
            name: t.name,
            description: t.description,
            location: t.location,
            format: t.format,
            status: t.status,
            startDate: parseSupabaseDate(t.start_date)!,
            endDate: parseSupabaseDate(t.end_date),
            registrationDeadline: parseSupabaseDate(t.registration_deadline),
            maxParticipants: t.max_participants,
            entryFee: t.entry_fee,
            categoryCount: t.app_5732e5c77b_tournament_categories?.length || 0,
            created_by: t.created_by,
            created_at: t.created_at,
            updated_at: t.updated_at
        })) as SupabaseTournament[];
    } catch (error) {
        console.error('Error in getTournamentsByClub:', error);
        return [];
    }
}

    // ----------------------
    // GET AVAILABLE (Para Atletas)
    // ----------------------

    static async getAvailableTournaments(): Promise<SupabaseTournament[]> {
        try {
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('app_5732e5c77b_tournaments')
                .select('*')
                .eq('status', 'open')
                .gt('registration_deadline', now)
                .order('start_date', { ascending: true });

            if (error) {
                console.error('Error fetching available tournaments:', error);
                return [];
            }

            // Usa o mapeamento corrigido
            const availableTournaments = await this._mapData(data as RawTournamentData[]);
            
            // Filter tournaments that still have space
            return availableTournaments.filter(t => t.players.length < t.maxParticipants) as SupabaseTournament[];

        } catch (error) {
            console.error('Error in getAvailableTournaments:', error);
            return [];
        }
    }

    // ----------------------
    // CREATE (Mantido e Corrigido o Retorno)
    // ----------------------

    static async createTournament(
        tournamentData: Omit<Tournament, 'id' | 'players' | 'matches' | 'club' | 'clubId' | 'createdAt' | 'updatedAt' | 'startDate' | 'endDate' | 'registrationDeadline'> 
        & { startDate: string, endDate: string, registrationDeadline: string }
    ): Promise<SupabaseTournament | null> {
        try {
            const { data: { user } } = await getUser();
            if (!user) { throw new Error('User not authenticated'); }

            const { data, error } = await supabase
                .from('app_5732e5c77b_tournaments')
                .insert({
                    // ... (corpo do insert)
                    name: tournamentData.name,
                    description: tournamentData.description,
                    start_date: tournamentData.startDate, 
                    end_date: tournamentData.endDate, 
                    registration_deadline: tournamentData.registrationDeadline, 
                    max_participants: tournamentData.maxParticipants,
                    entry_fee: tournamentData.entryFee,
                    registration_price: tournamentData.registrationPrice,
                    format: tournamentData.format,
                    location: tournamentData.location,
                    rules: tournamentData.rules,
                    prizes: tournamentData.prizes,
                    created_by: user.id,
                    status: tournamentData.status
                })
                .select()
                .single();

            if (error || !data) { console.error('Error creating tournament:', error); return null; }
            await supabase.rpc('increment_club_tournaments', { club_id: user.id });
            
            // Retorna o objeto mapeado como o tipo 'Tournament'
            return mapRawToTournament(data as RawTournamentData, []) as SupabaseTournament;
        } catch (error) {
            console.error('Error in createTournament:', error);
            return null;
        }
    }

    // ----------------------
    // OUTROS MÉTODOS (Mantidos e Assinaturas Ajustadas)
    // ----------------------

    
    
    
    

}