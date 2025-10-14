// tournament-generator.ts (VERSÃO CORRIGIDA E COMPLETA)

import { MatchStatus, User } from './types'; // Importe seus tipos base

// ===================================================================
// INTERFACES UNIFICADAS
// Coloque estas interfaces em um arquivo central como 'types.ts'
// para usar em todo o projeto.
// ===================================================================

export interface QualifiedAthlete {
  id: string;
  name: string;
  rating: number;
  category: string;
  groupName: string;
  position: number; // A informação mais importante! (1 ou 2)
}

export interface BracketMatch {
  id: string;
  player1Id: string | null;
  player2Id: string | null;
  player1Name: string | null;
  player2Name: string | null;
  winnerId: string | null;
  round: number;
  position: number;
  status: MatchStatus;
  player1Score: number;
  player2Score: number;
  nextMatchId: string | null;
}

// ===================================================================
// LÓGICA DE GERAÇÃO DE CHAVE
// ===================================================================

/**
 * Gera o chaveamento de eliminação simples com seeding correto.
 * @param qualifiedAthletes Atletas classificados da fase de grupos.
 * @param bracketIdPrefix Um prefixo para criar IDs únicos para as partidas.
 * @returns Um array de partidas que formam a chave.
 */
export function generateSingleEliminationBracket(
  qualifiedAthletes: QualifiedAthlete[],
  bracketIdPrefix: string
): BracketMatch[] {
  if (qualifiedAthletes.length < 2) {
    return [];
  }

  // 1. RANQUEAMENTO CORRETO (SEEDING)
  // Ordena os atletas por mérito: 1ºs colocados primeiro, depois os 2ºs.
  // O rating é usado apenas como critério de desempate.
  const rankedAthletes = [...qualifiedAthletes].sort(
    (a, b) => a.position - b.position || b.rating - a.rating
  );

  const numPlayers = rankedAthletes.length;
  // Calcula o tamanho da chave para a próxima potência de 2 (4, 8, 16...).
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
  const rounds = Math.log2(bracketSize);
  const matches: BracketMatch[] = [];
  let matchCounter = 1;

  // 2. MONTAGEM DA PRIMEIRA RODADA
  // Preenche a primeira rodada para criar os confrontos 1 vs N, 2 vs N-1, etc.
  const firstRoundPlayers: (QualifiedAthlete | null)[] = new Array(bracketSize).fill(null);
  
  let top = 0;
  let bottom = bracketSize - 1;
  for (let i = 0; i < numPlayers; i++) {
    // Alterna o preenchimento para garantir que os melhores não se enfrentem no início.
    if (i % 2 === 0) {
      firstRoundPlayers[top++] = rankedAthletes[i];
    } else {
      firstRoundPlayers[bottom--] = rankedAthletes[i];
    }
  }

  // 3. CRIAÇÃO DAS PARTIDAS (1ª Rodada)
  for (let i = 0; i < bracketSize; i += 2) {
    const player1 = firstRoundPlayers[i];
    const player2 = firstRoundPlayers[i + 1];

    const match: BracketMatch = {
      id: `${bracketIdPrefix}_m${matchCounter++}`,
      round: 1,
      position: i / 2 + 1,
      player1Id: player1?.id || null,
      player1Name: player1?.name || null,
      player2Id: player2?.id || null,
      player2Name: player2?.name || null,
      winnerId: null,
      status: MatchStatus.PENDING,
      player1Score: 0,
      player2Score: 0,
      nextMatchId: null,
    };

    // Se um dos jogadores for nulo, é um "bye". O outro avança automaticamente.
    if (!player1 || !player2) {
      match.status = MatchStatus.COMPLETED;
      match.winnerId = player1 ? player1.id : player2!.id;
    }

    matches.push(match);
  }

  // 4. CRIAÇÃO DAS RODADAS SEGUINTES (VAZIAS)
  let lastRoundMatchCount = bracketSize / 2;
  for (let round = 2; round <= rounds; round++) {
    const matchesInThisRound = lastRoundMatchCount / 2;
    for (let i = 0; i < matchesInThisRound; i++) {
      matches.push({
        id: `${bracketIdPrefix}_m${matchCounter++}`,
        round: round,
        position: i + 1,
        player1Id: null, player1Name: null,
        player2Id: null, player2Name: null,
        winnerId: null, status: MatchStatus.PENDING,
        player1Score: 0, player2Score: 0,
        nextMatchId: null,
      });
    }
    lastRoundMatchCount = matchesInThisRound;
  }

  // 5. CONEXÃO DAS PARTIDAS
  // Define o `nextMatchId` para que os vencedores avancem corretamente.
  matches.filter(m => m.round < rounds).forEach(match => {
    const nextRound = match.round + 1;
    const nextPosition = Math.ceil(match.position / 2);
    const nextMatch = matches.find(m => m.round === nextRound && m.position === nextPosition);
    if (nextMatch) {
      match.nextMatchId = nextMatch.id;
    }
  });

  return matches;
}


/**
 * Atualiza o chaveamento com o resultado de uma partida e avança o vencedor.
 */
export function updateBracketWithResult(
  matches: BracketMatch[],
  matchId: string,
  winnerId: string
): BracketMatch[] {
  // Usar JSON.parse/stringify é uma forma simples de fazer uma cópia profunda
  // para evitar mutações inesperadas no estado.
  const newMatches = JSON.parse(JSON.stringify(matches)) as BracketMatch[];
  const completedMatch = newMatches.find(m => m.id === matchId);

  if (!completedMatch) return matches;

  completedMatch.winnerId = winnerId;
  completedMatch.status = MatchStatus.COMPLETED;

  // Avança o vencedor para a próxima partida
  if (completedMatch.nextMatchId) {
    const nextMatch = newMatches.find(m => m.id === completedMatch.nextMatchId);
    if (nextMatch) {
      const winner = {
        id: winnerId,
        name: winnerId === completedMatch.player1Id ? completedMatch.player1Name : completedMatch.player2Name,
      };

      // Define se o vencedor será o jogador 1 ou 2 na próxima fase
      if (completedMatch.position % 2 !== 0) { // Posição ímpar (1, 3, 5...) preenche o slot 1
        nextMatch.player1Id = winner.id;
        nextMatch.player1Name = winner.name;
      } else { // Posição par (2, 4, 6...) preenche o slot 2
        nextMatch.player2Id = winner.id;
        nextMatch.player2Name = winner.name;
      }
    }
  }
  return newMatches;
}

// As outras funções (round robin, etc.) podem ser mantidas ou removidas se não forem necessárias.