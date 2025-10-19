'use client'

import { useState, useRef, ChangeEvent, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Edit, Save, X, CheckCircle, AlertCircle, Upload, Loader2 } from 'lucide-react'
import { AuthStorage } from '@/lib/auth-storage'
import type { StoredUser } from '@/lib/auth-storage'
import { supabase } from '@/lib/supabase'
import Cropper, { type Area } from 'react-easy-crop'

// Função Helper para criar um objeto de imagem a partir de uma URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

// Função Helper para obter a imagem cortada como um Blob
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Desenha a imagem original no canvas
  canvas.width = image.width
  canvas.height = image.height
  ctx.drawImage(image, 0, 0)

  // Cria um novo canvas para a imagem cortada
  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')
  if (!croppedCtx) return null

  croppedCanvas.width = pixelCrop.width
  croppedCanvas.height = pixelCrop.height
  croppedCtx.drawImage(
    canvas, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  )

  return new Promise((resolve) => {
    croppedCanvas.toBlob((blob) => resolve(blob), 'image/jpeg')
  })
}

interface AthleteProfileProps {
  user: StoredUser | null
}

export function AthleteProfile({ user }: AthleteProfileProps) {
  console.log("DADOS RECEBIDOS PELO ATHLETEPROFILE:", user)
  // Cláusula de Guarda: Mostra um estado de carregamento se o usuário ainda não chegou
  if (!user) {
    return (
      <Card>
        <CardHeader><CardTitle>Carregando Perfil...</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [newAvatarBlob, setNewAvatarBlob] = useState<Blob | null>(null)
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    phone: user.phone || '',
    cpf: user.cpf || '',
    birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : '',
    gender: user.gender || '',
    city: user.city || '',
    playingLevel: user.playingLevel || '',
    dominantHand: user.dominantHand || '',
    playingStyle: user.playingStyle || '',
    bio: user.bio || ''
  })

  const getInitials = (name: string): string => {
    if (!name) return ''
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImageToCrop(reader.result as string)
      reader.readAsDataURL(file)
    }
     // Limpa o valor para que o mesmo arquivo possa ser selecionado novamente
    if(event.target) event.target.value = '';
  }
  
// AthleteProfile.tsx - substitua a função inteira

const handleCropAndUpload = async () => {
  if (!imageToCrop || !croppedAreaPixels) return;

  try {
    const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
    if (!croppedImageBlob) throw new Error('Não foi possível cortar a imagem.');

    // Guarda a imagem cortada localmente em vez de fazer o upload
    setNewAvatarBlob(croppedImageBlob);
    setNewAvatarPreview(URL.createObjectURL(croppedImageBlob));
    
    setImageToCrop(null); // Fecha o modal de crop
  } catch (err: any) {
    setError(err.message || 'Falha ao processar imagem.');
  }
}
  
  // AthleteProfile.tsx - substitua a função inteira

// Em AthleteProfile.tsx

const handleSave = async () => {
  setIsSaving(true);
  setError('');
  setSuccess('');
  
  try {
    let finalAvatarUrl = formData.avatarUrl;

    // ETAPA 1: UPLOAD DA NOVA FOTO (Seu código aqui está correto)
    if (newAvatarBlob) {
      if (formData.avatarUrl) {
        const oldFilePath = formData.avatarUrl.split('/avatars/')[1];
        if (oldFilePath) await supabase.storage.from('avatars').remove([oldFilePath.split('?t=')[0]]);
      }

      const filePath = `public/${user.id}/${Date.now()}.jpeg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, newAvatarBlob, { contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      finalAvatarUrl = `${publicUrl}?t=${new Date().getTime()}`;
    }

    // ETAPA 2: ATUALIZA A TABELA 'users'
    const userData = {
        name: formData.name,
        avatar_url: finalAvatarUrl
    };
    const { error: userError } = await supabase.from('app_5732e5c77b_users').update(userData).eq('id', user.id);
    if (userError) throw userError;

    // ETAPA 3: FAZ "UPSERT" NA TABELA 'athletes' (COM A CORREÇÃO)
    const athleteData = {
        id: user.id, // Obrigatório para o 'upsert'
        phone: formData.phone || null,
        cpf: formData.cpf || null,
        birth_date: formData.birthDate || null,
        gender: formData.gender, // 'gender' é obrigatório, então não precisa de '|| null'
        city: formData.city || null,
        bio: formData.bio || null,

        // --- INÍCIO DA CORREÇÃO ---
        // Converte strings vazias "" para null, para não violar os 'CHECKs' do banco
        playing_level: formData.playingLevel || null,
        dominant_hand: formData.dominantHand || null,
        playing_style: formData.playingStyle || null
        // --- FIM DA CORREÇÃO ---
    };

    // Use .upsert() para criar o registro se ele não existir (caso 'tito')
    // ou atualizá-lo se existir (caso 'velho')
    const { error: athletesError } = await supabase
        .from('app_5732e5c77b_athletes')
        .upsert(athleteData); 

    if (athletesError) throw athletesError;
    
    // ETAPA 4: ATUALIZA O ESTADO LOCAL
    const updatedUserInStorage = { ...user, ...formData, avatarUrl: finalAvatarUrl };
    AuthStorage.updateUser(updatedUserInStorage);
    setNewAvatarBlob(null);
    setNewAvatarPreview(null);
    setFormData(prev => ({...prev, avatarUrl: finalAvatarUrl}));

    setSuccess('Perfil atualizado com sucesso!');
    setIsEditing(false);
    setTimeout(() => setSuccess(''), 3000);
  } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil.');
  } finally {
      setIsSaving(false);
  }
}
  
 // AthleteProfile.tsx - substitua a função inteira

const handleCancel = () => {
    setFormData({ /* ... (mantém o conteúdo que já estava aqui) ... */ });
    setNewAvatarBlob(null);    // Limpa a foto não salva
    setNewAvatarPreview(null); // Limpa a prévia
    setIsEditing(false);
    setError('');
}

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <Dialog open={!!imageToCrop} onOpenChange={(open) => !open && setImageToCrop(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Enquadrar Foto de Perfil</DialogTitle></DialogHeader>
          <div className="relative h-80 w-full bg-gray-200">
            <Cropper image={imageToCrop!} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div className="space-y-2 pt-4">
            <Label>Zoom</Label>
            <Slider min={1} max={3} step={0.1} value={[zoom]} onValueChange={(value) => setZoom(value[0])} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageToCrop(null)}>Cancelar</Button>
            <Button onClick={handleCropAndUpload}>Salvar Foto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {success && <Alert className="border-green-200 bg-green-50"><CheckCircle className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-800">{success}</AlertDescription></Alert>}
      {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 border">
                  <AvatarImage src={newAvatarPreview || formData.avatarUrl} key={formData.avatarUrl} />
                  <AvatarFallback className="text-2xl">{getInitials(formData.name)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => fileInputRef.current?.click()}>
                    {isUploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Upload className="h-6 w-6 text-white" />}
                  </div>
                )}
                <Input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleFileSelect} disabled={isUploading} />
              </div>
              <div>
                <CardTitle className="text-2xl">{formData.name}</CardTitle>
                <CardDescription>Atleta de Tênis de Mesa</CardDescription>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">Rating: {user.currentRating}</Badge>
                  <Badge variant="outline" className="capitalize">{formData.playingLevel || 'Não definido'}</Badge>
                </div>
              </div>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline"><Edit className="h-4 w-4 mr-2" /> Editar Perfil</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving || isUploading}><Save className="h-4 w-4 mr-2" />{isSaving ? 'Salvando...' : 'Salvar'}</Button>
                <Button onClick={handleCancel} variant="outline" disabled={isUploading}><X className="h-4 w-4 mr-2" /> Cancelar</Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-1"><Label>Nome Completo</Label>{isEditing ? <Input value={formData.name} onChange={(e) => updateFormData('name', e.target.value)} /> : <p className="text-muted-foreground pt-2">{formData.name}</p>}</div>
              <div className="space-y-1"><Label>Email</Label><p className="text-muted-foreground pt-2">{formData.email}</p></div>
              <div className="space-y-1"><Label>Telefone</Label>{isEditing ? <Input value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value)} /> : <p className="text-muted-foreground pt-2">{formData.phone || 'Não informado'}</p>}</div>
              <div className="space-y-1"><Label>CPF</Label>{isEditing ? <Input value={formData.cpf} onChange={(e) => updateFormData('cpf', e.target.value)} /> : <p className="text-muted-foreground pt-2">{formData.cpf || 'Não informado'}</p>}</div>
              <div className="space-y-1"><Label>Data de Nascimento</Label>{isEditing ? <Input type="date" value={formData.birthDate} onChange={(e) => updateFormData('birthDate', e.target.value)} /> : <p className="text-muted-foreground pt-2">{formData.birthDate ? new Date(formData.birthDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não informado'}</p>}</div>
              <div className="space-y-1"><Label>Cidade</Label>{isEditing ? <Input value={formData.city} onChange={(e) => updateFormData('city', e.target.value)} /> : <p className="text-muted-foreground pt-2">{formData.city || 'Não informado'}</p>}</div>
              <div className="space-y-1"><Label>Gênero</Label>{isEditing ? <Select value={formData.gender} onValueChange={(v) => updateFormData('gender', v)}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="male">Masculino</SelectItem><SelectItem value="female">Feminino</SelectItem></SelectContent></Select> : <p className="text-muted-foreground pt-2 capitalize">{formData.gender === 'male' ? 'Masculino' : formData.gender === 'female' ? 'Feminino' : 'Não informado'}</p>}</div>
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Informações de Jogo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <div className="space-y-1"><Label>Nível de Jogo</Label>{isEditing ? <Select value={formData.playingLevel} onValueChange={(v) => updateFormData('playingLevel', v)}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="iniciante">Iniciante</SelectItem><SelectItem value="intermediario">Intermediário</SelectItem><SelectItem value="avancado">Avançado</SelectItem><SelectItem value="profissional">Profissional</SelectItem></SelectContent></Select> : <p className="text-muted-foreground pt-2 capitalize">{formData.playingLevel || 'Não informado'}</p>}</div>
              <div className="space-y-1"><Label>Mão Dominante</Label>{isEditing ? <Select value={formData.dominantHand} onValueChange={(v) => updateFormData('dominantHand', v)}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="direita">Direita</SelectItem><SelectItem value="esquerda">Esquerda</SelectItem></SelectContent></Select> : <p className="text-muted-foreground pt-2 capitalize">{formData.dominantHand || 'Não informado'}</p>}</div>
              <div className="space-y-1"><Label>Estilo de Jogo</Label>{isEditing ? <Select value={formData.playingStyle} onValueChange={(v) => updateFormData('playingStyle', v)}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger><SelectContent><SelectItem value="ofensivo">Ofensivo</SelectItem><SelectItem value="defensivo">Defensivo</SelectItem><SelectItem value="misto">Misto</SelectItem></SelectContent></Select> : <p className="text-muted-foreground pt-2 capitalize">{formData.playingStyle || 'Não informado'}</p>}</div>
            </div>
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Biografia</h3>
            {isEditing ? <Textarea value={formData.bio} onChange={(e) => updateFormData('bio', e.target.value)} rows={4} placeholder="Conte um pouco sobre você..." /> : <p className="text-muted-foreground min-h-[60px] pt-2">{formData.bio || 'Nenhuma biografia adicionada.'}</p>}
          </div>
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Estatísticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg"><p className="text-2xl font-bold text-blue-600">{user.currentRating}</p><p className="text-sm text-gray-600">Rating Atual</p></div>
              <div className="text-center p-4 bg-green-50 rounded-lg"><p className="text-2xl font-bold text-green-600">{user.peakRating}</p><p className="text-sm text-gray-600">Pico de Rating</p></div>
              <div className="text-center p-4 bg-purple-50 rounded-lg"><p className="text-2xl font-bold text-purple-600">{user.gamesPlayed}</p><p className="text-sm text-gray-600">Jogos</p></div>
              <div className="text-center p-4 bg-orange-50 rounded-lg"><p className="text-2xl font-bold text-orange-600">{user.gamesPlayed && user.wins ? Math.round((user.wins / user.gamesPlayed) * 100) : 0}%</p><p className="text-sm text-gray-600">Taxa de Vitória</p></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}