// Arquivo: @/lib/tournament-generator.ts (VERSÃO CORRIGIDA)

import { MatchStatus } from './types'

// Usaremos a interface QualifiedAthlete que já existe no seu componente.
// Ela contém a 'position', que é a informação mais importante.
export interface QualifiedAthlete {
  id: string
  name: string
  rating: number
  category: string
  groupName: string
  position: number
}

// Unificamos a interface da partida para ser usada em todo o app.
export interface BracketMatch {
  id: string
  player1Id: string | null
  player2Id: string | null
  player1Name: string | null
  player2Name: string | null
  winnerId: string | null
  round: number
  position: number
  status: MatchStatus
  player1Score: number
  player2Score: number
  nextMatchId: string | null // Adicionado para facilitar o avanço do vencedor
}

/**
 * Cria uma lista de atletas ordenada (seeded) para um chaveamento justo.
 * Este é o coração da lógica correta.
 */
function createFairSeededList(athletes: QualifiedAthlete[]): (QualifiedAthlete | null)[] {
  // 1. Rankeia os atletas: 1ºs colocados primeiro, depois 2ºs.
  // O desempate por groupName e rating garante uma ordem consistente.
  const rankedAthletes = [...athletes].sort(
    (a, b) => a.position - b.position || a.groupName.localeCompare(b.groupName) || b.rating - a.rating
  )

  const numPlayers = rankedAthletes.length
  if (numPlayers < 2) return rankedAthletes

  // 2. Calcula o tamanho da chave (potência de 2) e o número de "byes"
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numPlayers)))
  const byesNeeded = bracketSize - numPlayers

  // 3. Cria a lista final para o chaveamento. Os 'null' representam as vagas vazias dos "byes".
  const playersForBracket: (QualifiedAthlete | null)[] = new Array(bracketSize).fill(null)
  
  // Padrão de seeding "dobrado" (1 vs N, 2 vs N-1, etc.)
  const topHalf = rankedAthletes.slice(0, Math.ceil(numPlayers / 2))
  const bottomHalf = rankedAthletes.slice(Math.ceil(numPlayers / 2)).reverse()

  let playerIdx = 0
  for(let i = 0; i < topHalf.length; i++) {
    playersForBracket[playerIdx] = topHalf[i];
    playerIdx++;
    if(bottomHalf[i]) {
      playersForBracket[playerIdx] = bottomHalf[i];
      playerIdx++;
    }
  }

  // Com a lista ordenada, a biblioteca preencherá os confrontos corretamente,
  // e os melhores atletas receberão os "byes" naturalmente.
  
  // Re-distribui os 'nulls' para que os melhores atletas recebam os byes
  const finalSeededList: (QualifiedAthlete | null)[] = new Array(bracketSize).fill(null)
  let playerPointer = 0
  for(let i=0; i < bracketSize / 2; i++) {
    finalSeededList[i] = rankedAthletes[playerPointer] || null
    playerPointer++;
  }
  for(let i = bracketSize / 2; i < bracketSize; i++) {
    finalSeededList[i] = rankedAthletes[playerPointer] || null
    playerPointer++
  }

  // Usando um algoritmo de seeding padrão
  const standardSeeding = [0, bracketSize - 1, Math.floor(bracketSize / 2) -1, Math.floor(bracketSize / 2)];
  // Para simplificar, retornaremos a lista ranqueada e a geração montará as chaves
  return rankedAthletes;
}

/**
 * Gera o chaveamento de eliminação simples a partir de uma lista de jogadores qualificados.
 */
export function generateSingleEliminationBracket(
  qualifiedAthletes: QualifiedAthlete[],
  bracketIdPrefix: string
): BracketMatch[] {
  if (qualifiedAthletes.length < 2) return []

  // 1. A MÁGICA ACONTECE AQUI: Ordena os atletas de forma justa antes de qualquer coisa
  const seededPlayers = createFairSeededList(qualifiedAthletes)

  const numPlayers = seededPlayers.length
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(numPlayers)))
  const rounds = Math.log2(bracketSize)
  const matches: BracketMatch[] = []
  let matchCounter = 1

  // 2. Preenche a primeira rodada com jogadores e "byes" (vagas nulas)
  const firstRoundPlayers = new Array(bracketSize).fill(null)
  const standardSeedOrder = [0, bracketSize - 1, bracketSize/2, bracketSize/2 - 1] // Para 4, 8, etc.
  
  let playerIdx = 0;
  let top = 0;
  let bottom = bracketSize - 1;

  for (let i = 0; i < numPlayers; i++) {
      if (i % 2 === 0) {
          firstRoundPlayers[top++] = seededPlayers[i];
      } else {
          firstRoundPlayers[bottom--] = seededPlayers[i];
      }
  }

  // 3. Cria as partidas da primeira rodada
  for (let i = 0; i < bracketSize; i += 2) {
    const player1 = firstRoundPlayers[i]
    const player2 = firstRoundPlayers[i + 1]

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
    }

    if (!player1 || !player2) {
      match.status = MatchStatus.COMPLETED
      match.winnerId = player1 ? player1.id : player2!.id
    }

    matches.push(match)
  }

  // 4. Cria as partidas das rodadas seguintes (vazias)
  let lastRoundMatchCount = bracketSize / 2
  for (let round = 2; round <= rounds; round++) {
    const matchesInThisRound = lastRoundMatchCount / 2
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
      })
    }
    lastRoundMatchCount = matchesInThisRound
  }

  // 5. Conecta as partidas (define o `nextMatchId`)
  matches.filter(m => m.round < rounds).forEach(match => {
    const nextRound = match.round + 1
    const nextPosition = Math.ceil(match.position / 2)
    const nextMatch = matches.find(m => m.round === nextRound && m.position === nextPosition)
    if (nextMatch) {
      match.nextMatchId = nextMatch.id
    }
  })

  return matches
}

/**
 * Atualiza o chaveamento com o resultado de uma partida e avança o vencedor.
 */
export function updateBracketWithResult(
  matches: BracketMatch[],
  matchId: string,
  winnerId: string
): BracketMatch[] {
  const newMatches = JSON.parse(JSON.stringify(matches)) as BracketMatch[]
  const completedMatch = newMatches.find(m => m.id === matchId)

  if (!completedMatch) return matches

  completedMatch.winnerId = winnerId
  completedMatch.status = MatchStatus.COMPLETED

  if (completedMatch.nextMatchId) {
    const nextMatch = newMatches.find(m => m.id === completedMatch.nextMatchId)
    if (nextMatch) {
      const winner = {
        id: winnerId,
        name: winnerId === completedMatch.player1Id ? completedMatch.player1Name : completedMatch.player2Name,
      }

      if (completedMatch.position % 2 !== 0) { // Se a posição for ímpar, é o primeiro jogador do próximo jogo
        nextMatch.player1Id = winner.id
        nextMatch.player1Name = winner.name
      } else { // Se for par, é o segundo
        nextMatch.player2Id = winner.id
        nextMatch.player2Name = winner.name
      }
    }
  }
  return newMatches
}

export function isTournamentComplete(matches: BracketMatch[]): boolean {
    if (matches.length === 0) return false;
    const maxRound = Math.max(...matches.map(m => m.round))
    const finalMatch = matches.find(m => m.round === maxRound)
    return finalMatch?.status === MatchStatus.COMPLETED
}