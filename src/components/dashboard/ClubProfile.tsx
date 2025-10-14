'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Building2, Edit, Save, X, CheckCircle, AlertCircle, Globe, Instagram, Facebook } from 'lucide-react'
import { AuthStorage } from '@/lib/auth-storage'
import type { StoredUser } from '@/lib/auth-storage'

interface ClubProfileProps {
  user: StoredUser
}

export function ClubProfile({ user }: ClubProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
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

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    
    try {
      const updatedUser: StoredUser = {
        ...user,
        ...formData
      }
      
      AuthStorage.updateUser(updatedUser)
      setSuccess('Perfil atualizado com sucesso!')
      setIsEditing(false)
      
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Erro ao atualizar perfil. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
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
    setIsEditing(false)
    setError('')
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
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
              <Avatar className="h-20 w-20">
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription className="text-base">
                  Clube de Tênis de Mesa
                </CardDescription>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">CNPJ: {user.cnpj?.slice(-6)}</Badge>
                  <Badge variant="outline">{user.city}, {user.state}</Badge>
                </div>
              </div>
            </div>
            
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            )}
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