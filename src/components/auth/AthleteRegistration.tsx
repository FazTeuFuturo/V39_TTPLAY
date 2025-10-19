'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, AlertCircle, CheckCircle, User } from 'lucide-react'
import { SupabaseAuth } from '@/lib/supabase-auth'
import { UserType } from '@/lib/types'

interface AthleteRegistrationProps {
  onSuccess: () => void
}

export function AthleteRegistration({ onSuccess }: AthleteRegistrationProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    cpf: '',
    birthDate: '',
    gender: '',
    playingLevel: '',
    dominantHand: '',
    playingStyle: '',
    city: '',
    bio: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Senhas não coincidem')
        setIsLoading(false)
        return
      }

      // Create user with Supabase
      const { user, error } = await SupabaseAuth.createUser({
        email: formData.email,
        password: formData.password,
        userType: UserType.ATHLETE,
        name: formData.name,
        phone: formData.phone,
        cpf: formData.cpf,
        birthDate: formData.birthDate,
        gender: formData.gender,
        playingLevel: formData.playingLevel,
        dominantHand: formData.dominantHand,
        playingStyle: formData.playingStyle,
        city: formData.city,
        bio: formData.bio
      })

      if (error) {
        setError(error)
        setIsLoading(false)
        return
      }

      setSuccess('Cadastro realizado com sucesso!')
      setTimeout(() => {
        onSuccess()
      }, 1500)

    } catch (err: any) {
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 11) {
      const formatted = formatCPF(numbers)
      updateFormData('cpf', formatted)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          Cadastro de Atleta
        </CardTitle>
        <CardDescription className="text-center">
          Preencha seus dados pessoais
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Seu nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                  placeholder="Confirme a senha"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => updateFormData('birthDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                placeholder="Sua cidade"
              />
            </div>
          </div>
<div className="space-y-2">
  <Label htmlFor="gender">Gênero *</Label>
  <Select 
    value={formData.gender} 
    onValueChange={(value) => updateFormData('gender', value)}
    required
  >
    <SelectTrigger>
      <SelectValue placeholder="Selecione seu gênero" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="male">Masculino</SelectItem>
      <SelectItem value="female">Feminino</SelectItem>
    </SelectContent>
  </Select>
</div>
          <div className="space-y-2">
            <Label htmlFor="playingLevel">Nível de Jogo *</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dominantHand">Mão Dominante</Label>
              <Select value={formData.dominantHand} onValueChange={(value) => updateFormData('dominantHand', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direita">Direita</SelectItem>
                  <SelectItem value="esquerda">Esquerda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="playingStyle">Estilo de Jogo</Label>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biografia (Opcional)</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => updateFormData('bio', e.target.value)}
              placeholder="Conte um pouco sobre você..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Criando conta...' : 'Criar Conta de Atleta'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}