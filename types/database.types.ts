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
            accounts: {
                Row: {
                    id: string
                    type: 'agency' | 'solo_business'
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    type?: 'agency' | 'solo_business'
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    type?: 'agency' | 'solo_business'
                    name?: string
                    created_at?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    account_id: string
                    name: string
                    slug: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    account_id: string
                    name: string
                    slug: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    account_id?: string
                    name?: string
                    slug?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            templates: {
                Row: {
                    id: string
                    key: string
                    name: string
                    spec: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    name: string
                    spec?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    name?: string
                    spec?: Json
                    created_at?: string
                }
            }
            funnels: {
                Row: {
                    id: string
                    client_id: string
                    template_id: string
                    name: string
                    slug: string
                    config: Json
                    is_published: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    client_id: string
                    template_id: string
                    name: string
                    slug: string
                    config?: Json
                    is_published?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string
                    template_id?: string
                    name?: string
                    slug?: string
                    config?: Json
                    is_published?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            funnel_sessions: {
                Row: {
                    id: string
                    funnel_id: string
                    session_token: string
                    step_progress: number
                    answers: Json
                    status: 'started' | 'completed'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    funnel_id: string
                    session_token?: string
                    step_progress?: number
                    answers?: Json
                    status?: 'started' | 'completed'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    funnel_id?: string
                    session_token?: string
                    step_progress?: number
                    answers?: Json
                    status?: 'started' | 'completed'
                    created_at?: string
                    updated_at?: string
                }
            }
            leads: {
                Row: {
                    id: string
                    funnel_id: string
                    session_id: string | null
                    contact_data: Json
                    status: string
                    temperature: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    funnel_id: string
                    session_id?: string | null
                    contact_data: Json
                    status?: string
                    temperature?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    funnel_id?: string
                    session_id?: string | null
                    contact_data?: Json
                    status?: string
                    temperature?: string
                    created_at?: string
                }
            }
            notifications: {
                Row: {
                    id: string
                    account_id: string
                    lead_id: string
                    type: string
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    account_id: string
                    lead_id: string
                    type: string
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    account_id?: string
                    lead_id?: string
                    type?: string
                    is_read?: boolean
                    created_at?: string
                }
            }
        }
    }
}
