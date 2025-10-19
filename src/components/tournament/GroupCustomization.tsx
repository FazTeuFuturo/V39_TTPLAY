'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Users, Shuffle, ArrowLeft, CheckCircle, AlertCircle, 
  Move, RotateCcw, Save, Settings
} from 'lucide-react'

interface Registration {
  id: string
  athleteId: string
  athleteName: string
  athleteRating: number
  athleteLevel: string
  athleteCity: string
  category: string
  registeredAt: Date
}

interface TournamentGroup {
  id: string
  name: string
  category: string
  athletes: Registration[]
}

interface GroupCustomizationProps {
  tournament: any
  registeredAthletes: Registration[] // <<< ADICIONE ESTA LINHA
  onBack: () => void
  onSave: (groups: TournamentGroup[]) => void
}
export function GroupCustomization({ tournament, registeredAthletes, onBack, onSave }: GroupCustomizationProps) {
  const [groups, setGroups] = useState<TournamentGroup[]>([])
  const [athletesPerGroup, setAthletesPerGroup] = useState(4)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

   const generateGroups = () => {
    if (registeredAthletes.length === 0) {
      setError('Nenhum atleta inscrito encontrado')
      return
    }

    if (athletesPerGroup < 2) {
      setError('Mínimo de 2 atletas por grupo')
      return
    }

    if (athletesPerGroup > 20) {
      setError('Máximo de 20 atletas por grupo')
      return
    }

    setIsGenerating(true)
    setError('')

    try {
      // Group athletes by category
      const athletesByCategory = registeredAthletes.reduce((acc, athlete) => {
        if (!acc[athlete.category]) {
          acc[athlete.category] = []
        }
        acc[athlete.category].push(athlete)
        return acc
      }, {} as Record<string, Registration[]>)

      const newGroups: TournamentGroup[] = []

      // Generate groups for each category
      Object.entries(athletesByCategory).forEach(([category, athletes]) => {
        // Shuffle athletes for random distribution
        const shuffledAthletes = [...athletes].sort(() => Math.random() - 0.5)
        
        // Calculate number of groups needed
        const numberOfGroups = Math.ceil(shuffledAthletes.length / athletesPerGroup)
        
        // Create groups for this category
        for (let i = 0; i < numberOfGroups; i++) {
          const startIndex = i * athletesPerGroup
          const endIndex = Math.min(startIndex + athletesPerGroup, shuffledAthletes.length)
          const groupAthletes = shuffledAthletes.slice(startIndex, endIndex)
          
          if (groupAthletes.length > 0) {
            newGroups.push({
              id: `group_${category}_${i + 1}`,
              name: `${category} - Grupo ${String.fromCharCode(65 + i)}`,
              category,
              athletes: groupAthletes
            })
          }
        }
      })

      setGroups(newGroups)
      
      // Save groups to localStorage
      localStorage.setItem(`tournament_groups_${tournament.id}`, JSON.stringify(newGroups))
      
      setMessage(`${newGroups.length} grupos gerados com sucesso!`)
      
    } catch (err) {
      console.error('Error generating groups:', err)
      setError('Erro ao gerar grupos. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const moveAthlete = (athleteId: string, fromGroupId: string, toGroupId: string) => {
    if (fromGroupId === toGroupId) return

    const updatedGroups = groups.map(group => {
      if (group.id === fromGroupId) {
        return {
          ...group,
          athletes: group.athletes.filter(a => a.id !== athleteId)
        }
      }
      if (group.id === toGroupId) {
        const athlete = groups
          .find(g => g.id === fromGroupId)
          ?.athletes.find(a => a.id === athleteId)
        
        if (athlete) {
          return {
            ...group,
            athletes: [...group.athletes, athlete]
          }
        }
      }
      return group
    })

    setGroups(updatedGroups)
    localStorage.setItem(`tournament_groups_${tournament.id}`, JSON.stringify(updatedGroups))
    setMessage('Atleta movido com sucesso!')
  }

  const balanceGroups = () => {
    if (groups.length === 0) return

    const categoryGroups = groups.filter(g => g.category === selectedCategory)
    if (categoryGroups.length === 0) return

    // Collect all athletes from category groups
    const allAthletes = categoryGroups.flatMap(g => g.athletes)
    
    // Sort by rating for balanced distribution
    allAthletes.sort((a, b) => b.athleteRating - a.athleteRating)
    
    // Redistribute athletes evenly
    const numberOfGroups = categoryGroups.length
    const updatedGroups = groups.map(group => {
      if (group.category === selectedCategory) {
        return { ...group, athletes: [] }
      }
      return group
    })

    // Distribute athletes in round-robin fashion
    allAthletes.forEach((athlete, index) => {
      const groupIndex = index % numberOfGroups
      const targetGroup = updatedGroups.find(g => 
        g.category === selectedCategory && 
        g.id === categoryGroups[groupIndex].id
      )
      if (targetGroup) {
        targetGroup.athletes.push(athlete)
      }
    })

    setGroups(updatedGroups)
    localStorage.setItem(`tournament_groups_${tournament.id}`, JSON.stringify(updatedGroups))
    setMessage('Grupos balanceados por rating!')
  }

  const saveGroups = () => {
    try {
      // Save groups
      localStorage.setItem(`tournament_groups_${tournament.id}`, JSON.stringify(groups))
      
      // Update tournament status
      const tournamentStatus = {
        registrationStatus: 'closed',
        groupsGenerated: true,
        bracketGenerated: false,
        tournamentStarted: false
      }
      localStorage.setItem(`tournament_status_${tournament.id}`, JSON.stringify(tournamentStatus))
      
      onSave(groups)
      setMessage('Grupos salvos com sucesso!')
    } catch (error) {
      setError('Erro ao salvar grupos')
    }
  }

  // Get categories from registered athletes
  const categories = [...new Set(registeredAthletes.map(a => a.category))]
  
  // Get groups for selected category
  const categoryGroups = groups.filter(g => g.category === selectedCategory)
  
  // Get athletes not in any group for selected category
  const categoryAthletes = registeredAthletes.filter(a => a.category === selectedCategory)
  const athletesInGroups = categoryGroups.flatMap(g => g.athletes.map(a => a.id))
  const unassignedAthletes = categoryAthletes.filter(a => !athletesInGroups.includes(a.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Personalizar Grupos</h1>
            <p className="text-muted-foreground">
              {registeredAthletes.length} atletas inscritos • {groups.length} grupos criados
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={balanceGroups} disabled={categoryGroups.length === 0}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Balancear
          </Button>
          <Button onClick={saveGroups} disabled={groups.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Grupos
          </Button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{message}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração dos Grupos</CardTitle>
          <CardDescription>
            Defina quantos atletas por grupo e gere os grupos automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Atletas por Grupo</Label>
              <Input
                type="number"
                min="2"
                max="20"
                value={athletesPerGroup}
                onChange={(e) => setAthletesPerGroup(Number(e.target.value) || 3)}
                placeholder="Ex: 4"
                className="w-32"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={generateGroups} 
                disabled={isGenerating || registeredAthletes.length === 0}
                className="w-full"
              >
                <Shuffle className="h-4 w-4 mr-2" />
                {isGenerating ? 'Gerando...' : 'Gerar Grupos'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups Display */}
      {selectedCategory && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Grupos - {selectedCategory}</h3>
            <Badge variant="outline">
              {categoryGroups.length} grupos • {categoryGroups.reduce((sum, g) => sum + g.athletes.length, 0)} atletas
            </Badge>
          </div>

          {/* Unassigned Athletes */}
          {unassignedAthletes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Atletas Não Agrupados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {unassignedAthletes.map(athlete => (
                    <div key={athlete.id} className="p-2 border rounded text-sm">
                      <div className="font-medium">{athlete.athleteName}</div>
                      <div className="text-muted-foreground">Rating: {athlete.athleteRating}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Groups */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryGroups.map(group => (
              <Card key={group.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{group.name}</CardTitle>
                  <CardDescription>
                    {group.athletes.length} atletas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {group.athletes.map(athlete => (
                      <div key={athlete.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{athlete.athleteName}</div>
                          <div className="text-xs text-muted-foreground">
                            Rating: {athlete.athleteRating}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {categoryGroups.filter(g => g.id !== group.id).map(targetGroup => (
                            <Button
                              key={targetGroup.id}
                              size="sm"
                              variant="outline"
                              onClick={() => moveAthlete(athlete.id, group.id, targetGroup.id)}
                              className="h-6 w-6 p-0"
                              title={`Mover para ${targetGroup.name}`}
                            >
                              <Move className="h-3 w-3" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {group.athletes.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Grupo vazio
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {categoryGroups.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum grupo criado</h3>
                <p className="text-muted-foreground mb-4">
                  Configure os parâmetros acima e clique em "Gerar Grupos"
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}