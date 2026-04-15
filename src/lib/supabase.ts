import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          avatar_emoji: string | null
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          avatar_emoji?: string | null
        }
        Update: {
          name?: string | null
          avatar_emoji?: string | null
        }
      }
      hijos: {
        Row: {
          id: string
          parent_id: string
          nombre: string
          fecha_nacimiento: string
          genero: string
          created_at: string
        }
        Insert: {
          parent_id: string
          nombre: string
          fecha_nacimiento: string
          genero: string
        }
        Update: {
          nombre?: string
          fecha_nacimiento?: string
          genero?: string
        }
      }
      citas: {
        Row: {
          id: string
          parent_id: string
          hijo_id: string | null
          fecha: string
          hora: string
          motivo: string
          created_at: string
        }
        Insert: {
          parent_id: string
          hijo_id?: string | null
          fecha: string
          hora: string
          motivo: string
        }
        Update: {
          fecha?: string
          hora?: string
          motivo?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          content: string
          image_url: string | null
          likes_count: number
          created_at: string
        }
        Insert: {
          author_id: string
          content: string
          image_url?: string | null
        }
        Update: {
          content?: string
        }
      }
      rutinas: {
        Row: {
          id: string
          parent_id: string
          hijo_id: string | null
          fecha: string
          cepillado_manana: boolean
          cepillado_noche: boolean
          sin_dulces: boolean
          revision_encias: boolean
          created_at: string
        }
        Insert: {
          parent_id: string
          hijo_id?: string | null
          fecha: string
          cepillado_manana?: boolean
          cepillado_noche?: boolean
          sin_dulces?: boolean
          revision_encias?: boolean
        }
        Update: {
          cepillado_manana?: boolean
          cepillado_noche?: boolean
          sin_dulces?: boolean
          revision_encias?: boolean
        }
      }
    }
  }
}
