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
import { supabase } from '@/lib/supabase'

// Adicione esta interface
interface RawSupabaseGroup {
  id: string;
  name: string;
  // Permite que 'category' seja um objeto, um array de objetos, ou null
  category: { name: string } | { name: string }[] | null; 
  athletes_on_groups: { player_id: string }[];
}

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
  registeredAthletes: Registration[]
  tournamentCategories: any[] // <<< ADICIONE ESTA LINHA
  onBack: () => void
  onSave: (groups: TournamentGroup[]) => void
}
export function GroupCustomization({ tournament, registeredAthletes, tournamentCategories, onBack, onSave }: GroupCustomizationProps) {
  const [groups, setGroups] = useState<TournamentGroup[]>([])
  const [athletesPerGroup, setAthletesPerGroup] = useState(4)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [athletesByCategory, setAthletesByCategory] = useState<Record<string, Registration[]>>({})
  const [isLoadingData, setIsLoadingData] = useState(true)

useEffect(() => {
  // Esta função agora carrega atletas E os grupos já salvos
  const loadInitialGroupData = async () => {
    if (!tournament.id) return;
    setIsLoadingData(true);
    setError('');

    try {
      // 1. Busca todos os atletas inscritos no torneio com suas categorias
      // Usa a RPC que já validamos, é muito mais eficiente
      const { data: registrations, error: rpcError } = await supabase
        .rpc('get_tournament_registrations_details', { 
          p_tournament_id: tournament.id 
        });

      if (rpcError) throw rpcError;

      // 2. Organiza os atletas por nome de categoria
      // E formata para a sua interface 'Registration'
      const athletesByCat: Record<string, Registration[]> = {};
      registrations.forEach(reg => {
        const categoryName = reg.category_name || 'Sem Categoria';
        if (!athletesByCat[categoryName]) {
          athletesByCat[categoryName] = [];
        }
        
        // Mapeia os dados da RPC (reg.athlete) para a sua interface 'Registration'
        athletesByCat[categoryName].push({
            id: reg.athlete.id,
            athleteId: reg.athlete.id,
            athleteName: reg.athlete.name, // RPC usa 'name', sua UI espera 'athleteName'
            athleteRating: reg.athlete.current_rating || 1200, // RPC usa 'current_rating'
            athleteLevel: reg.athlete.playing_level || 'N/A', // RPC usa 'playing_level'
            athleteCity: reg.athlete.city || 'N/A',
            category: categoryName,
            // A RPC não retorna 'registeredAt', então usamos 'created_at' do atleta como fallback
            registeredAt: new Date(reg.athlete.created_at || Date.now()) 
        });
      });
      
      console.log('✅ Athletes by category loaded:', athletesByCat)
      setAthletesByCategory(athletesByCat);

      // 3. Busca os GRUPOS que já foram salvos no banco para este torneio
      const { data: savedGroupsData, error: groupsError } = await supabase
        .from('tournament_groups')
        .select(`
          id,
          name,
          category:app_5732e5c77b_categories(name),
          athletes_on_groups(player_id)
        `)
        .eq('tournament_id', tournament.id);

      if (groupsError) throw groupsError;

      // 4. Reconstrói o estado 'groups' com os dados do banco
      const reconstructedGroups: TournamentGroup[] = (savedGroupsData as RawSupabaseGroup[] || []).map(group => { // <-- Cast para RawSupabaseGroup[]
  
  // Lógica simplificada e mais segura para obter o nome da categoria
  let categoryName = 'Sem Categoria';
  const categoryRelation = group.category; // Agora TS sabe o tipo
  if (categoryRelation) {
    if (Array.isArray(categoryRelation)) {
      categoryName = categoryRelation[0]?.name || 'Sem Categoria';
    } else {
      categoryName = categoryRelation.name || 'Sem Categoria';
    }
  }

  // Pega os atletas desta categoria que já carregamos
  const categoryAthletesList = athletesByCategory[categoryName] || [];

  // Mapeia os IDs dos atletas do grupo para os objetos completos
  const groupAthletes = group.athletes_on_groups.map(link => {
      // Encontra o atleta completo na nossa lista já formatada
      return categoryAthletesList.find(a => a.id === link.player_id);
  }).filter((a): a is Registration => !!a); // Remove nulos se houver inconsistência e garante o tipo Registration

  return {
    id: group.id, // O ID real do banco
    name: group.name,
    category: categoryName,
    athletes: groupAthletes
  };
});
      
      console.log('✅ Saved groups reconstructed:', reconstructedGroups);
      setGroups(reconstructedGroups);

      // 5. Seleciona a primeira categoria automaticamente
      const firstCategory = Object.keys(athletesByCat)[0];
      if (firstCategory) {
        setSelectedCategory(firstCategory);
      }

    } catch (err: any) {
      console.error('❌ Error loading group data:', err);
      setError('Erro ao carregar dados dos grupos: ' + err.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  loadInitialGroupData();
  // Este useEffect só precisa rodar uma vez ou quando o torneio mudar
}, [tournament.id]);

const generateGroups = () => {
  if (!selectedCategory) {
    setError('Por favor, selecione uma categoria primeiro.');
    return;
  }
  if (athletesPerGroup < 2) {
    setError('Mínimo de 2 atletas por grupo.');
    return;
  }
  if (athletesPerGroup > 20) {
     setError('Máximo de 20 atletas por grupo');
     return;
  }

  setIsGenerating(true);
  setError('');

  // 1. Pega TODOS os atletas da categoria selecionada
  // Usamos 'athletesByCategory' que foi carregado na Fase 1
  const athletesToGroup = athletesByCategory[selectedCategory] || [];
  if (athletesToGroup.length === 0) {
      setError('Não há atletas nesta categoria para agrupar.');
      setIsGenerating(false);
      return;
  }

  // 2. Embaralha os atletas para distribuição aleatória
  const shuffledAthletes = [...athletesToGroup].sort(() => Math.random() - 0.5);
  
  // 3. Calcula quantos grupos serão necessários
  const numberOfGroups = Math.ceil(shuffledAthletes.length / athletesPerGroup);
  
  // 4. Cria os novos grupos
  const newCategoryGroups: TournamentGroup[] = [];
  for (let i = 0; i < numberOfGroups; i++) {
    // Pega os N primeiros atletas da lista misturada
    const groupAthletes = shuffledAthletes.splice(0, athletesPerGroup);
    
    newCategoryGroups.push({
      id: `temp_group_${selectedCategory}_${i}`, // ID temporário (o banco vai gerar o real)
      name: `${selectedCategory} - Grupo ${String.fromCharCode(65 + i)}`,
      category: selectedCategory,
      athletes: groupAthletes
    });
  }

  // 5. Atualiza o estado: remove os grupos antigos da categoria e adiciona os novos
  setGroups(prevGroups => [
    ...prevGroups.filter(g => g.category !== selectedCategory), // Mantém grupos de outras categorias
    ...newCategoryGroups
  ]);

  setMessage(`${newCategoryGroups.length} grupos gerados para a categoria ${selectedCategory}!`);
  setIsGenerating(false);
}

const moveAthlete = (athleteId: string, fromGroupId: string, toGroupId: string) => {
    if (fromGroupId === toGroupId) return;

    let athleteToMove: Registration | undefined;

    // 1. Encontra e remove o atleta do grupo de origem
    const groupsWithoutAthlete = groups.map(group => {
      if (group.id === fromGroupId) {
        athleteToMove = group.athletes.find(a => a.id === athleteId);
        return { ...group, athletes: group.athletes.filter(a => a.id !== athleteId) };
      }
      return group;
    });

    // 2. Adiciona o atleta ao grupo de destino
    const finalGroups = groupsWithoutAthlete.map(group => {
      if (group.id === toGroupId && athleteToMove) {
        // Adiciona o atleta encontrado ao novo grupo
        return { ...group, athletes: [...group.athletes, athleteToMove] };
      }
      return group;
    });

    setGroups(finalGroups); // Apenas atualiza o estado
    // 3. Remove a linha do localStorage
    // localStorage.setItem(`tournament_groups_${tournament.id}`, JSON.stringify(updatedGroups))
    
    // 4. Atualiza a mensagem
    setMessage('Atleta movido. Clique em "Salvar Grupos" para confirmar a mudança.');
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
  	 // Criamos um *novo* array para o estado
  	 const updatedGroups = groups.map(group => {
  	 	 if (group.category === selectedCategory) {
  	 	 	 // Zera os atletas apenas dos grupos da categoria selecionada
  	 	 	 return { ...group, athletes: [] }
  	 	 }
  	 	 return group // Mantém os grupos de outras categorias intactos
  	 })

  	 // Distribute athletes in round-robin fashion
  	 allAthletes.forEach((athlete, index) => {
  	 	 const groupIndex = index % numberOfGroups
  	 	 // Encontra o grupo correto no array 'updatedGroups' para adicionar o atleta
  	 	 const targetGroup = updatedGroups.find(g => g.id === categoryGroups[groupIndex].id)
  	 	 
  	 	 if (targetGroup) {
  	 	 	 targetGroup.athletes.push(athlete)
  	 	 }
  	 })

  	 setGroups(updatedGroups)
  	 // 1. Remove a linha do localStorage
  	 // localStorage.setItem(`tournament_groups_${tournament.id}`, JSON.stringify(updatedGroups))
  	 
  	 // 2. Atualiza a mensagem
  	 setMessage('Grupos balanceados. Clique em "Salvar Grupos" para confirmar.')
  }
// Adicione este estado (se ainda não o fez) perto dos seus outros useStates
  const [isSaving, setIsSaving] = useState(false);
// Em GroupCustomization.tsx

const saveGroups = async () => {
    setIsSaving(true);
    setError('');
    setMessage(''); // <-- Corrigido de setSuccess para setMessage
    
    console.log('--- 🚀 [saveGroups] Iniciando salvamento... ---');

    const currentTournamentId = tournament.id;

    // Validação
    if (groups.length === 0) {
      setError("Nenhum grupo foi gerado para salvar.");
      setIsSaving(false);
      console.warn('[saveGroups] Nenhum grupo para salvar.');
      return;
    }

    // Mapeia nomes de categoria para IDs
    const categoryNameIdMap = new Map(
      tournamentCategories.map(c => [c.name, c.id])
    );
    console.log('[saveGroups] Mapa de Categorias:', categoryNameIdMap);

    try {
      // --- ETAPA 1: DELETAR GRUPOS ANTIGOS DO TORNEIO ---
      console.log('[saveGroups] ETAPA 1: Deletando grupos antigos...');
      
      const { data: oldGroups, error: selectError } = await supabase
        .from('tournament_groups')
        .select('id')
        .eq('tournament_id', currentTournamentId);

      if (selectError) throw new Error(`Falha (1a) ao buscar grupos antigos: ${selectError.message}`);
      
      const oldGroupIds = oldGroups.map(g => g.id);
      console.log(`[saveGroups] Encontrados ${oldGroupIds.length} IDs de grupos antigos.`);

      if (oldGroupIds.length > 0) {
        console.log('[saveGroups] Deletando atletas dos grupos antigos...');
        const { error: deleteAthletesError } = await supabase
          .from('athletes_on_groups')
          .delete()
          .in('group_id', oldGroupIds);

        if (deleteAthletesError) throw new Error(`Falha (1b) ao limpar atletas antigos: ${deleteAthletesError.message}`);

        console.log('[saveGroups] Deletando grupos antigos...');
        const { error: deleteGroupsError } = await supabase
          .from('tournament_groups')
          .delete()
          .in('id', oldGroupIds);

        if (deleteGroupsError) throw new Error(`Falha (1c) ao limpar grupos antigos: ${deleteGroupsError.message}`);
      }

      // --- ETAPA 2: INSERIR OS NOVOS GRUPOS ---
      console.log('[saveGroups] ETAPA 2: Inserindo novos grupos...');
      
      const newGroupsToInsert = groups.map(group => {
        const categoryId = categoryNameIdMap.get(group.category);
        if (!categoryId) {
          throw new Error(`Categoria desconhecida no mapa: ${group.category}`);
        }
        return {
          name: group.name,
          tournament_id: currentTournamentId,
          category_id: categoryId
        };
      });

      console.log(`[saveGroups] Preparado para inserir ${newGroupsToInsert.length} grupos...`, newGroupsToInsert);

      const { data: insertedGroups, error: insertGroupsError } = await supabase
        .from('tournament_groups')
        .insert(newGroupsToInsert)
        .select('id, name');

      if (insertGroupsError) throw new Error(`Falha (2a) ao criar novos grupos: ${insertGroupsError.message}`);
      if (!insertedGroups) throw new Error("[saveGroups] Falha (2b): Inserção de grupos não retornou dados.");

      console.log(`[saveGroups] ${insertedGroups.length} grupos inseridos com sucesso.`);

      // --- ETAPA 3: INSERIR OS ATLETAS NOS NOVOS GRUPOS ---
      console.log('[saveGroups] ETAPA 3: Inserindo atletas nos grupos...');
      
      const groupNameIdMap = new Map(insertedGroups.map(g => [g.name, g.id]));
      console.log('[saveGroups] Mapa de Nomes->IDs:', groupNameIdMap);

      const athletesToInsert = [];
      for (const group of groups) {
        const newGroupId = groupNameIdMap.get(group.name);
        if (!newGroupId) {
            console.warn(`[saveGroups] Grupo "${group.name}" não encontrado no mapa de IDs. Pulando atletas.`);
            continue; 
        }
        for (const athlete of group.athletes) {
          athletesToInsert.push({
            group_id: newGroupId,
            player_id: athlete.id
          });
        }
      }

      console.log(`[saveGroups] Preparado para inserir ${athletesToInsert.length} atletas na tabela de junção...`);

      const { error: insertAthletesError } = await supabase
        .from('athletes_on_groups')
        .insert(athletesToInsert);

      if (insertAthletesError) throw new Error(`Falha (3a) ao adicionar atletas aos grupos: ${insertAthletesError.message}`);
      
      // --- SUCESSO ---
      console.log('✅ [saveGroups] SUCESSO! Grupos salvos.');
      setMessage('Grupos salvos com sucesso!'); // <-- CORRIGIDO
      
      onSave(groups); 

    } catch (err: any) {
      // --- ERRO ---
      console.error("❌ [saveGroups] ERRO CAPTURADO:", err);
      setError(err.message);
    } finally {
      setIsSaving(false);
      console.log('--- 🏁 [saveGroups] Finalizado. ---');
    }
  }
  // Get categories from registered athletes
 const categories = Object.keys(athletesByCategory)
  
  // Get groups for selected category
  const categoryGroups = groups.filter(g => g.category === selectedCategory)
  
  // Get athletes not in any group for selected category
  // Get athletes not in any group for selected category
const categoryAthletes = athletesByCategory[selectedCategory] || []
  const athletesInGroups = categoryGroups.flatMap(g => g.athletes.map(a => a.id))
  const unassignedAthletes = categoryAthletes.filter(a => !athletesInGroups.includes(a.id))

 return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoadingData && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
      
      {/* Empty State */}
      {!isLoadingData && Object.keys(athletesByCategory).length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum atleta inscrito em categorias foi encontrado.
          </AlertDescription>
        </Alert>
      )}
      
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