import { createClient } from '@supabase/supabase-js'

// Fallbacks para que el build no peta durante prerender si las env vars
// faltan en un preview / proyecto mal configurado. En runtime (navegador)
// Next.js inyecta los valores reales vía NEXT_PUBLIC_*.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nombre_completo: string | null
          telefono: string | null
          username: string | null
          avatar_url: string | null
          onboarding_completo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nombre_completo?: string | null
          telefono?: string | null
          avatar_url?: string | null
          onboarding_completo?: boolean
        }
        Update: {
          nombre_completo?: string | null
          telefono?: string | null
          avatar_url?: string | null
          onboarding_completo?: boolean
        }
      }
      hijos: {
        Row: {
          id: string
          parent_id: string
          nombre: string
          fecha_nacimiento: string
          genero: string
          avatar_url: string | null
          presentacion: string | null
          created_at: string
        }
        Insert: {
          parent_id: string
          nombre: string
          fecha_nacimiento: string
          genero?: string
          avatar_url?: string | null
          presentacion?: string | null
        }
        Update: {
          nombre?: string
          fecha_nacimiento?: string
          genero?: string
          avatar_url?: string | null
          presentacion?: string | null
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
          revision_encias: boolean
          completada: boolean
          created_at: string
        }
        Insert: {
          parent_id: string
          hijo_id?: string | null
          fecha: string
          cepillado_manana?: boolean
          cepillado_noche?: boolean
          revision_encias?: boolean
          completada?: boolean
        }
        Update: {
          cepillado_manana?: boolean
          cepillado_noche?: boolean
          revision_encias?: boolean
          completada?: boolean
        }
      }
      logros: {
        Row: {
          id: string
          parent_id: string
          tipo: string
          nombre: string
          descripcion: string | null
          icono: string
          fecha_ganado: string
        }
        Insert: {
          parent_id: string
          tipo: string
          nombre: string
          descripcion?: string | null
          icono?: string
        }
        Update: {
          nombre?: string
          descripcion?: string | null
          icono?: string
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
          dentista: string | null
          notas: string | null
          created_at: string
        }
        Insert: {
          parent_id: string
          hijo_id?: string | null
          fecha: string
          hora: string
          motivo?: string
          dentista?: string | null
          notas?: string | null
        }
        Update: {
          fecha?: string
          hora?: string
          motivo?: string
          dentista?: string | null
          notas?: string | null
        }
      }
      articulos: {
        Row: {
          id: string
          etapa: string
          categoria: string
          titulo: string
          resumen: string | null
          contenido: string | null
          imagen_url: string | null
          video_url: string | null
          destacado: boolean
          orden: number
          created_at: string
        }
        Insert: {
          etapa: string
          categoria: string
          titulo: string
          resumen?: string | null
          contenido?: string | null
          imagen_url?: string | null
          video_url?: string | null
          destacado?: boolean
          orden?: number
        }
        Update: {
          etapa?: string
          categoria?: string
          titulo?: string
          resumen?: string | null
          contenido?: string | null
          imagen_url?: string | null
          video_url?: string | null
          destacado?: boolean
          orden?: number
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          content: string
          image_url: string | null
          likes_count: number
          comments_count: number
          created_at: string
        }
        Insert: {
          author_id: string
          content: string
          image_url?: string | null
        }
        Update: {
          content?: string
          image_url?: string | null
        }
      }
      post_likes: {
        Row: {
          post_id: string
          user_id: string
        }
        Insert: {
          post_id: string
          user_id: string
        }
        Update: never
      }
      comentarios: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          created_at: string
        }
        Insert: {
          post_id: string
          author_id: string
          content: string
        }
        Update: {
          content?: string
        }
      }
      consentimientos: {
        Row: {
          id: string
          user_id: string
          acepta_datos: boolean
          acepta_notificaciones: boolean
          acepta_comunicaciones: boolean
          acepta_terminos: boolean
          fecha_aceptacion: string
        }
        Insert: {
          user_id: string
          acepta_datos?: boolean
          acepta_notificaciones?: boolean
          acepta_comunicaciones?: boolean
          acepta_terminos?: boolean
        }
        Update: {
          acepta_datos?: boolean
          acepta_notificaciones?: boolean
          acepta_comunicaciones?: boolean
          acepta_terminos?: boolean
        }
      }
    }
  }
}
