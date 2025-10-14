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
import { Calendar, MapPin, Users, Trophy, CheckCircle, AlertCircle, X } from 'lucide-react'
import { TournamentStatus } from '@/lib/types'

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
}

export function TournamentCreation({ onTournamentCreated, createdBy, editTournament }: TournamentCreationProps) {
  const [formData, setFormData] = useState({
    name: editTournament?.name || '',
    description: editTournament?.description || '',
    startDate: editTournament?.startDate ? new Date(editTournament.startDate).toISOString().split('T')[0] : '',
    endDate: editTournament?.endDate ? new Date(editTournament.endDate).toISOString().split('T')[0] : '',
    registrationDeadline: editTournament?.registrationDeadline ? new Date(editTournament.registrationDeadline).toISOString().split('T')[0] : '',
    location: editTournament?.location || '',
    maxParticipants: editTournament?.maxParticipants?.toString() || '',
    registrationPrice: editTournament?.registrationPrice?.toString() || '',
    format: editTournament?.format || 'groups_elimination',
    rules: editTournament?.rules || '',
    prizes: editTournament?.prizes || ''
  })

  // Simplified ABSOLUTO categories - all displayed at once
  const allCategories = [
    // Categorias por Idade - Masculino
    'Sub-7 Masculino', 'Sub-9 Masculino', 'Sub-11 Masculino', 'Sub-13 Masculino', 
    'Sub-15 Masculino', 'Sub-19 Masculino', 'Sub-21 Masculino', 'Adulto Masculino',
    'Veterano 40+ Masculino', 'Veterano 50+ Masculino', 'Veterano 60+ Masculino', 
    'Veterano 70+ Masculino', 'Veterano 75+ Masculino',
    
    // Categorias por Idade - Feminino
    'Sub-7 Feminino', 'Sub-9 Feminino', 'Sub-11 Feminino', 'Sub-13 Feminino',
    'Sub-15 Feminino', 'Sub-19 Feminino', 'Sub-21 Feminino', 'Adulto Feminino',
    'Veterano 40+ Feminino', 'Veterano 50+ Feminino', 'Veterano 60+ Feminino',
    'Veterano 70+ Feminino', 'Veterano 75+ Feminino',
    
    // Categorias ABSOLUTO por Rating
    'Absoluto A Masculino', 'Absoluto B Masculino', 'Absoluto C Masculino',
    'Absoluto D Masculino', 'Absoluto E Masculino', 'Absoluto F Masculino',
    'Absoluto A Feminino', 'Absoluto B Feminino', 'Absoluto C Feminino',
    'Absoluto D Feminino', 'Absoluto E Feminino', 'Absoluto F Feminino',
    
    // Categorias Especiais
    'Iniciantes Masculino', 'Iniciantes Feminino',
    'Duplas Masculinas', 'Duplas Femininas', 'Duplas Mistas'
  ]

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(editTournament?.categories || [])
  const [customCategory, setCustomCategory] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    // Initialize categories with ABSOLUTO categories
    const initialCategories: Category[] = allCategories.map((name, index) => ({
      id: `absoluto_${index}`,
      name,
      type: 'absoluto',
      gender: name.includes('Masculino') ? 'male' : name.includes('Feminino') ? 'female' : 'mixed'
    }))
    
    setCategories(initialCategories)
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category)
      } else {
        return [...prev, category]
      }
    })
  }

  const removeCategorySelection = (category: string) => {
    setSelectedCategories(prev => prev.filter(c => c !== category))
  }

  const handleAddCustomCategory = () => {
    if (customCategory.trim()) {
      const newCategory: Category = {
        id: `custom_${Date.now()}`,
        name: customCategory.trim(),
        type: 'custom',
        gender: 'mixed'
      }
      
      setCategories(prev => [...prev, newCategory])
      setSelectedCategories(prev => [...prev, newCategory.name])
      setCustomCategory('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validate required fields
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

      const tournamentData = {
        id: editTournament?.id || `tournament_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate || formData.startDate),
        registrationDeadline: new Date(formData.registrationDeadline || formData.startDate),
        location: formData.location,
        maxParticipants: parseInt(formData.maxParticipants) || 32,
        registrationPrice: parseFloat(formData.registrationPrice) || 0,
        format: formData.format,
        categories: selectedCategories,
        rules: formData.rules || 'Regras oficiais CBTM',
        prizes: formData.prizes || 'Medalhas para os 3 primeiros colocados',
        createdBy,
        status: editTournament?.status || TournamentStatus.OPEN // FIXED: Use OPEN instead of 'open'
      }

      console.log('🔵 CREATING/UPDATING TOURNAMENT:', tournamentData)

      setSuccess(editTournament ? 'Torneio atualizado com sucesso!' : 'Torneio criado com sucesso!')
      
      setTimeout(() => {
        onTournamentCreated(tournamentData)
      }, 1500)

    } catch (err: any) {
      console.error('🔴 ERROR CREATING TOURNAMENT:', err)
      setError('Erro ao criar torneio. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryColor = (category: string) => {
    if (category.includes('Masculino')) return 'bg-blue-100 text-blue-800'
    if (category.includes('Feminino')) return 'bg-pink-100 text-pink-800'
    if (category.includes('Mistas')) return 'bg-purple-100 text-purple-800'
    return 'bg-orange-100 text-orange-800' // Custom categories
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {editTournament ? 'Editar Torneio' : 'Criar Novo Torneio'}
          </h2>
          <p className="text-gray-600">Configure seu torneio com categorias ABSOLUTO</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
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
                  required
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
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div className="space-y-2">
                  <Label htmlFor="registrationPrice">Taxa de Inscrição (R$)</Label>
                  <Input
                    id="registrationPrice"
                    type="number"
                    step="0.01"
                    value={formData.registrationPrice}
                    onChange={(e) => handleInputChange('registrationPrice', e.target.value)}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates and Format */}
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
                  required
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

        {/* Categories Selection - Simplified */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias ABSOLUTO</CardTitle>
            <CardDescription>
              Selecione as categorias baseadas nas regras CBTM - Todas as categorias disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selected Categories */}
            {selectedCategories.length > 0 && (
              <div className="space-y-2">
                <Label>Categorias Selecionadas ({selectedCategories.length}):</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map(category => (
                    <Badge 
                      key={category} 
                      className={`${getCategoryColor(category)} cursor-pointer hover:opacity-80`}
                      onClick={() => removeCategorySelection(category)}
                    >
                      {category}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* All Categories Grid */}
            <div className="space-y-2">
              <Label>Todas as Categorias ABSOLUTO:</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-96 overflow-y-auto border rounded p-3">
                {allCategories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => handleCategoryToggle(category)}
                    />
                    <Label 
                      htmlFor={category} 
                      className="text-sm cursor-pointer hover:text-blue-600"
                      title={category}
                    >
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Categories Section */}
            <div className="space-y-3 border-t pt-4">
              <h4 className="font-medium text-orange-700">Categoria Personalizada</h4>
              <div className="space-y-2">
                <Label htmlFor="customCategory">Criar Nova Categoria</Label>
                <div className="flex space-x-2">
                  <Input
                    id="customCategory"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Ex: Categoria Especial"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddCustomCategory()
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddCustomCategory}
                    disabled={!customCategory.trim()}
                    variant="outline"
                  >
                    + Adicionar
                  </Button>
                </div>
              </div>

              {/* Display custom categories */}
              {categories.filter(cat => cat.type === 'custom').length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Categorias Personalizadas:</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {categories
                      .filter(cat => cat.type === 'custom')
                      .map(category => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={category.id}
                            checked={selectedCategories.includes(category.name)}
                            onCheckedChange={() => handleCategoryToggle(category.name)}
                          />
                          <Label 
                            htmlFor={category.id} 
                            className="text-sm cursor-pointer hover:text-orange-600"
                            title={category.name}
                          >
                            {category.name}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {selectedCategories.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Selecione pelo menos uma categoria para continuar.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Additional Information */}
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

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <Button type="submit" disabled={isLoading || selectedCategories.length === 0}>
            {isLoading ? 'Processando...' : (editTournament ? 'Atualizar Torneio' : 'Criar Torneio')}
          </Button>
        </div>
      </form>
    </div>
  )
}