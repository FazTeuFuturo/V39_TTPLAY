// src/lib/supabase-tournaments.ts

import { supabase, getUser } from './supabase'
import {
    Tournament,
    TournamentFormat,
    TournamentStatus,
    PlayerOnTournament,
    RegistrationStatus,
    Club,
    TournamentCategory // Certifique-se de que este tipo existe em 'types.ts'
} from '@/lib/types';

// Função auxiliar para converter strings de data do Supabase em objetos Date
// Em src/lib/supabase-tournaments.ts

function parseSupabaseDate(dateString: string | null | undefined): Date | undefined {
  if (!dateString) return undefined;

  // Se já tem informações de hora/fuso (T ou Z), o construtor Date já lida corretamente.
  if (dateString.includes('T') || dateString.includes('Z')) {
    return new Date(dateString);
  }
  
  // Se é apenas uma data (YYYY-MM-DD), adiciona T00:00:00Z para forçar a interpretação como UTC.
  return new Date(dateString + 'T00:00:00Z');
}

// Alias para manter a compatibilidade com o resto do código
export interface SupabaseTournament extends Tournament {}

export interface SupabaseTournamentRegistration {
  id: string
  tournamentId: string
  athleteId: string
  registeredAt: string
  status: 'registered' | 'confirmed' | 'cancelled'
}


/**
 * Converte os dados brutos do Supabase para o formato de Torneio da UI.
 * Centraliza a lógica de mapeamento e cálculos.
 */
function mapRawToTournament(raw: any): SupabaseTournament {
    const participantCount = raw.app_5732e5c77b_tournament_registrations?.[0]?.count || 0;
    // O Supabase retorna as categorias como um array, então usamos o length.
    const categoryCount = raw.app_5732e5c77b_tournament_categories?.length || 0;

    const tournament: SupabaseTournament = {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        startDate: parseSupabaseDate(raw.start_date)!,
        endDate: parseSupabaseDate(raw.end_date),
        registrationDeadline: parseSupabaseDate(raw.registration_deadline)!,
        location: raw.location,
        entryFee: raw.entry_fee || 0,
        registrationPrice: raw.registration_price || raw.entry_fee || 0,
        maxParticipants: raw.max_participants || 9999,
        minParticipants: raw.min_participants || 1,
        format: raw.format as TournamentFormat,
        status: raw.status as TournamentStatus,
        setRule: raw.set_rule || 3,
        pointsPerSet: raw.points_per_set || 11,
        isRanked: raw.is_ranked ?? true,
        kFactor: raw.k_factor || 32,
        tournamentType: raw.tournament_type || 'individual',
        clubId: raw.club_id || '',
        club: {} as Club, // Placeholder
        players: Array(participantCount).fill({} as PlayerOnTournament), // Cria um array com o tamanho correto
        matches: [], // Placeholder
        createdBy: raw.created_by,
        createdAt: new Date(raw.created_at),
        updatedAt: raw.updated_at ? new Date(raw.updated_at) : new Date(raw.created_at),
        rules: raw.rules,
        prizes: raw.prizes,
        // Propriedades calculadas para a UI
        categoryCount: categoryCount,
        participantCount: participantCount,
        // Mapeia as categorias para o formato esperado pelo formulário de edição
        categories: raw.app_5732e5c77b_tournament_categories?.map((c: any) => ({
             categoryId: c.category_id,
             price: c.price
        })) || []
    };
    return tournament;
}


export class SupabaseTournaments {

    static async deleteTournament(id: string): Promise<boolean> {
        try {
            const { data: { user } } = await getUser();
            if (!user) return false;
            const { error } = await supabase.from('app_5732e5c77b_tournaments').delete().eq('id', id).eq('created_by', user.id);
            if (error) throw new Error(error.message);
            return true;
        } catch (error) {
            console.error('Error in deleteTournament:', error);
            return false;
        }
    }

    static async updateTournamentStatus(id: string, newStatus: string): Promise<boolean> {
        try {
            const { error } = await supabase.from('app_5732e5c77b_tournaments').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
            if (error) {
                console.error('Error updating tournament status:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error in updateTournamentStatus:', error);
            return false;
        }
    }

    static async getTournamentsByClub(clubId: string): Promise<SupabaseTournament[]> {
        try {
            const { data, error } = await supabase
                .from('app_5732e5c77b_tournaments')
                .select(`
                    *,
                    app_5732e5c77b_tournament_categories(category_id, price),
                    app_5732e5c77b_tournament_registrations(count)
                `)
                .eq('created_by', clubId)
                .order('start_date', { ascending: false });

            if (error) {
                console.error('Error fetching club tournaments:', error);
                return [];
            }
            return (data || []).map(mapRawToTournament);
        } catch (error) {
            console.error('Error in getTournamentsByClub:', error);
            return [];
        }
    }

    static async getAvailableTournaments(): Promise<SupabaseTournament[]> {
        try {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('app_5732e5c77b_tournaments')
                .select(`
                    *,
                    app_5732e5c77b_tournament_categories(category_id, price),
                    app_5732e5c77b_tournament_registrations(count)
                `)
                .eq('status', 'open')
                .gt('registration_deadline', now)
                .order('start_date', { ascending: true });

            if (error) {
                console.error('Error fetching available tournaments:', error);
                return [];
            }
            const mappedData = (data || []).map(mapRawToTournament);
            return mappedData.filter(t => t.participantCount! < t.maxParticipants);
        } catch (error) {
            console.error('Error in getAvailableTournaments:', error);
            return [];
        }
    }

// Em src/lib/supabase-tournaments.ts

    // SUBSTITUA ESTA FUNÇÃO INTEIRA
    static async getTournamentById(id: string): Promise<SupabaseTournament | null> {
        try {
            const { data, error } = await supabase
                .from('app_5732e5c77b_tournaments')
                .select(`
                    *,
                    app_5732e5c77b_tournament_categories (
                        price,
                        app_5732e5c77b_categories ( * ) 
                    ),
                    app_5732e5c77b_tournament_registrations ( count )
                `)
                .eq('id', id)
                .single();

            if (error || !data) {
                console.error('Error fetching tournament by ID:', error);
                return null;
            }

            // Mapeia os dados brutos para o formato da UI
            const tournament = mapRawToTournament(data);

            // Extrai e formata os dados completos das categorias para uso no frontend
            tournament.categories = data.app_5732e5c77b_tournament_categories.map((tc: any) => ({
                ...tc.app_5732e5c77b_categories, // Pega todos os campos da categoria (id, name, gender, age_min, etc.)
                price: tc.price // Adiciona o preço específico deste torneio
            }));
            
            return tournament;

        } catch (error) {
            console.error('Error in getTournamentById:', error);
            return null;
        }
    }

    static async getTournamentRegistrations(tournamentId: string): Promise<SupabaseTournamentRegistration[]> {
        try {
            const { data, error } = await supabase
                .from('app_5732e5c77b_tournament_registrations')
                .select('*')
                .eq('tournament_id', tournamentId)
                .eq('status', 'registered');
    
            if (error) throw error;
    
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

// Em src/lib/supabase-tournaments.ts, dentro da classe

    static async getAthleteRegistrations(athleteId: string): Promise<SupabaseTournamentRegistration[]> { 
        try {
            const { data, error } = await supabase
                .from('app_5732e5c77b_tournament_registrations')
                .select('*')
                .eq('athlete_id', athleteId);

            if (error) {
                console.error('Error fetching athlete registrations:', error);
                return [];
            }

            return (data || []).map(reg => ({
                id: reg.id,
                tournamentId: reg.tournament_id,
                athleteId: reg.athlete_id,
                registeredAt: reg.created_at, // O nome da coluna pode ser 'created_at'
                status: reg.status,
            })) as SupabaseTournamentRegistration[];

        } catch (error) {
            console.error('Error in getAthleteRegistrations:', error);
            return [];
        }
    }

    static async registerAthlete(tournamentId: string, athleteId: string): Promise<boolean> {
        try {
            const { error } = await supabase.from('app_5732e5c77b_tournament_registrations').insert({
                tournament_id: tournamentId,
                athlete_id: athleteId,
                status: 'registered'
            });
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error in registerAthlete:', error);
            return false;
        }
    }

    static async unregisterAthlete(tournamentId: string, athleteId: string): Promise<boolean> {
        try {
            const { error } = await supabase.from('app_5732e5c77b_tournament_registrations')
                .update({ status: 'cancelled' })
                .eq('tournament_id', tournamentId)
                .eq('athlete_id', athleteId);
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error in unregisterAthlete:', error);
            return false;
        }
    }
    // Em src/lib/supabase-tournaments.ts, dentro da classe SupabaseTournaments

    static async getAthleteRegistrations(athleteId: string): Promise<SupabaseTournamentRegistration[]> { 
        try {
            const { data, error } = await supabase
                .from('app_5732e5c77b_tournament_registrations')
                .select('tournament_id, status') // Só precisamos do ID do torneio e do status
                .eq('athlete_id', athleteId);

            if (error) {
                console.error('Error fetching athlete registrations:', error);
                return [];
            }

            // Mapeia para o formato esperado, mesmo que simplificado
            return (data || []).map(reg => ({
                id: '', // Não precisamos do ID do registro aqui
                tournamentId: reg.tournament_id,
                athleteId: athleteId,
                registeredAt: '',
                status: reg.status,
            })) as SupabaseTournamentRegistration[];

        } catch (error) {
            console.error('Error in getAthleteRegistrations:', error);
            return [];
        }
    }
}