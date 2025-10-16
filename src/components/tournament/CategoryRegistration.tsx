// components/tournament/CategoryRegistration.tsx

'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  X, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react'
import { SupabaseTournament, Category } from '@/lib/supabase-tournaments'
import type { StoredUser } from '@/lib/auth-storage'
import { supabase } from '@/lib/supabase' // Importe o Supabase client

interface CategoryRegistrationProps {
  tournament: SupabaseTournament;
  athleteUser: StoredUser;
  onClose: () => void;
}

export function CategoryRegistration({ tournament, athleteUser, onClose }: CategoryRegistrationProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Lógica para determinar quais categorias são elegíveis para o atleta
  const eligibleCategories = useMemo(() => {
    if (!tournament.categories || !athleteUser) {
      return []
    }
    const athleteAge = athleteUser.birthDate ? 
      new Date().getFullYear() - new Date(athleteUser.birthDate).getFullYear() : 30;

    return tournament.categories.filter(category => {
      // Validação de Gênero
      if (category.gender && category.gender !== 'mixed' && category.gender !== athleteUser.gender) {
        return false
      }
      // Validação de Idade
      if (category.age_min && athleteAge < category.age_min) return false
      if (category.age_max && athleteAge > category.age_max) return false
      
      // Validação de Rating
      if (category.rating_min && athleteUser.currentRating! < category.rating_min) return false
      if (category.rating_max && athleteUser.currentRating! > category.rating_max) return false

      return true
    })
  }, [tournament.categories, athleteUser])

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId) 
        : [...prev, categoryId]
    )
  }

// Em src/components/tournament/CategoryRegistration.tsx

  const handleFinalizeRegistration = async () => {
    if (selectedCategories.length === 0) {
      setError('Você precisa selecionar pelo menos uma categoria.');
      return
    }
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // 1. Tenta encontrar um registro existente para o atleta neste torneio.
      let { data: registration, error: registrationError } = await supabase
        .from('app_5732e5c77b_tournament_registrations')
        .select('id')
        .eq('tournament_id', tournament.id)
        .eq('athlete_id', athleteUser.id)
        .single();

      // 2. Lógica Corrigida: Se o registro não foi encontrado, CRIA um novo.
      // O erro 'PGRST116' significa "zero linhas retornadas", que é o que esperamos quando o atleta ainda não se inscreveu.
      if (registrationError && registrationError.code === 'PGRST116') {
        const { data: newRegistration, error: createError } = await supabase
          .from('app_5732e5c77b_tournament_registrations')
          .insert({ 
              tournament_id: tournament.id, 
              athlete_id: athleteUser.id, 
              status: 'registered' // Usando o status válido
          })
          .select('id')
          .single();
        
        // Se houver um erro na criação, lança o erro.
        if (createError) throw createError;
        
        // Se a criação for bem-sucedida, usamos o novo registro.
        registration = newRegistration;
      } else if (registrationError) {
        // Se for qualquer outro erro na busca, lança o erro.
        throw registrationError;
      }
      
      // 3. Validação final: se chegamos aqui sem um registro, algo deu muito errado.
      if (!registration) {
        throw new Error("Falha crítica ao obter o ID de registro.");
      }

      // 4. Prepara e insere os dados das categorias selecionadas.
      const registrationCategories = selectedCategories.map(catId => {
        // A lógica para encontrar categoryDetails pode precisar de ajuste se a prop 'tournament.categories' não tiver o 'id' correto
        const categoryDetails = tournament.categories?.find(c => c.id === catId);
        return {
          registration_id: registration!.id,
          category_id: catId,
          price_paid: categoryDetails?.price || 0 
        }
      });
      
      const { error: catError } = await supabase
        .from('app_5732e5c77b_registration_categories')
        .insert(registrationCategories);

      if (catError) throw catError;

      setSuccess('Inscrição realizada com sucesso! Aguardando confirmação.');
      
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao finalizar a inscrição. Verifique se você já não está inscrito em alguma dessas categorias.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const athleteAge = athleteUser.birthDate ? 
    new Date().getFullYear() - new Date(athleteUser.birthDate).getFullYear() : 'N/A';

  return (
    <div className="flex flex-col space-y-4">
      {/* Cabeçalho do Modal */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Inscrição no Torneio</h2>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      {/* Detalhes do Torneio */}
      <Card className="bg-gray-50">
        <CardContent className="p-4 space-y-2">
          <h3 className="font-bold">{tournament.name}</h3>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><MapPin size={14}/> {tournament.location}</span>
            <span className="flex items-center gap-2"><Calendar size={14}/> {new Date(tournament.start_date).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
             <span className="flex items-center gap-2"><Clock size={14}/> Prazo: {new Date(tournament.registration_deadline).toLocaleDateString()}</span>
             <span className="flex items-center gap-2"><Users size={14}/> {tournament.max_participants} vagas</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Atleta Selecionado */}
      <div>
        <h3 className="font-semibold mb-2">Atleta Selecionado</h3>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="font-bold bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center text-sm">
                {athleteUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{athleteUser.name}</p>
                <div className="text-xs text-muted-foreground flex items-center gap-3">
                  <span>{athleteAge} anos</span>
                  <span>Rating: {athleteUser.currentRating}</span>
                  <span>{athleteUser.city}</span>
                </div>
              </div>
            </div>
            <Badge variant="outline">{athleteUser.playingLevel}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Selecionar Categorias */}
      <div>
        <h3 className="font-semibold mb-2">Selecionar Categorias</h3>
        <p className="text-sm text-muted-foreground mb-3">Escolha as categorias em que o atleta irá competir. O preço é calculado por categoria.</p>
        
        {eligibleCategories.length === 0 ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Este atleta não é elegível para nenhuma categoria deste torneio. Verifique idade, gênero e rating.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2 border rounded-md p-4">
            {eligibleCategories.map(category => (
              <div key={category.id} className="flex items-center space-x-3">
                <Checkbox 
                  id={category.id}
                  onCheckedChange={() => handleCategoryToggle(category.id)}
                  checked={selectedCategories.includes(category.id)}
                />
                <Label htmlFor={category.id} className="flex-1 cursor-pointer">{category.name}</Label>
                <Badge variant="secondary">R$ {category.price.toFixed(2)}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Mensagens e Botão Finalizar */}
      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert className="bg-green-50 border-green-200 text-green-800"><CheckCircle className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}

      <Button 
        size="lg" 
        className="w-full"
        onClick={handleFinalizeRegistration}
        disabled={isLoading || selectedCategories.length === 0 || !!success}
      >
        {isLoading ? 'Inscrevendo...' : `Finalizar Inscrição (${selectedCategories.length})`}
      </Button>
    </div>
  )
}