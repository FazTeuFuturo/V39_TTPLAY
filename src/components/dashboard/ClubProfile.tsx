'use client'

import { useState, useRef, ChangeEvent, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Edit, Save, X, CheckCircle, AlertCircle, Upload, Loader2, Globe, Instagram, Facebook } from 'lucide-react'
import { AuthStorage } from '@/lib/auth-storage'
import type { StoredUser } from '@/lib/auth-storage'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Slider } from "@/components/ui/slider"
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

interface ClubProfileProps {
  user: StoredUser
  }

export function ClubProfile({ user }: ClubProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
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
    corporateEmail: user.corporateEmail || '',
    cnpj: user.cnpj || '',
    zipCode: user.zipCode || '',
    street: user.street || '',
    number: user.number || '',
    neighborhood: user.neighborhood || '',
    city: user.city || '',
    state: user.state || '',
    legalRepresentative: user.legalRepresentative || '',
    website: user.website || '',
    instagram: user.instagram || '',
    facebook: user.facebook || '',
    description: user.description || ''
  })

  const getInitials = (name: string) => {
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

const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
  
    try {
      let finalAvatarUrl = formData.avatarUrl;

      // ETAPA 1: UPLOAD DA NOVA FOTO (Se houver uma)
      if (newAvatarBlob) {
        setIsUploading(true);
        // 1.1 Remove a foto antiga, se existir
        if (formData.avatarUrl) {
          const oldFilePath = formData.avatarUrl.split('/avatars/')[1];
          if (oldFilePath) {
            await supabase.storage.from('avatars').remove([oldFilePath.split('?t=')[0]]);
          }
        }

        // 1.2 Faz o upload da nova foto
        const filePath = `public/${user.id}/${Date.now()}.jpeg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, newAvatarBlob, { contentType: 'image/jpeg' });
        
        if (uploadError) throw uploadError;

        // 1.3 Obtém a URL pública da nova foto
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        finalAvatarUrl = `${publicUrl}?t=${new Date().getTime()}`; // Adiciona timestamp para evitar cache
        setIsUploading(false);
      }

      // ETAPA 2: ATUALIZA A TABELA 'users' (agora com a avatar_url)
      const userData = {
        name: formData.name,
        email: formData.email,
        avatar_url: finalAvatarUrl // <-- CAMPO DA FOTO ADICIONADO
      };
      const { error: userError } = await supabase
        .from('app_5732e5c77b_users')
        .update(userData)
        .eq('id', user.id);
      if (userError) throw userError;
  
      // ETAPA 3: FAZ "UPSERT" NA TABELA 'clubs'
      const clubData = {
        id: user.id, 
        cnpj: formData.cnpj || null,
        corporate_email: formData.corporateEmail || null,
        zip_code: formData.zipCode || null,
        street: formData.street || null,
        number: formData.number || null,
        neighborhood: formData.neighborhood || null,
        city: formData.city || null,
        state: formData.state || null,
        legal_representative: formData.legalRepresentative || null,
        website: formData.website || null,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        description: formData.description || null,
      };
  
      const { error: clubError } = await supabase
        .from('app_5732e5c77b_clubs')
        .upsert(clubData);
      if (clubError) throw clubError;
      
      // ETAPA 4: ATUALIZA O ESTADO LOCAL (AuthStorage)
      const updatedUserInStorage = { ...user, ...formData, avatarUrl: finalAvatarUrl };
      AuthStorage.updateUser(updatedUserInStorage);

        // Limpa os estados da nova foto
      setNewAvatarBlob(null);
      setNewAvatarPreview(null);
      setFormData(prev => ({...prev, avatarUrl: finalAvatarUrl})); // Atualiza o formData local com a nova URL

      setSuccess('Perfil atualizado com sucesso!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
  
    } catch (err: any) {
      console.error('🔴 Erro ao salvar perfil do clube:', err);
      setError(err.message || 'Erro ao atualizar perfil.');
      setIsUploading(false); // Garante que o loading pare em caso de erro
    } finally {
      setIsSaving(false);
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      corporateEmail: user.corporateEmail || '',
      cnpj: user.cnpj || '',
      zipCode: user.zipCode || '',
      street: user.street || '',
      number: user.number || '',
      neighborhood: user.neighborhood || '',
      city: user.city || '',
      state: user.state || '',
      legalRepresentative: user.legalRepresentative || '',
      website: user.website || '',
      instagram: user.instagram || '',
      facebook: user.facebook || '',
      description: user.description || ''
    })
    setNewAvatarBlob(null);
    setNewAvatarPreview(null);
    setIsEditing(false)
    setError('')
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
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 border">
                  <AvatarImage src={newAvatarPreview || formData.avatarUrl} key={formData.avatarUrl} />
                  <AvatarFallback className="text-2xl bg-blue-600 text-white">
                    {getInitials(formData.name)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Upload className="h-6 w-6 text-white" />}
                  </div>
                )}
                <Input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/png, image/jpeg" 
                  onChange={handleFileSelect} 
                  disabled={isUploading} 
                />
              </div>
              <div>
                <CardTitle className="text-2xl">{formData.name}</CardTitle>
            
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving || isUploading}>
                  {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  {isSaving ? 'Salvando...' : (isUploading ? 'Enviando...' : 'Salvar')}
                </Button>
                <Button onClick={handleCancel} variant="outline" disabled={isUploading}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
              )}
          </div>
        </div>
      </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Company Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Informações da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Clube</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                {isEditing ? (
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => updateFormData('cnpj', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.cnpj || 'Não informado'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Principal</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="corporateEmail">Email Corporativo</Label>
                {isEditing ? (
                  <Input
                    id="corporateEmail"
                    type="email"
                    value={formData.corporateEmail}
                    onChange={(e) => updateFormData('corporateEmail', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.corporateEmail || 'Não informado'}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="legalRepresentative">Representante Legal</Label>
                {isEditing ? (
                  <Input
                    id="legalRepresentative"
                    value={formData.legalRepresentative}
                    onChange={(e) => updateFormData('legalRepresentative', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.legalRepresentative || 'Não informado'}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                {isEditing ? (
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => updateFormData('zipCode', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.zipCode || 'Não informado'}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">Rua</Label>
                {isEditing ? (
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => updateFormData('street', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.street || 'Não informado'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                {isEditing ? (
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => updateFormData('number', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.number || 'Não informado'}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                {isEditing ? (
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => updateFormData('neighborhood', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.neighborhood || 'Não informado'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                {isEditing ? (
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.city || 'Não informado'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                {isEditing ? (
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateFormData('state', e.target.value)}
                    maxLength={2}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.state || 'Não informado'}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-medium mb-4">Redes Sociais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                {isEditing ? (
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    placeholder="https://www.seusite.com"
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">
                    {user.website ? (
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {user.website}
                      </a>
                    ) : (
                      'Não informado'
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                {isEditing ? (
                  <Input
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => updateFormData('instagram', e.target.value)}
                    placeholder="@seuclube"
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.instagram || 'Não informado'}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                {isEditing ? (
                  <Input
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => updateFormData('facebook', e.target.value)}
                    placeholder="facebook.com/seuclube"
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.facebook || 'Não informado'}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium mb-4">Descrição do Clube</h3>
            {isEditing ? (
              <Textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Descreva seu clube, missão, valores..."
                rows={4}
              />
            ) : (
              <p className="py-3 px-4 bg-gray-50 rounded-md min-h-[100px]">
                {user.description || 'Nenhuma descrição adicionada ainda.'}
              </p>
            )}
          </div>

          <Separator />

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-medium mb-4">Estatísticas do Clube</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{user.athletesCount || 0}</p>
                <p className="text-sm text-gray-600">Atletas</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{user.tournamentsCreated || 0}</p>
                <p className="text-sm text-gray-600">Torneios Criados</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{user.activeTournaments || 0}</p>
                <p className="text-sm text-gray-600">Torneios Ativos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}