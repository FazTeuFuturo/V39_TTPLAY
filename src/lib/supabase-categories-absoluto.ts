import { supabase } from './supabase'

export interface CBTMCategory {
  id: string
  name: string
  type: 'absoluto'
  gender: 'male' | 'female' | 'mixed'
  ageMin?: number
  ageMax?: number
  isOfficial: boolean
  createdAt: string
}

// Categorias ABSOLUTO baseadas na tabela 1.1 do documento CBTM
export const CBTM_ABSOLUTO_CATEGORIES: Omit<CBTMCategory, 'id' | 'createdAt'>[] = [
  // Categorias por Idade - Masculino
  { name: 'Sub-7 Masculino', type: 'absoluto', gender: 'male', ageMin: 0, ageMax: 7, isOfficial: true },
  { name: 'Sub-9 Masculino', type: 'absoluto', gender: 'male', ageMin: 0, ageMax: 9, isOfficial: true },
  { name: 'Sub-11 Masculino', type: 'absoluto', gender: 'male', ageMin: 0, ageMax: 11, isOfficial: true },
  { name: 'Sub-13 Masculino', type: 'absoluto', gender: 'male', ageMin: 0, ageMax: 13, isOfficial: true },
  { name: 'Sub-15 Masculino', type: 'absoluto', gender: 'male', ageMin: 0, ageMax: 15, isOfficial: true },
  { name: 'Sub-17 Masculino', type: 'absoluto', gender: 'male', ageMin: 0, ageMax: 17, isOfficial: true },
  { name: 'Sub-19 Masculino', type: 'absoluto', gender: 'male', ageMin: 0, ageMax: 19, isOfficial: true },
  { name: 'Sub-21 Masculino', type: 'absoluto', gender: 'male', ageMin: 0, ageMax: 21, isOfficial: true },
  { name: 'Adulto Masculino', type: 'absoluto', gender: 'male', ageMin: 18, isOfficial: true },
  { name: 'Veterano 40+ Masculino', type: 'absoluto', gender: 'male', ageMin: 40, isOfficial: true },
  { name: 'Veterano 50+ Masculino', type: 'absoluto', gender: 'male', ageMin: 50, isOfficial: true },
  { name: 'Veterano 60+ Masculino', type: 'absoluto', gender: 'male', ageMin: 60, isOfficial: true },
  { name: 'Veterano 70+ Masculino', type: 'absoluto', gender: 'male', ageMin: 70, isOfficial: true },
  { name: 'Veterano 75+ Masculino', type: 'absoluto', gender: 'male', ageMin: 75, isOfficial: true },

  // Categorias por Idade - Feminino
  { name: 'Sub-7 Feminino', type: 'absoluto', gender: 'female', ageMin: 0, ageMax: 7, isOfficial: true },
  { name: 'Sub-9 Feminino', type: 'absoluto', gender: 'female', ageMin: 0, ageMax: 9, isOfficial: true },
  { name: 'Sub-11 Feminino', type: 'absoluto', gender: 'female', ageMin: 0, ageMax: 11, isOfficial: true },
  { name: 'Sub-13 Feminino', type: 'absoluto', gender: 'female', ageMin: 0, ageMax: 13, isOfficial: true },
  { name: 'Sub-15 Feminino', type: 'absoluto', gender: 'female', ageMin: 0, ageMax: 15, isOfficial: true },
  { name: 'Sub-17 Feminino', type: 'absoluto', gender: 'female', ageMin: 0, ageMax: 17, isOfficial: true },
  { name: 'Sub-19 Feminino', type: 'absoluto', gender: 'female', ageMin: 0, ageMax: 19, isOfficial: true },
  { name: 'Sub-21 Feminino', type: 'absoluto', gender: 'female', ageMin: 0, ageMax: 21, isOfficial: true },
  { name: 'Adulto Feminino', type: 'absoluto', gender: 'female', ageMin: 18, isOfficial: true },
  { name: 'Veterano 40+ Feminino', type: 'absoluto', gender: 'female', ageMin: 40, isOfficial: true },
  { name: 'Veterano 50+ Feminino', type: 'absoluto', gender: 'female', ageMin: 50, isOfficial: true },
  { name: 'Veterano 60+ Feminino', type: 'absoluto', gender: 'female', ageMin: 60, isOfficial: true },
  { name: 'Veterano 70+ Feminino', type: 'absoluto', gender: 'female', ageMin: 70, isOfficial: true },
  { name: 'Veterano 75+ Feminino', type: 'absoluto', gender: 'female', ageMin: 75, isOfficial: true },

  // Categorias Mistas
  { name: 'Duplas Mistas', type: 'absoluto', gender: 'mixed', isOfficial: true },
  { name: 'Duplas Mistas Veterano 40+', type: 'absoluto', gender: 'mixed', ageMin: 40, isOfficial: true },
  { name: 'Duplas Mistas Veterano 50+', type: 'absoluto', gender: 'mixed', ageMin: 50, isOfficial: true },
  { name: 'Duplas Mistas Veterano 60+', type: 'absoluto', gender: 'mixed', ageMin: 60, isOfficial: true },

  // Categorias Especiais
  { name: 'Iniciantes Masculino', type: 'absoluto', gender: 'male', isOfficial: true },
  { name: 'Iniciantes Feminino', type: 'absoluto', gender: 'female', isOfficial: true },
  { name: 'Duplas Masculinas', type: 'absoluto', gender: 'male', isOfficial: true },
  { name: 'Duplas Femininas', type: 'absoluto', gender: 'female', isOfficial: true }
]

export class SupabaseCategoriesAbsoluto {
  static async insertOfficialCategories(): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      // Clear existing categories
      await supabase
        .from('app_5732e5c77b_categories')
        .delete()
        .eq('is_official', true)

      // Insert new ABSOLUTO categories
      const categoriesToInsert = CBTM_ABSOLUTO_CATEGORIES.map(cat => ({
        name: cat.name,
        type: cat.type,
        gender: cat.gender,
        age_min: cat.ageMin || null,
        age_max: cat.ageMax || null,
        rating_min: null,
        rating_max: null,
        is_official: cat.isOfficial
      }))

      const { data, error } = await supabase
        .from('app_5732e5c77b_categories')
        .insert(categoriesToInsert)
        .select()

      if (error) {
        return { success: false, count: 0, error: error.message }
      }

      return { success: true, count: data?.length || 0 }

    } catch (error: any) {
      return { success: false, count: 0, error: error.message }
    }
  }

  static async getOfficialCategories(): Promise<CBTMCategory[]> {
    try {
      const { data, error } = await supabase
        .from('app_5732e5c77b_categories')
        .select('*')
        .eq('is_official', true)
        .eq('type', 'absoluto')
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
        return []
      }

      return (data || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        type: cat.type as 'absoluto',
        gender: cat.gender as 'male' | 'female' | 'mixed',
        ageMin: cat.age_min,
        ageMax: cat.age_max,
        isOfficial: cat.is_official,
        createdAt: cat.created_at
      }))

    } catch (error) {
      console.error('Error in getOfficialCategories:', error)
      return []
    }
  }

  static async getCategoriesForAthlete(age: number, gender: 'male' | 'female'): Promise<CBTMCategory[]> {
    try {
      const allCategories = await this.getOfficialCategories()
      
      return allCategories.filter(cat => {
        // Check gender compatibility
        if (cat.gender !== gender && cat.gender !== 'mixed') {
          return false
        }

        // Check age compatibility
        if (cat.ageMin !== undefined && age < cat.ageMin) {
          return false
        }
        if (cat.ageMax !== undefined && age > cat.ageMax) {
          return false
        }

        return true
      })

    } catch (error) {
      console.error('Error in getCategoriesForAthlete:', error)
      return []
    }
  }

  static getCategoryDisplayName(category: CBTMCategory): string {
    return category.name
  }

  static getCategoryDescription(category: CBTMCategory): string {
    let desc = `Categoria ${category.type.toUpperCase()}`
    
    if (category.ageMin && category.ageMax) {
      desc += ` - ${category.ageMin} a ${category.ageMax} anos`
    } else if (category.ageMin) {
      desc += ` - ${category.ageMin}+ anos`
    } else if (category.ageMax) {
      desc += ` - até ${category.ageMax} anos`
    }
    
    if (category.gender === 'male') {
      desc += ' - Masculino'
    } else if (category.gender === 'female') {
      desc += ' - Feminino'
    } else if (category.gender === 'mixed') {
      desc += ' - Misto'
    }
    
    return desc
  }
}