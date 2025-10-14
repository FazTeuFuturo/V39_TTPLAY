'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Eye, EyeOff, AlertCircle, CheckCircle, User, Building2 } from 'lucide-react'
import { AthleteRegistration } from './AthleteRegistration'
import { ClubRegistration } from './ClubRegistration'
import { SupabaseAuth } from '@/lib/supabase-auth'
import { UserType } from '@/lib/types'

interface AuthFormsProps {
  onAuthSuccess: (user: any) => void
}

export function AuthForms({ onAuthSuccess }: AuthFormsProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const { user, error } = await SupabaseAuth.loginUser(loginData.email, loginData.password)

      if (error) {
        setError(error)
        setIsLoading(false)
        return
      }

      if (user) {
        setSuccess('Login realizado com sucesso!')
        setTimeout(() => {
          onAuthSuccess(user)
        }, 1000)
      }
    } catch (err: any) {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistrationSuccess = () => {
    setSuccess('Cadastro realizado com sucesso! Faça login para continuar.')
    setIsLogin(true)
  }

  const updateLoginData = (field: string, value: string) => {
    setLoginData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  if (!isLogin) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Criar Conta</h1>
          <p className="text-gray-600">Escolha o tipo de conta</p>
        </div>

        <Tabs defaultValue="athlete" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="athlete" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Atleta
            </TabsTrigger>
            <TabsTrigger value="club" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Clube
            </TabsTrigger>
          </TabsList>

          <TabsContent value="athlete">
            <AthleteRegistration onSuccess={handleRegistrationSuccess} />
          </TabsContent>

          <TabsContent value="club">
            <ClubRegistration onSuccess={handleRegistrationSuccess} />
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <Button variant="link" onClick={() => setIsLogin(true)}>
            Já tem uma conta? Faça login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
        <CardDescription className="text-center">
          Entre com suas credenciais
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={loginData.email}
              onChange={(e) => updateLoginData('email', e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={loginData.password}
                onChange={(e) => updateLoginData('password', e.target.value)}
                placeholder="Sua senha"
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <div className="text-center mt-6">
          <Button variant="link" onClick={() => setIsLogin(false)}>
            Não tem uma conta? Cadastre-se
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}