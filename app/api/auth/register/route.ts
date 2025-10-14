import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { userRegistrationSchema } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedFields = userRegistrationSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        { message: 'Dados inválidos', errors: validatedFields.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password, city, playingLevel, dominantHand, playingStyle } = validatedFields.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Usuário já existe com este email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        city,
        playingLevel,
        dominantHand,
        playingStyle,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    return NextResponse.json(
      { message: 'Usuário criado com sucesso', user },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}