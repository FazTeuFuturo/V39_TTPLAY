import { z } from 'zod'

// Helper function to validate CPF
const isValidCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '')
  if (cleanCPF.length !== 11) return false
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validate CPF algorithm
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false
  
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(cleanCPF.charAt(10))
}

// Helper function to validate CNPJ
const isValidCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  if (cleanCNPJ.length !== 14) return false
  
  // Check for known invalid CNPJs
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false
  
  // Validate CNPJ algorithm
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i]
  }
  let remainder = sum % 11
  const digit1 = remainder < 2 ? 0 : 11 - remainder
  if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false
  
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i]
  }
  remainder = sum % 11
  const digit2 = remainder < 2 ? 0 : 11 - remainder
  return digit2 === parseInt(cleanCNPJ.charAt(13))
}

// Helper function to validate CPF or CNPJ
const validateDocument = (document: string): boolean => {
  const cleanDoc = document.replace(/\D/g, '')
  if (cleanDoc.length === 11) {
    return isValidCPF(document)
  } else if (cleanDoc.length === 14) {
    return isValidCNPJ(document)
  }
  return false
}

export const athleteRegistrationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').refine(isValidCPF, 'CPF inválido'),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  playingLevel: z.string().min(1, 'Nível de jogo é obrigatório'),
  dominantHand: z.string().min(1, 'Mão dominante é obrigatória'),
  playingStyle: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
})

export const clubRegistrationSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  document: z.string().min(11, 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos')
    .refine(validateDocument, 'CPF ou CNPJ inválido'),
  email: z.string().email('Email inválido'),
  corporateEmail: z.string().email('Email corporativo inválido').optional().or(z.literal('')),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  zipCode: z.string().min(8, 'CEP deve ter 8 dígitos'),
  street: z.string().min(1, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado deve ter 2 caracteres').max(2, 'Estado deve ter 2 caracteres'),
  legalRepresentative: z.string().min(2, 'Representante legal é obrigatório'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  description: z.string().optional()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
})