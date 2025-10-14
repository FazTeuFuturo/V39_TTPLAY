/**
 * ELO Rating System for Table Tennis
 * Based on the standard ELO rating algorithm with adjustments for table tennis
 */

export interface EloCalculationResult {
  newRating1: number
  newRating2: number
  ratingChange1: number
  ratingChange2: number
}

/**
 * Calculate new ELO ratings for two players after a match
 * @param player1Rating Current rating of player 1
 * @param player2Rating Current rating of player 2
 * @param result Match result (1 = player1 wins, 0 = player2 wins, 0.5 = draw)
 * @param kFactor K-factor for rating volatility (default 32)
 * @returns New ratings and changes for both players
 */
export function calculateEloRating(
  player1Rating: number,
  player2Rating: number,
  result: 1 | 0 | 0.5,
  kFactor: number = 32
): EloCalculationResult {
  // Calculate expected scores
  const expectedScore1 = 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400))
  const expectedScore2 = 1 - expectedScore1
  
  // Calculate rating changes
  const ratingChange1 = Math.round(kFactor * (result - expectedScore1))
  const ratingChange2 = Math.round(kFactor * ((1 - result) - expectedScore2))
  
  // Calculate new ratings
  const newRating1 = Math.max(100, player1Rating + ratingChange1) // Minimum rating of 100
  const newRating2 = Math.max(100, player2Rating + ratingChange2)
  
  return {
    newRating1,
    newRating2,
    ratingChange1,
    ratingChange2
  }
}

/**
 * Get K-factor based on player rating and experience
 * Higher K-factor for new/lower-rated players for faster rating adjustment
 */
export function getKFactor(rating: number, gamesPlayed: number): number {
  // New players (less than 30 games): higher K-factor
  if (gamesPlayed < 30) return 40
  
  // Lower-rated players: higher K-factor for faster improvement
  if (rating < 1400) return 36
  
  // Mid-level players
  if (rating < 1800) return 32
  
  // High-level players: lower K-factor for stability
  return 24
}

/**
 * Calculate match result based on set scores
 * @param setScores Array of set scores
 * @returns 1 if player1 wins, 0 if player2 wins
 */
export function calculateMatchResult(setScores: Array<{ player1Score: number; player2Score: number }>): 1 | 0 {
  let player1Sets = 0
  let player2Sets = 0
  
  setScores.forEach(set => {
    if (set.player1Score > set.player2Score) {
      player1Sets++
    } else {
      player2Sets++
    }
  })
  
  return player1Sets > player2Sets ? 1 : 0
}

/**
 * Validate set scores according to table tennis rules
 * @param setScores Array of set scores to validate
 * @returns true if all sets are valid, false otherwise
 */
export function validateSetScores(setScores: Array<{ player1Score: number; player2Score: number }>): boolean {
  return setScores.every(set => {
    const { player1Score, player2Score } = set
    const maxScore = Math.max(player1Score, player2Score)
    const minScore = Math.min(player1Score, player2Score)
    
    // Normal game: first to 11, win by 2
    if (maxScore >= 11 && maxScore - minScore >= 2) return true
    
    // Deuce situation: both players at 10+, winner must be 2 ahead
    if (minScore >= 10 && maxScore - minScore >= 2) return true
    
    return false
  })
}

/**
 * Get rating category/level based on ELO rating
 */
export function getRatingCategory(rating: number): string {
  if (rating >= 2200) return 'Master'
  if (rating >= 2000) return 'Expert'
  if (rating >= 1800) return 'Advanced'
  if (rating >= 1600) return 'Intermediate+'
  if (rating >= 1400) return 'Intermediate'
  if (rating >= 1200) return 'Beginner+'
  return 'Beginner'
}

/**
 * Calculate probability of player1 winning against player2
 */
export function calculateWinProbability(player1Rating: number, player2Rating: number): number {
  return 1 / (1 + Math.pow(10, (player2Rating - player1Rating) / 400))
}