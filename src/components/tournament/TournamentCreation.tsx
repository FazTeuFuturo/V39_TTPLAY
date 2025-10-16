'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar, DollarSign, Trophy, CheckCircle, AlertCircle, X, Percent } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TournamentCreationProps {
  onTournamentCreated: (tournament: any) => void
  createdBy: string
  editTournament?: any
}

interface Category {
  id: string
  name: string
  type: string
  gender: string
  age_min?: number
  age_max?: number
  rating_min?: number
  rating_max?: number
  is_official: boolean
}

interface CategoryPrice {
  categoryId: string
  price: number
}

export function TournamentCreation({ onTournamentCreated, createdBy, editTournament }: TournamentCreationProps) {
  const [formData, setFormData] = useState({
    name: editTournament?.name || '',
    description: editTournament?.description || '',
    startDate: editTournament?.startDate ? new Date(editTournament.startDate).toISOString().split('T')[0] : '',
    endDate: editTournament?.endDate ? new Date(editTournament.endDate).toISOString().split('T')[0] : '',
    registrationDeadline: editTournament?.registrationDeadline ? new Date(editTournament.registrationDeadline).toISOString().split('T')[0] : '',
    location: editTournament?.location || '',
    maxParticipants: editTournament?.maxParticipants?.toString() || '32',
    format: editTournament?.format || 'groups_elimination',
    rules: editTournament?.rules || '',
    prizes: editTournament?.prizes || '',
    discountTwoCategories: editTournament?.discount_two_categories?.toString() || '0',
    discountThreeOrMore: editTournament?.discount_three_or_more?.toString() || '0'
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<CategoryPrice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [customCategory, setCustomCategory] = useState({
  name: '',
  gender: 'male' as 'male' | 'female' | 'mixed',
  ageMin: '',
  ageMax: '',
  ratingMin: '',
  ratingMax: ''
})

const handleCreateCustomCategory = async () => {
  try {
    if (!customCategory.name.trim()) {
      setError('Nome da categoria é obrigatório')
      return
    }

    const { data, error } = await supabase
      .from('app_5732e5c77b_categories')
      .insert([{
        name: customCategory.name,
        type: 'custom',
        gender: customCategory.gender,
        age_min: customCategory.ageMin ? parseInt(customCategory.ageMin) : null,
        age_max: customCategory.ageMax ? parseInt(customCategory.ageMax) : null,
        rating_min: customCategory.ratingMin ? parseInt(customCategory.ratingMin) : null,
        rating_max: customCategory.ratingMax ? parseInt(customCategory.ratingMax) : null,
        is_official: false,
        club_id: createdBy
      }])
      .select()
      .single()

    if (error) throw error

    setCategories(prev => [...prev, data])
    
    setCustomCategory({
      name: '',
      gender: 'male',
      ageMin: '',
      ageMax: '',
      ratingMin: '',
      ratingMax: ''
    })

    setSuccess('Categoria personalizada criada!')
    setTimeout(() => setSuccess(''), 3000)
  } catch (err: any) {
    setError('Erro ao criar categoria personalizada')
  }
}

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
  try {
    setIsLoadingCategories(true)
    
    // Buscar categorias oficiais + categorias do clube
    const { data, error } = await supabase
      .from('app_5732e5c77b_categories')
      .select('*')
      .or(`is_official.eq.true,club_id.eq.${createdBy}`)
      .order('is_official', { ascending: false })
      .order('name')

    if (error) throw error

    setCategories(data || [])
  } catch (err: any) {
    console.error('Error loading categories:', err)
    setError('Erro ao carregar categorias')
  } finally {
    setIsLoadingCategories(false)
  }
}

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => {
      const exists = prev.find(c => c.categoryId === categoryId)
      
      if (exists) {
        return prev.filter(c => c.categoryId !== categoryId)
      } else {
        return [...prev, { categoryId, price: 50 }]
      }
    })
  }

  const handlePriceChange = (categoryId: string, price: string) => {
    const numPrice = parseFloat(price) || 0
    
    setSelectedCategories(prev => 
      prev.map(c => 
        c.categoryId === categoryId 
          ? { ...c, price: numPrice }
          : c
      )
    )
  }

  const removeCategorySelection = (categoryId: string) => {
    setSelectedCategories(prev => prev.filter(c => c.categoryId !== categoryId))
  }

  const getCategoryById = (id: string) => {
    return categories.find(c => c.id === id)
  }

  const calculateTotalExample = () => {
    if (selectedCategories.length === 0) return 0
    
    const sum = selectedCategories.reduce((acc, c) => acc + c.price, 0)
    
    if (selectedCategories.length === 2) {
      return sum - parseFloat(formData.discountTwoCategories || '0')
    } else if (selectedCategories.length >= 3) {
      return sum - parseFloat(formData.discountThreeOrMore || '0')
    }
    
    return sum
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      if (!formData.name.trim()) {
        setError('Nome do torneio é obrigatório')
        return
      }

      if (!formData.startDate) {
        setError('Data de início é obrigatória')
        return
      }

      if (!formData.location.trim()) {
        setError('Local do torneio é obrigatório')
        return
      }

      if (selectedCategories.length === 0) {
        setError('Selecione pelo menos uma categoria')
        return
      }

      // Prepare dates
      const startDate = new Date(formData.startDate)
      startDate.setHours(9, 0, 0, 0)
      
      const endDate = formData.endDate 
        ? new Date(formData.endDate)
        : new Date(formData.startDate)
      endDate.setHours(18, 0, 0, 0)
      
      const registrationDeadline = formData.registrationDeadline
        ? new Date(formData.registrationDeadline)
        : new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      registrationDeadline.setHours(23, 59, 59, 999)

      if (editTournament) {
        // UPDATE EXISTING TOURNAMENT
        const { data: tournament, error: updateError } = await supabase
          .from('app_5732e5c77b_tournaments')
          .update({
            name: formData.name,
            description: formData.description || null,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            registration_deadline: registrationDeadline.toISOString(),
            location: formData.location,
            max_participants: parseInt(formData.maxParticipants) || 32,
            format: formData.format,
            rules: formData.rules || 'Regras oficiais CBTM',
            prizes: formData.prizes || 'Medalhas para os 3 primeiros colocados',
            discount_two_categories: parseFloat(formData.discountTwoCategories) || 0,
            discount_three_or_more: parseFloat(formData.discountThreeOrMore) || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', editTournament.id)
          .select()
          .single()

        if (updateError) throw updateError

        // Delete existing categories
        await supabase
          .from('app_5732e5c77b_tournament_categories')
          .delete()
          .eq('tournament_id', editTournament.id)

        // Insert new categories with prices
        const tournamentCategories = selectedCategories.map(sc => ({
          tournament_id: editTournament.id,
          category_id: sc.categoryId,
          price: sc.price
        }))

        const { error: catError } = await supabase
          .from('app_5732e5c77b_tournament_categories')
          .insert(tournamentCategories)

        if (catError) throw catError

        setSuccess('Torneio atualizado com sucesso!')
        
        setTimeout(() => {
          onTournamentCreated(tournament)
        }, 1500)

      } else {
        // CREATE NEW TOURNAMENT
        const { data: tournament, error: createError } = await supabase
          .from('app_5732e5c77b_tournaments')
          .insert([{
            name: formData.name,
            description: formData.description || null,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            registration_deadline: registrationDeadline.toISOString(),
            location: formData.location,
            max_participants: parseInt(formData.maxParticipants) || 32,
            format: formData.format,
            rules: formData.rules || 'Regras oficiais CBTM',
            prizes: formData.prizes || 'Medalhas para os 3 primeiros colocados',
            discount_two_categories: parseFloat(formData.discountTwoCategories) || 0,
            discount_three_or_more: parseFloat(formData.discountThreeOrMore) || 0,
            created_by: createdBy,
            status: 'open',
            tournament_type: 'individual'
          }])
          .select()
          .single()

        if (createError) throw createError

        // Insert categories with prices
        const tournamentCategories = selectedCategories.map(sc => ({
          tournament_id: tournament.id,
          category_id: sc.categoryId,
          price: sc.price
        }))

        const { error: catError } = await supabase
          .from('app_5732e5c77b_tournament_categories')
          .insert(tournamentCategories)

        if (catError) throw catError

        // Update club's tournament count
        const { data: club } = await supabase
          .from('app_5732e5c77b_clubs')
          .select('tournaments_created, active_tournaments')
          .eq('id', createdBy)
          .single()

        if (club) {
          await supabase
            .from('app_5732e5c77b_clubs')
            .update({
              tournaments_created: (club.tournaments_created || 0) + 1,
              active_tournaments: (club.active_tournaments || 0) + 1
            })
            .eq('id', createdBy)
        }

        setSuccess('Torneio criado com sucesso!')
        
        setTimeout(() => {
          onTournamentCreated(tournament)
        }, 1500)
      }

    } catch (err: any) {
      console.error('Error saving tournament:', err)
      setError(err.message || 'Erro ao salvar torneio. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryColor = (gender: string) => {
    if (gender === 'male') return 'bg-blue-50 border-blue-200'
    if (gender === 'female') return 'bg-pink-50 border-pink-200'
    return 'bg-purple-50 border-purple-200'
  }

  const getCategoryBadgeColor = (gender: string) => {
    if (gender === 'male') return 'bg-blue-100 text-blue-800'
    if (gender === 'female') return 'bg-pink-100 text-pink-800'
    return 'bg-purple-100 text-purple-800'
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">
            {editTournament ? 'Editar Torneio' : 'Criar Novo Torneio'}
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure as categorias e preços do seu torneio
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Torneio *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Campeonato Regional 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva o torneio..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Ex: Centro Esportivo Municipal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Máx. Participantes</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', e.target.value)}
                  placeholder="32"
                  min="4"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Datas e Formato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={formData.startDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">Prazo de Inscrição</Label>
                <Input
                  id="registrationDeadline"
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                  max={formData.startDate}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Formato do Torneio</Label>
                <Select value={formData.format} onValueChange={(value) => handleInputChange('format', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="groups_elimination">Grupos + Eliminatórias</SelectItem>
                    <SelectItem value="elimination">Eliminação Direta</SelectItem>
                    <SelectItem value="round_robin">Todos contra Todos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories & Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Categorias e Preços
            </CardTitle>
            <CardDescription>
              Selecione as categorias e defina o preço individual de cada uma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingCategories ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando categorias...
              </div>
            ) : (
              <>
                {/* Selected Categories with Prices */}
                {selectedCategories.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-base">
                      Categorias Selecionadas ({selectedCategories.length})
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedCategories.map(sc => {
                        const category = getCategoryById(sc.categoryId)
                        if (!category) return null
                        
                        return (
                          <div 
                            key={sc.categoryId}
                            className={`p-3 border-2 rounded-lg ${getCategoryColor(category.gender)}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-sm truncate">
                                    {category.name}
                                  </h4>
                                  <Badge variant="outline" className={`text-xs ${getCategoryBadgeColor(category.gender)}`}>
                                    {category.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`price-${sc.categoryId}`} className="text-xs text-muted-foreground">
                                    Preço:
                                  </Label>
                                  <div className="relative flex-1">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                      R$
                                    </span>
                                    <Input
                                      id={`price-${sc.categoryId}`}
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={sc.price}
                                      onChange={(e) => handlePriceChange(sc.categoryId, e.target.value)}
                                      className="pl-8 h-8 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCategorySelection(sc.categoryId)}
                                className="h-8 w-8 p-0 hover:bg-destructive/10"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Available Categories */}
                <div className="space-y-3">
                  <Label className="text-base">Categorias Disponíveis</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                    {categories.map(category => {
                      const isSelected = selectedCategories.some(sc => sc.categoryId === category.id)
                      
                      return (
                        <div 
                          key={category.id} 
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={category.id}
                            checked={isSelected}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                          />
                          <Label 
                            htmlFor={category.id} 
                            className="text-sm cursor-pointer hover:text-blue-600 flex-1"
                            title={category.name}
                          >
                            {category.name}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
{/* Separador */}
<div className="border-t pt-6 mt-6">
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-base">Categorias Personalizadas do Clube</Label>
        <p className="text-sm text-muted-foreground">
          Crie categorias específicas para o seu clube
        </p>
      </div>
    </div>

    {/* Lista de categorias personalizadas */}
    {categories.filter(c => !c.is_official).length > 0 && (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3 border rounded-lg bg-orange-50">
        {categories
          .filter(c => !c.is_official)
          .map(category => {
            const isSelected = selectedCategories.some(sc => sc.categoryId === category.id)
            
            return (
              <div 
                key={category.id} 
                className="flex items-center space-x-2"
              >
                <Checkbox
                  id={`custom-${category.id}`}
                  checked={isSelected}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                />
                <Label 
                  htmlFor={`custom-${category.id}`}
                  className="text-sm cursor-pointer hover:text-orange-600 flex-1"
                  title={category.name}
                >
                  {category.name}
                </Label>
              </div>
            )
          })}
      </div>
    )}

    {/* Formulário inline para criar categoria */}
    <div className="space-y-3 p-4 border-2 border-dashed rounded-lg bg-gray-50">
      <h4 className="font-medium text-sm">➕ Criar Nova Categoria</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="customName" className="text-xs">Nome da Categoria *</Label>
          <Input
            id="customName"
            value={customCategory.name}
            onChange={(e) => setCustomCategory(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Praticantes"
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customGender" className="text-xs">Gênero</Label>
          <Select 
            value={customCategory.gender} 
            onValueChange={(value: 'male' | 'female' | 'mixed') => 
              setCustomCategory(prev => ({ ...prev, gender: value }))
            }
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
              <SelectItem value="mixed">Misto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customAgeMin" className="text-xs">Idade Mínima</Label>
          <Input
            id="customAgeMin"
            type="number"
            value={customCategory.ageMin}
            onChange={(e) => setCustomCategory(prev => ({ ...prev, ageMin: e.target.value }))}
            placeholder="0"
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customAgeMax" className="text-xs">Idade Máxima</Label>
          <Input
            id="customAgeMax"
            type="number"
            value={customCategory.ageMax}
            onChange={(e) => setCustomCategory(prev => ({ ...prev, ageMax: e.target.value }))}
            placeholder="999"
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customRatingMin" className="text-xs">Rating Mínimo</Label>
          <Input
            id="customRatingMin"
            type="number"
            value={customCategory.ratingMin}
            onChange={(e) => setCustomCategory(prev => ({ ...prev, ratingMin: e.target.value }))}
            placeholder="0"
            className="h-9"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customRatingMax" className="text-xs">Rating Máximo</Label>
          <Input
            id="customRatingMax"
            type="number"
            value={customCategory.ratingMax}
            onChange={(e) => setCustomCategory(prev => ({ ...prev, ratingMax: e.target.value }))}
            placeholder="9999"
            className="h-9"
          />
        </div>
      </div>

      <Button
        type="button"
        onClick={handleCreateCustomCategory}
        variant="outline"
        size="sm"
        className="w-full"
      >
        Criar Categoria Personalizada
      </Button>
    </div>
  </div>
</div>
                {selectedCategories.length === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Selecione pelo menos uma categoria para continuar
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Discounts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Descontos por Múltiplas Categorias
            </CardTitle>
            <CardDescription>
              Defina descontos quando o atleta se inscrever em mais de uma categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountTwo">Desconto para 2 Categorias (R$)</Label>
                <Input
                  id="discountTwo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountTwoCategories}
                  onChange={(e) => handleInputChange('discountTwoCategories', e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Ex: Se for R$ 10, duas categorias de R$ 40 custariam R$ 70
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountThree">Desconto para 3+ Categorias (R$)</Label>
                <Input
                  id="discountThree"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountThreeOrMore}
                  onChange={(e) => handleInputChange('discountThreeOrMore', e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Ex: Se for R$ 20, três categorias de R$ 40 custariam R$ 100
                </p>
              </div>
            </div>

            {selectedCategories.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Exemplo de Cálculo:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Soma das categorias selecionadas:</span>
                    <span className="font-medium">
                      R$ {selectedCategories.reduce((acc, c) => acc + c.price, 0).toFixed(2)}
                    </span>
                  </div>
                  {selectedCategories.length === 2 && parseFloat(formData.discountTwoCategories) > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Desconto (2 categorias):</span>
                      <span className="font-medium">- R$ {parseFloat(formData.discountTwoCategories).toFixed(2)}</span>
                    </div>
                  )}
                  {selectedCategories.length >= 3 && parseFloat(formData.discountThreeOrMore) > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Desconto (3+ categorias):</span>
                      <span className="font-medium">- R$ {parseFloat(formData.discountThreeOrMore).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-blue-300 font-bold text-blue-900">
                    <span>Total Final:</span>
                    <span>R$ {calculateTotalExample().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rules">Regulamento</Label>
              <Textarea
                id="rules"
                value={formData.rules}
                onChange={(e) => handleInputChange('rules', e.target.value)}
                placeholder="Regras específicas do torneio..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prizes">Premiação</Label>
              <Textarea
                id="prizes"
                value={formData.prizes}
                onChange={(e) => handleInputChange('prizes', e.target.value)}
                placeholder="Descrição da premiação..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button 
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || selectedCategories.length === 0}
            size="lg"
          >
            {isLoading ? 'Salvando...' : (editTournament ? 'Atualizar Torneio' : 'Criar Torneio')}
          </Button>
        </div>
      </div>
    </div>
  )
}