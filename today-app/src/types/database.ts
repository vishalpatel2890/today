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
          sort_order: number | null
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
          sort_order?: number | null
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
          sort_order?: number | null
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
      time_entries: {
        Row: {
          id: string
          user_id: string
          task_id: string | null
          task_name: string
          start_time: string
          end_time: string
          duration: number
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          task_id?: string | null
          task_name: string
          start_time: string
          end_time: string
          duration: number
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string | null
          task_name?: string
          start_time?: string
          end_time?: string
          duration?: number
          date?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'time_entries_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'time_entries_task_id_fkey'
            columns: ['task_id']
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          }
        ]
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
export type TimeEntryRow = Database['public']['Tables']['time_entries']['Row']
export type TimeEntryInsert = Database['public']['Tables']['time_entries']['Insert']
export type TimeEntryUpdate = Database['public']['Tables']['time_entries']['Update']
