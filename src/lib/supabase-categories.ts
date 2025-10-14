import { supabase } from './supabase'

export interface Category {
  id: string
  name: string
  type: 'age' | 'rating' | 'custom'
  ageMin?: number
  ageMax?: number
  ratingMin?: number
  ratingMax?: number
  gender: 'male' | 'female' | 'mixed'
  isOfficial: boolean
  createdAt: string
}

export class SupabaseCategories {
  static async getOfficialCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_categories')
        .select('*')
        .eq('is_official', true)
        .order('type', { ascending: true })
        .order('gender', { ascending: true })
        .order('age_min', { ascending: true })
        .order('rating_min', { ascending: false })

      if (error) {
        console.error('Error fetching official categories:', error)
        return []
      }

      return (data || []).map(this.mapDatabaseCategory)
    } catch (error) {
      console.error('Error in getOfficialCategories:', error)
      return []
    }
  }

  static async getCustomCategories(): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_categories')
        .select('*')
        .eq('is_official', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching custom categories:', error)
        return []
      }

      return (data || []).map(this.mapDatabaseCategory)
    } catch (error) {
      console.error('Error in getCustomCategories:', error)
      return []
    }
  }

  static async createCustomCategory(categoryData: {
    name: string
    type: 'age' | 'rating' | 'custom'
    ageMin?: number
    ageMax?: number
    ratingMin?: number
    ratingMax?: number
    gender: 'male' | 'female' | 'mixed'
  }): Promise<Category | null> {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_categories')
        .insert({
          name: categoryData.name,
          type: categoryData.type,
          age_min: categoryData.ageMin,
          age_max: categoryData.ageMax,
          rating_min: categoryData.ratingMin,
          rating_max: categoryData.ratingMax,
          gender: categoryData.gender,
          is_official: false
        })
        .select()
        .single()

      if (error || !data) {
        console.error('Error creating custom category:', error)
        return null
      }

      return this.mapDatabaseCategory(data)
    } catch (error) {
      console.error('Error in createCustomCategory:', error)
      return null
    }
  }

  static async getTournamentCategories(tournamentId: string): Promise<Category[]> {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_tournament_categories')
        .select(`
          category_id,
          app_5732e5c77b_categories (*)
        `)
        .eq('tournament_id', tournamentId)

      if (error) {
        console.error('Error fetching tournament categories:', error)
        return []
      }

      return (data || [])
        .map(item => item.app_5732e5c77b_categories)
        .filter(Boolean)
        .map(this.mapDatabaseCategory)
    } catch (error) {
      console.error('Error in getTournamentCategories:', error)
      return []
    }
  }

  static async addCategoriesToTournament(tournamentId: string, categoryIds: string[]): Promise<boolean> {
    try {
      const insertData = categoryIds.map(categoryId => ({
        tournament_id: tournamentId,
        category_id: categoryId
      }))

      const { error } = await supabase
        .from('app_5732e5c77b_tournament_categories')
        .insert(insertData)

      if (error) {
        console.error('Error adding categories to tournament:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in addCategoriesToTournament:', error)
      return false
    }
  }

  static async removeCategoriesToTournament(tournamentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_5732e5c77b_tournament_categories')
        .delete()
        .eq('tournament_id', tournamentId)

      if (error) {
        console.error('Error removing tournament categories:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in removeCategoriesToTournament:', error)
      return false
    }
  }

  private static mapDatabaseCategory(data: any): Category {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      ageMin: data.age_min,
      ageMax: data.age_max,
      ratingMin: data.rating_min,
      ratingMax: data.rating_max,
      gender: data.gender,
      isOfficial: data.is_official,
      createdAt: data.created_at
    }
  }

  static getCategoryDisplayName(category: Category): string {
    if (category.type === 'age') {
      if (category.ageMax === 999) {
        return `${category.name} (${category.ageMin}+ anos)`
      }
      return `${category.name} (${category.ageMin}-${category.ageMax} anos)`
    } else if (category.type === 'rating') {
      if (category.ratingMax === 9999) {
        return `${category.name} (${category.ratingMin}+ pontos)`
      }
      return `${category.name} (${category.ratingMin}-${category.ratingMax} pontos)`
    }
    return category.name
  }

  static calculateAge(birthDate: string, referenceDate: string = new Date().getFullYear() + '-12-31'): number {
    const birth = new Date(birthDate)
    const reference = new Date(referenceDate)
    let age = reference.getFullYear() - birth.getFullYear()
    
    const monthDiff = reference.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  static isEligibleForCategory(
    category: Category, 
    participantAge?: number, 
    participantRating?: number,
    participantGender?: 'male' | 'female'
  ): boolean {
    // Check gender compatibility
    if (category.gender !== 'mixed' && participantGender && category.gender !== participantGender) {
      return false
    }

    // Check age eligibility
    if (category.type === 'age' && participantAge !== undefined) {
      if (category.ageMin !== undefined && participantAge < category.ageMin) return false
      if (category.ageMax !== undefined && participantAge > category.ageMax) return false
    }

    // Check rating eligibility
    if (category.type === 'rating' && participantRating !== undefined) {
      if (category.ratingMin !== undefined && participantRating < category.ratingMin) return false
      if (category.ratingMax !== undefined && participantRating > category.ratingMax) return false
    }

    return true
  }
}