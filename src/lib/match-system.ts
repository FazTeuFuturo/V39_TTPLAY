export interface SetScore {
  player1Score: number
  player2Score: number
  winner: 1 | 2
}

export interface Match {
  id: string
  groupId: string
  player1: {
    id: string
    name: string
    rating: number
  }
  player2: {
    id: string
    name: string
    rating: number
  }
  sets: SetScore[]
  setsWon1: number
  setsWon2: number
  status: 'pending' | 'in_progress' | 'completed'
  round: number
  winner?: 1 | 2
}

export interface GroupStanding {
  athlete: {
    id: string
    name: string
    rating: number
  }
  matches: number
  wins: number
  losses: number
  setsWon: number
  setsLost: number
  points: number
  position: number
}

export function generateRoundRobinMatches(groupId: string, athletes: any[]): Match[] {
  const matches: Match[] = []
  let matchCounter = 0

  // Generate all possible pairings (round-robin)
  for (let i = 0; i < athletes.length; i++) {
    for (let j = i + 1; j < athletes.length; j++) {
      matches.push({
        id: `match_${groupId}_${matchCounter++}`,
        groupId,
        player1: {
          id: athletes[i].id,
          name: athletes[i].athleteName,
          rating: athletes[i].athleteRating
        },
        player2: {
          id: athletes[j].id,
          name: athletes[j].athleteName,
          rating: athletes[j].athleteRating
        },
        sets: [],
        setsWon1: 0,
        setsWon2: 0,
        status: 'pending',
        round: Math.floor(matchCounter / Math.ceil(athletes.length / 2)) + 1
      })
    }
  }

  return matches
}

export function calculateGroupStandings(athletes: any[], matches: Match[]): GroupStanding[] {
  const standings: GroupStanding[] = athletes.map(athlete => ({
    athlete: {
      id: athlete.id,
      name: athlete.athleteName,
      rating: athlete.athleteRating
    },
    matches: 0,
    wins: 0,
    losses: 0,
    setsWon: 0,
    setsLost: 0,
    points: 0,
    position: 0
  }))

  // Calculate stats from completed matches
  matches.forEach(match => {
    if (match.status === 'completed' && match.winner) {
      const standing1 = standings.find(s => s.athlete.id === match.player1.id)!
      const standing2 = standings.find(s => s.athlete.id === match.player2.id)!
      
      standing1.matches++
      standing2.matches++
      standing1.setsWon += match.setsWon1
      standing1.setsLost += match.setsWon2
      standing2.setsWon += match.setsWon2
      standing2.setsLost += match.setsWon1
      
      if (match.winner === 1) {
        standing1.wins++
        standing1.points += 3
        standing2.losses++
      } else {
        standing2.wins++
        standing2.points += 3
        standing1.losses++
      }
    }
  })

  // Sort by points, then by set difference, then by sets won
  standings.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    const setDiffA = a.setsWon - a.setsLost
    const setDiffB = b.setsWon - b.setsLost
    if (setDiffA !== setDiffB) return setDiffB - setDiffA
    return b.setsWon - a.setsWon
  })

  // Assign positions
  standings.forEach((standing, index) => {
    standing.position = index + 1
  })

  return standings
}

export function updateMatchResult(match: Match, sets: SetScore[]): Match {
  const setsWon1 = sets.filter(set => set.winner === 1).length
  const setsWon2 = sets.filter(set => set.winner === 2).length
  
  return {
    ...match,
    sets,
    setsWon1,
    setsWon2,
    status: 'completed',
    winner: setsWon1 > setsWon2 ? 1 : 2
  }
}

export function saveMatches(tournamentId: string, matches: Match[]) {
  localStorage.setItem(`tournament_matches_${tournamentId}`, JSON.stringify(matches))
}

export function loadMatches(tournamentId: string): Match[] {
  try {
    const saved = localStorage.getItem(`tournament_matches_${tournamentId}`)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}