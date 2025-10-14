'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Users, Target, Shuffle, BarChart3, AlertCircle, 
  CheckCircle, Settings, Trophy, Star
} from 'lucide-react'
import { TestAthlete } from '@/lib/test-athletes'

interface GroupConfigurationProps {
  athletes: TestAthlete[]
  category: string
  onGroupsGenerated: (groups: TournamentGroup[]) => void
}

interface TournamentGroup {
  id: string
  name: string
  athletes: TestAthlete[]
  averageRating: number
}

type GroupingMethod = 'rating' | 'random' | 'manual'

export function GroupConfiguration({ athletes, category, onGroupsGenerated }: GroupConfigurationProps) {
  const [athletesPerGroup, setAthletesPerGroup] = useState([8])
  const [groupingMethod, setGroupingMethod] = useState<GroupingMethod>('rating')
  const [previewGroups, setPreviewGroups] = useState<TournamentGroup[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const minAthletesPerGroup = 3
  const maxAthletesPerGroup = 12
  const totalAthletes = athletes.length

  useEffect(() => {
    generatePreview()
  }, [athletesPerGroup, groupingMethod, athletes])

  const getNumberOfGroups = () => {
    return Math.ceil(totalAthletes / athletesPerGroup[0])
  }

  const generatePreview = () => {
    if (athletes.length === 0) return

    const numGroups = getNumberOfGroups()
    const athletesPerGroupValue = athletesPerGroup[0]
    
    let sortedAthletes = [...athletes]
    
    // Sort athletes based on method
    if (groupingMethod === 'rating') {
      sortedAthletes.sort((a, b) => b.currentRating - a.currentRating)
    } else if (groupingMethod === 'random') {
      sortedAthletes.sort(() => Math.random() - 0.5)
    }

    const groups: TournamentGroup[] = []
    
    if (groupingMethod === 'rating') {
      // Distribute by rating to balance groups
      for (let i = 0; i < numGroups; i++) {
        groups.push({
          id: `group_${i}`,
          name: `Grupo ${String.fromCharCode(65 + i)}`,
          athletes: [],
          averageRating: 0
        })
      }
      
      // Snake distribution for balanced groups
      sortedAthletes.forEach((athlete, index) => {
        const groupIndex = Math.floor(index / numGroups) % 2 === 0 
          ? index % numGroups 
          : numGroups - 1 - (index % numGroups)
        groups[groupIndex].athletes.push(athlete)
      })
    } else {
      // Simple sequential distribution
      for (let i = 0; i < numGroups; i++) {
        const startIndex = i * athletesPerGroupValue
        const endIndex = Math.min(startIndex + athletesPerGroupValue, sortedAthletes.length)
        const groupAthletes = sortedAthletes.slice(startIndex, endIndex)
        
        groups.push({
          id: `group_${i}`,
          name: `Grupo ${String.fromCharCode(65 + i)}`,
          athletes: groupAthletes,
          averageRating: 0
        })
      }
    }

    // Calculate average ratings
    groups.forEach(group => {
      if (group.athletes.length > 0) {
        group.averageRating = Math.round(
          group.athletes.reduce((sum, athlete) => sum + athlete.currentRating, 0) / group.athletes.length
        )
      }
    })

    setPreviewGroups(groups)
  }

  const handleGenerateGroups = async () => {
    setIsGenerating(true)
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    onGroupsGenerated(previewGroups)
    setIsGenerating(false)
  }

  const getGroupBalance = () => {
    if (previewGroups.length === 0) return { isBalanced: true, variance: 0 }
    
    const ratings = previewGroups.map(g => g.averageRating)
    const avgRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
    const variance = Math.round(
      Math.sqrt(ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length)
    )
    
    return {
      isBalanced: variance <= 50, // Consider balanced if variance <= 50 points
      variance
    }
  }

  const balance = getGroupBalance()

  return (
    <div className="space-y-6">
      {/* Category Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Configuração de Grupos - {category}
          </CardTitle>
          <CardDescription>
            {totalAthletes} atletas inscritos nesta categoria
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="configuration" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="configuration">Configuração</TabsTrigger>
          <TabsTrigger value="preview">Preview dos Grupos</TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          {/* Athletes per Group */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atletas por Grupo</CardTitle>
              <CardDescription>
                Defina quantos atletas cada grupo deve ter
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Atletas por grupo:</Label>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {athletesPerGroup[0]} atletas
                  </Badge>
                </div>
                
                <Slider
                  value={athletesPerGroup}
                  onValueChange={setAthletesPerGroup}
                  min={minAthletesPerGroup}
                  max={maxAthletesPerGroup}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Mín: {minAthletesPerGroup}</span>
                  <span>Máx: {maxAthletesPerGroup}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{getNumberOfGroups()}</div>
                  <div className="text-sm text-blue-600">Grupos</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{athletesPerGroup[0]}</div>
                  <div className="text-sm text-green-600">Atletas/Grupo</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{totalAthletes}</div>
                  <div className="text-sm text-purple-600">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grouping Method */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Método de Agrupamento</CardTitle>
              <CardDescription>
                Escolha como os atletas serão distribuídos nos grupos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={groupingMethod} onValueChange={(value) => setGroupingMethod(value as GroupingMethod)}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value="rating" id="rating" />
                    <div className="flex-1">
                      <Label htmlFor="rating" className="font-medium cursor-pointer">
                        Por Rating (Recomendado)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Distribui atletas para balancear o nível de cada grupo
                      </p>
                    </div>
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value="random" id="random" />
                    <div className="flex-1">
                      <Label htmlFor="random" className="font-medium cursor-pointer">
                        Aleatório
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Distribui atletas de forma totalmente aleatória
                      </p>
                    </div>
                    <Shuffle className="h-5 w-5 text-green-500" />
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border rounded-lg opacity-50">
                    <RadioGroupItem value="manual" id="manual" disabled />
                    <div className="flex-1">
                      <Label htmlFor="manual" className="font-medium cursor-pointer">
                        Manual (Em breve)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Permite editar grupos manualmente após geração
                      </p>
                    </div>
                    <Settings className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Balance Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Balanceamento dos Grupos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {balance.isBalanced ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <div className="font-medium">
                      {balance.isBalanced ? 'Grupos Balanceados' : 'Grupos Desbalanceados'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Variação de rating: ±{balance.variance} pontos
                    </div>
                  </div>
                </div>
                <Badge variant={balance.isBalanced ? 'default' : 'secondary'}>
                  {balance.isBalanced ? 'Ótimo' : 'Aceitável'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          {previewGroups.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum grupo gerado</h3>
                <p className="text-muted-foreground">
                  Configure os parâmetros para ver o preview dos grupos
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {previewGroups.map((group, index) => (
                <Card key={group.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <Badge variant="outline">
                        {group.athletes.length} atletas
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4" />
                      <span>Rating médio: {group.averageRating}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {group.athletes.slice(0, 4).map((athlete) => (
                        <div key={athlete.id} className="flex items-center justify-between text-sm">
                          <span className="truncate">{athlete.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {athlete.currentRating}
                          </Badge>
                        </div>
                      ))}
                      {group.athletes.length > 4 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{group.athletes.length - 4} atletas
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleGenerateGroups}
          disabled={isGenerating || previewGroups.length === 0}
          size="lg"
          className="min-w-[200px]"
        >
          {isGenerating ? (
            'Gerando Grupos...'
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar e Gerar Grupos
            </>
          )}
        </Button>
      </div>

      {/* Warning if unbalanced */}
      {!balance.isBalanced && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Os grupos estão desbalanceados (variação de ±{balance.variance} pontos). 
            Considere ajustar o número de atletas por grupo ou usar o método "Por Rating".
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}