import { SetScore } from './match-system'

export interface EliminationMatch {
  id: string
  round: 'quarterfinals' | 'semifinals' | 'final'
  roundName: string
  player1?: {
    id: string
    name: string
    rating: number
    category: string
  }
  player2?: {
    id: string
    name: string
    rating: number
    category: string
  }
  sets: SetScore[]
  setsWon1: number
  setsWon2: number
  winner?: {
    id: string
    name: string
    rating: number
    category: string
  }
  status: 'pending' | 'completed' | 'bye'
  nextMatchId?: string
}

export interface BracketData {
  category: string
  matches: EliminationMatch[]
  champion?: {
    id: string
    name: string
    rating: number
    category: string
  }
}

export function getQualifiedAthletes(groups: any[], matches: any[]): any[] {
  const qualified: any[] = []
  
  console.log('🔍 DEBUGGING QUALIFICATION:')
  console.log('Groups:', groups.length)
  console.log('Matches:', matches.length)
  
  groups.forEach(group => {
    console.log(`\n📊 Group: ${group.name}`)
    console.log(`Athletes: ${group.athletes.length}`)
    
    // Get matches for this group
    const groupMatches = matches.filter(m => m.groupId === group.id)
    console.log(`Matches: ${groupMatches.length}`)
    
    // Calculate standings for this group
    const standings = group.athletes.map((athlete: any) => ({
      athlete: {
        id: athlete.id,
        name: athlete.athleteName,
        rating: athlete.athleteRating,
        category: group.category
      },
      matches: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      points: 0
    }))

    // Calculate stats from completed matches
    groupMatches.forEach(match => {
      if (match.status === 'completed' && match.winner) {
        const standing1 = standings.find(s => s.athlete.id === match.player1.id)
        const standing2 = standings.find(s => s.athlete.id === match.player2.id)
        
        if (standing1 && standing2) {
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

    console.log('Standings:')
    standings.forEach((s, i) => {
      console.log(`${i + 1}. ${s.athlete.name} - ${s.points}pts (${s.wins}W-${s.losses}L, ${s.setsWon}-${s.setsLost})`)
    })

    // Take top 2 from each group (if they have played matches)
    const topTwo = standings.slice(0, 2).filter(s => s.matches > 0)
    topTwo.forEach(standing => {
      qualified.push(standing.athlete)
    })
    
    console.log(`Qualified: ${topTwo.map(s => s.athlete.name).join(', ')}`)
  })
  
  console.log(`\n🏆 TOTAL QUALIFIED: ${qualified.length}`)
  qualified.forEach((q, i) => {
    console.log(`${i + 1}. ${q.name} (${q.category})`)
  })
  
  return qualified
}

export function generateEliminationBracket(qualifiedAthletes: any[], category: string): BracketData {
  const categoryAthletes = qualifiedAthletes.filter(a => a.category === category)
  
  console.log(`\n🏆 GENERATING BRACKET FOR ${category}:`)
  console.log(`Athletes: ${categoryAthletes.length}`)
  
  if (categoryAthletes.length === 0) {
    return { category, matches: [] }
  }

  // Sort by rating for seeding
  categoryAthletes.sort((a, b) => b.rating - a.rating)
  
  const matches: EliminationMatch[] = []
  
  // Handle different bracket sizes
  if (categoryAthletes.length <= 2) {
    // Direct final
    if (categoryAthletes.length === 2) {
      matches.push({
        id: `final_${category}`,
        round: 'final',
        roundName: 'Final',
        player1: categoryAthletes[0],
        player2: categoryAthletes[1],
        sets: [],
        setsWon1: 0,
        setsWon2: 0,
        status: 'pending'
      })
    }
  } else if (categoryAthletes.length <= 4) {
    // Semifinals + Final
    const semis = []
    
    // Create semifinals
    for (let i = 0; i < categoryAthletes.length; i += 2) {
      const player1 = categoryAthletes[i]
      const player2 = categoryAthletes[i + 1] || null
      
      const match: EliminationMatch = {
        id: `semi_${category}_${Math.floor(i / 2) + 1}`,
        round: 'semifinals',
        roundName: 'Semifinal',
        player1,
        player2: player2 || undefined,
        sets: [],
        setsWon1: 0,
        setsWon2: 0,
        status: player2 ? 'pending' : 'bye',
        nextMatchId: `final_${category}`
      }
      
      // If no opponent, automatically advance
      if (!player2) {
        match.winner = player1
        match.status = 'bye'
      }
      
      matches.push(match)
      semis.push(match)
    }
    
    // Create final
    matches.push({
      id: `final_${category}`,
      round: 'final',
      roundName: 'Final',
      sets: [],
      setsWon1: 0,
      setsWon2: 0,
      status: 'pending'
    })
  } else {
    // Full bracket: Quarterfinals + Semifinals + Final
    const quarters = []
    
    // Create quarterfinals (up to 8 athletes)
    const maxAthletes = Math.min(categoryAthletes.length, 8)
    for (let i = 0; i < maxAthletes; i += 2) {
      const player1 = categoryAthletes[i]
      const player2 = categoryAthletes[i + 1] || null
      
      const match: EliminationMatch = {
        id: `quarter_${category}_${Math.floor(i / 2) + 1}`,
        round: 'quarterfinals',
        roundName: 'Quartas de Final',
        player1,
        player2: player2 || undefined,
        sets: [],
        setsWon1: 0,
        setsWon2: 0,
        status: player2 ? 'pending' : 'bye',
        nextMatchId: `semi_${category}_${Math.floor(i / 4) + 1}`
      }
      
      // If no opponent, automatically advance
      if (!player2) {
        match.winner = player1
        match.status = 'bye'
      }
      
      matches.push(match)
      quarters.push(match)
    }
    
    // Create semifinals
    for (let i = 0; i < 2; i++) {
      matches.push({
        id: `semi_${category}_${i + 1}`,
        round: 'semifinals',
        roundName: 'Semifinal',
        sets: [],
        setsWon1: 0,
        setsWon2: 0,
        status: 'pending',
        nextMatchId: `final_${category}`
      })
    }
    
    // Create final
    matches.push({
      id: `final_${category}`,
      round: 'final',
      roundName: 'Final',
      sets: [],
      setsWon1: 0,
      setsWon2: 0,
      status: 'pending'
    })
  }
  
  console.log(`Generated ${matches.length} matches`)
  
  return { category, matches }
}

export function updateEliminationMatch(match: EliminationMatch, sets: SetScore[]): EliminationMatch {
  const setsWon1 = sets.filter(set => set.winner === 1).length
  const setsWon2 = sets.filter(set => set.winner === 2).length
  
  const winner = setsWon1 > setsWon2 ? match.player1 : match.player2
  
  return {
    ...match,
    sets,
    setsWon1,
    setsWon2,
    winner,
    status: 'completed'
  }
}

export function advanceWinner(brackets: BracketData[], matchId: string, winner: any): BracketData[] {
  return brackets.map(bracket => {
    const updatedMatches = bracket.matches.map(match => {
      // If this is the match that was completed, it's already updated
      if (match.id === matchId) {
        return match
      }
      
      // If this match is waiting for the winner of the completed match
      if (match.nextMatchId && bracket.matches.find(m => m.id === matchId)?.nextMatchId === match.id) {
        const completedMatch = bracket.matches.find(m => m.id === matchId)
        if (completedMatch?.winner) {
          // Determine which slot to fill
          if (!match.player1) {
            return { ...match, player1: completedMatch.winner }
          } else if (!match.player2) {
            return { ...match, player2: completedMatch.winner }
          }
        }
      }
      
      return match
    })
    
    // Check if final is completed to determine champion
    const final = updatedMatches.find(m => m.round === 'final')
    const champion = final?.winner || bracket.champion
    
    return {
      ...bracket,
      matches: updatedMatches,
      champion
    }
  })
}

export function saveBrackets(tournamentId: string, brackets: BracketData[]) {
  localStorage.setItem(`tournament_brackets_${tournamentId}`, JSON.stringify(brackets))
}

export function loadBrackets(tournamentId: string): BracketData[] {
  try {
    const saved = localStorage.getItem(`tournament_brackets_${tournamentId}`)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}