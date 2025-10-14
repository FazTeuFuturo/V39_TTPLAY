'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Edit, Save, X, CheckCircle, AlertCircle } from 'lucide-react'
import { AuthStorage } from '@/lib/auth-storage'
import type { StoredUser } from '@/lib/auth-storage'

interface AthleteProfileProps {
  user: StoredUser
}

export function AthleteProfile({ user }: AthleteProfileProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    cpf: user.cpf || '',
    birthDate: user.birthDate || '',
    playingLevel: user.playingLevel || '',
    dominantHand: user.dominantHand || '',
    playingStyle: user.playingStyle || '',
    city: user.city || '',
    bio: user.bio || ''
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
      phone: user.phone || '',
      cpf: user.cpf || '',
      birthDate: user.birthDate || '',
      playingLevel: user.playingLevel || '',
      dominantHand: user.dominantHand || '',
      playingStyle: user.playingStyle || '',
      city: user.city || '',
      bio: user.bio || ''
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
                  Atleta de Tênis de Mesa
                </CardDescription>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">Rating: {user.currentRating}</Badge>
                  <Badge variant="outline" className="capitalize">{user.playingLevel}</Badge>
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
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Informações Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
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
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="phone">Telefone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.phone || 'Não informado'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                {isEditing ? (
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => updateFormData('cpf', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">{user.cpf || 'Não informado'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                {isEditing ? (
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateFormData('birthDate', e.target.value)}
                  />
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md">
                    {user.birthDate ? new Date(user.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}
                  </p>
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
            </div>
          </div>

          <Separator />

          {/* Playing Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Informações de Jogo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="playingLevel">Nível de Jogo</Label>
                {isEditing ? (
                  <Select value={formData.playingLevel} onValueChange={(value) => updateFormData('playingLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md capitalize">{user.playingLevel || 'Não informado'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dominantHand">Mão Dominante</Label>
                {isEditing ? (
                  <Select value={formData.dominantHand} onValueChange={(value) => updateFormData('dominantHand', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direita">Direita</SelectItem>
                      <SelectItem value="esquerda">Esquerda</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md capitalize">{user.dominantHand || 'Não informado'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="playingStyle">Estilo de Jogo</Label>
                {isEditing ? (
                  <Select value={formData.playingStyle} onValueChange={(value) => updateFormData('playingStyle', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ofensivo">Ofensivo</SelectItem>
                      <SelectItem value="defensivo">Defensivo</SelectItem>
                      <SelectItem value="misto">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="py-2 px-3 bg-gray-50 rounded-md capitalize">{user.playingStyle || 'Não informado'}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Bio */}
          <div>
            <h3 className="text-lg font-medium mb-4">Biografia</h3>
            {isEditing ? (
              <Textarea
                value={formData.bio}
                onChange={(e) => updateFormData('bio', e.target.value)}
                placeholder="Conte um pouco sobre você..."
                rows={4}
              />
            ) : (
              <p className="py-3 px-4 bg-gray-50 rounded-md min-h-[100px]">
                {user.bio || 'Nenhuma biografia adicionada ainda.'}
              </p>
            )}
          </div>

          <Separator />

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-medium mb-4">Estatísticas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{user.currentRating}</p>
                <p className="text-sm text-gray-600">Rating Atual</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{user.peakRating}</p>
                <p className="text-sm text-gray-600">Pico de Rating</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{user.gamesPlayed}</p>
                <p className="text-sm text-gray-600">Jogos</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">
                  {user.gamesPlayed ? Math.round((user.wins! / user.gamesPlayed) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600">Taxa de Vitória</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}