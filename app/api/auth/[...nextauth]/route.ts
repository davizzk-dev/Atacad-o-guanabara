import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { promises as fs } from 'fs'
import path from 'path'

// Debug das variáveis de ambiente
console.log('🔧 Environment variables:')
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing')
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing')
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'http://localhost:3005')
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing')

// Função para verificar se usuário tem endereço
async function checkUserAddress(email: string) {
  try {
    const usersPath = path.join(process.cwd(), 'data', 'users.json')
    const data = await fs.readFile(usersPath, 'utf-8')
    const users = JSON.parse(data)
    
    const user = users.find((u: any) => u.email === email)
    if (user && user.address) {
      // Verificar se tem todos os campos obrigatórios do endereço
      const requiredFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode']
      return requiredFields.every(field => user.address[field] && user.address[field].trim() !== '')
    }
    return false
  } catch (error) {
    console.error('Erro ao verificar endereço do usuário:', error)
    return false
  }
}

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Always show Google account chooser to avoid auto sign-in with last account
      authorization: {
        params: {
          // Force Google to show the account chooser and consent screen
          prompt: 'consent select_account',
          // Keep defaults explicit for clarity
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || "atacadao_guanabara_secret_super_forte_2025_auth_key_123456789",
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },
  basePath: '/api/auth',
  cookies: {
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }: { user?: any, account?: any, profile?: any }) {
      console.log('🔐 SignIn callback:', { user, account, profile })
      
      if (account?.provider === "google") {
        // Verificar se o usuário tem endereço cadastrado
        const hasAddress = await checkUserAddress(user.email)
        
        if (!hasAddress) {
          // Se não tem endereço, redirecionar para registro com dados preenchidos
          console.log('📍 Usuário Google sem endereço, redirecionando para registro')
          return '/register?google=true&name=' + encodeURIComponent(user.name || '') + '&email=' + encodeURIComponent(user.email || '')
        }
        
        return true
      }
      return false
    },
    async session({ session, token }: { session?: any, token?: any }) {
      console.log('📋 Session callback:', { session, token })
      if (session.user) {
        session.user.id = token.sub as string
        session.user.role = token.role as string || 'user'
        session.user.image = token.picture
      }
      return session
    },
    async jwt({ token, user, account }: { token?: any, user?: any, account?: any }) {
      console.log('🎫 JWT callback:', { token, user, account })
      if (account && user) {
        token.role = 'user'
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }
      return token
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST } 