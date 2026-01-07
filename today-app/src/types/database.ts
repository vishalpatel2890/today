/**
 * Supabase database types for the Today app
 * Matches the schema created in migration: create_tasks_and_categories
 */
import type { TaskNotes } from './index'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string
          text: string
          created_at: string
          deferred_to: string | null
          category: string | null
          completed_at: string | null
          updated_at: string
          notes: TaskNotes | null
        }
        Insert: {
          id?: string
          user_id: string
          text: string
          created_at?: string
          deferred_to?: string | null
          category?: string | null
          completed_at?: string | null
          updated_at?: string
          notes?: TaskNotes | null
        }
        Update: {
          id?: string
          user_id?: string
          text?: string
          created_at?: string
          deferred_to?: string | null
          category?: string | null
          completed_at?: string | null
          updated_at?: string
          notes?: TaskNotes | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type TaskRow = Database['public']['Tables']['tasks']['Row']
export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type CategoryRow = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
