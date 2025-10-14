'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, AlertCircle, CheckCircle, Building2 } from 'lucide-react'
import { SupabaseAuth } from '@/lib/supabase-auth'
import { UserType } from '@/lib/types'

interface ClubRegistrationProps {
  onSuccess: () => void
}

export function ClubRegistration({ onSuccess }: ClubRegistrationProps) {
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
    cnpj: '',
    corporateEmail: '',
    zipCode: '',
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    legalRepresentative: '',
    website: '',
    instagram: '',
    facebook: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('🏢 1. Iniciando cadastro de clube...')
      
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Senhas não coincidem')
        setIsLoading(false)
        return
      }

      console.log('🏢 2. Validações passaram, criando usuário...')

      // Create user with Supabase
      const { user, error } = await SupabaseAuth.createUser({
        email: formData.email,
        password: formData.password,
        userType: UserType.CLUB,
        name: formData.name,
        cnpj: formData.cnpj,
        corporateEmail: formData.corporateEmail,
        zipCode: formData.zipCode,
        street: formData.street,
        number: formData.number,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        legalRepresentative: formData.legalRepresentative,
        website: formData.website,
        instagram: formData.instagram,
        facebook: formData.facebook,
        description: formData.description
      })

      console.log('🏢 3. Resultado createUser:', { user, error })

      if (error) {
        console.error('🏢 4. Erro no createUser:', error)
        setError(error)
        setIsLoading(false)
        return
      }

      if (user) {
        console.log('🏢 5. Usuário criado com sucesso:', user)
        setSuccess('Cadastro realizado com sucesso!')
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        console.error('🏢 6. Usuário não retornado')
        setError('Erro ao criar conta. Tente novamente.')
      }

    } catch (err: any) {
      console.error('🏢 7. Erro geral:', err)
      setError('Erro ao criar conta. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 14) {
      const formatted = formatCNPJ(numbers)
      updateFormData('cnpj', formatted)
    }
  }

  const formatZipCode = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 8) {
      const formatted = formatZipCode(numbers)
      updateFormData('zipCode', formatted)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          Cadastro de Clube
        </CardTitle>
        <CardDescription className="text-center">
          Preencha os dados do seu clube
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
            <Label htmlFor="name">Nome do Clube *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Nome completo do clube"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Principal *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
              placeholder="contato@clube.com"
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
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={handleCNPJChange}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="corporateEmail">Email Corporativo</Label>
              <Input
                id="corporateEmail"
                type="email"
                value={formData.corporateEmail}
                onChange={(e) => updateFormData('corporateEmail', e.target.value)}
                placeholder="admin@clube.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="legalRepresentative">Representante Legal *</Label>
            <Input
              id="legalRepresentative"
              value={formData.legalRepresentative}
              onChange={(e) => updateFormData('legalRepresentative', e.target.value)}
              placeholder="Nome do responsável legal"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={handleZipCodeChange}
                placeholder="00000-000"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="street">Rua</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => updateFormData('street', e.target.value)}
                placeholder="Nome da rua"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => updateFormData('number', e.target.value)}
                placeholder="123"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => updateFormData('neighborhood', e.target.value)}
                placeholder="Nome do bairro"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData('city', e.target.value)}
                placeholder="Sua cidade"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => updateFormData('state', e.target.value)}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => updateFormData('website', e.target.value)}
                placeholder="https://clube.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.instagram}
                onChange={(e) => updateFormData('instagram', e.target.value)}
                placeholder="@clube"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Clube (Opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Conte sobre o clube, história, modalidades..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Criando conta...' : 'Criar Conta de Clube'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}