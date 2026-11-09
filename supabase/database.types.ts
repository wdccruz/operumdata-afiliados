export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assignments: {
        Row: {
          archived_at: string | null
          assigned_at: string
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          list_id: string
          partner_id: string
          release_reason: string | null
          released_at: string | null
          reserved_until: string | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          assigned_at?: string
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          list_id: string
          partner_id: string
          release_reason?: string | null
          released_at?: string | null
          reserved_until?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          assigned_at?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          list_id?: string
          partner_id?: string
          release_reason?: string | null
          released_at?: string | null
          reserved_until?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lead_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      attributions: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          deal_id: string
          id: string
          mode: string
          partner_id: string
          reason: string
          updated_at: string
          updated_by: string | null
          validated_at: string
          validated_by: string
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          deal_id: string
          id?: string
          mode: string
          partner_id: string
          reason: string
          updated_at?: string
          updated_by?: string | null
          validated_at?: string
          validated_by: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          deal_id?: string
          id?: string
          mode?: string
          partner_id?: string
          reason?: string
          updated_at?: string
          updated_by?: string | null
          validated_at?: string
          validated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attributions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attributions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attributions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attributions_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          id: string
          occurred_at: string
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: string
          occurred_at?: string
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          id?: string
          occurred_at?: string
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      commercial_settings: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          id: string
          key: string
          reason: string | null
          status: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          reason?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          reason?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      commission_items: {
        Row: {
          amount_cents: number
          archived_at: string | null
          attribution_id: string
          cancel_reason: string | null
          created_at: string
          created_by: string | null
          id: string
          partner_id: string
          released_at: string | null
          seq: number
          status: string
          trigger: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount_cents: number
          archived_at?: string | null
          attribution_id: string
          cancel_reason?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          partner_id: string
          released_at?: string | null
          seq: number
          status: string
          trigger: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount_cents?: number
          archived_at?: string | null
          attribution_id?: string
          cancel_reason?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          partner_id?: string
          released_at?: string | null
          seq?: number
          status?: string
          trigger?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commission_items_attribution_id_fkey"
            columns: ["attribution_id"]
            isOneToOne: false
            referencedRelation: "attributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_items_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          archived_at: string | null
          city: string
          cnpj: string | null
          created_at: string
          created_by: string | null
          domain: string | null
          external_ref: Json
          id: string
          legal_name: string
          phone: string | null
          sector: string
          status: string
          trade_name: string | null
          uf: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          city: string
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          domain?: string | null
          external_ref?: Json
          id?: string
          legal_name: string
          phone?: string | null
          sector: string
          status?: string
          trade_name?: string | null
          uf: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          city?: string
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          domain?: string | null
          external_ref?: Json
          id?: string
          legal_name?: string
          phone?: string | null
          sector?: string
          status?: string
          trade_name?: string | null
          uf?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      company_contacts: {
        Row: {
          archived_at: string | null
          authorized_at: string
          authorized_by: string
          company_id: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          position: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          authorized_at?: string
          authorized_by: string
          company_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          authorized_at?: string
          authorized_by?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          position?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_contacts_authorized_by_fkey"
            columns: ["authorized_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_internal: {
        Row: {
          archived_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_internal_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_logs: {
        Row: {
          archived_at: string | null
          assignment_id: string
          created_at: string
          created_by: string | null
          id: string
          next_action: string | null
          next_action_at: string | null
          notes: string | null
          result: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          assignment_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          next_action?: string | null
          next_action_at?: string | null
          notes?: string | null
          result: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          assignment_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          next_action?: string | null
          next_action_at?: string | null
          notes?: string | null
          result?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_logs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          archived_at: string | null
          assignment_id: string | null
          company_id: string
          confirmed_by: string
          created_at: string
          created_by: string | null
          document_reference: string
          external_ref: Json
          id: string
          recording_confirmed: boolean
          recording_started_on: string | null
          referral_id: string | null
          signature_confirmed: boolean
          signed_on: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          assignment_id?: string | null
          company_id: string
          confirmed_by: string
          created_at?: string
          created_by?: string | null
          document_reference: string
          external_ref?: Json
          id?: string
          recording_confirmed?: boolean
          recording_started_on?: string | null
          referral_id?: string | null
          signature_confirmed: boolean
          signed_on: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          assignment_id?: string | null
          company_id?: string
          confirmed_by?: string
          created_at?: string
          created_by?: string | null
          document_reference?: string
          external_ref?: Json
          id?: string
          recording_confirmed?: boolean
          recording_started_on?: string | null
          referral_id?: string | null
          signature_confirmed?: boolean
          signed_on?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actor_id: string | null
          entity: string
          entity_id: string
          id: string
          occurred_at: string
          payload: Json
          type: string
        }
        Insert: {
          actor_id?: string | null
          entity: string
          entity_id: string
          id?: string
          occurred_at?: string
          payload?: Json
          type: string
        }
        Update: {
          actor_id?: string | null
          entity?: string
          entity_id?: string
          id?: string
          occurred_at?: string
          payload?: Json
          type?: string
        }
        Relationships: []
      }
      external_refs: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          entity: string
          entity_id: string
          external_id: string
          id: string
          system: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          entity: string
          entity_id: string
          external_id: string
          id?: string
          system: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          entity?: string
          entity_id?: string
          external_id?: string
          id?: string
          system?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      lead_lists: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          name: string
          notes: string | null
          offered_at: string
          offered_by: string
          partner_id: string
          responded_at: string | null
          status: string
          summary: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          name: string
          notes?: string | null
          offered_at?: string
          offered_by: string
          partner_id: string
          responded_at?: string | null
          status?: string
          summary?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          offered_at?: string
          offered_by?: string
          partner_id?: string
          responded_at?: string | null
          status?: string
          summary?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_lists_offered_by_fkey"
            columns: ["offered_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_lists_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          archived_at: string | null
          assignment_id: string | null
          company_id: string
          contact_id: string | null
          created_at: string
          created_by: string | null
          format: string
          id: string
          notes: string | null
          owner_internal: string | null
          partner_id: string
          referral_id: string | null
          starts_at: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          assignment_id?: string | null
          company_id: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          format: string
          id?: string
          notes?: string | null
          owner_internal?: string | null
          partner_id: string
          referral_id?: string | null
          starts_at: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          assignment_id?: string | null
          company_id?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          format?: string
          id?: string
          notes?: string | null
          owner_internal?: string | null
          partner_id?: string
          referral_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_owner_internal_fkey"
            columns: ["owner_internal"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          accepted_at: string
          archived_at: string | null
          city: string
          conditions_version: string
          created_at: string
          created_by: string | null
          decided_at: string | null
          decided_by: string | null
          decision_reason: string | null
          details: Json
          email: string
          id: string
          invitation_status: string
          invited_user_id: string | null
          kind: string
          name: string
          origin: Json
          privacy_version: string
          status: string
          uf: string
          updated_at: string
          updated_by: string | null
          whatsapp: string
        }
        Insert: {
          accepted_at?: string
          archived_at?: string | null
          city: string
          conditions_version: string
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          details: Json
          email: string
          id?: string
          invitation_status?: string
          invited_user_id?: string | null
          kind: string
          name: string
          origin?: Json
          privacy_version: string
          status?: string
          uf: string
          updated_at?: string
          updated_by?: string | null
          whatsapp: string
        }
        Update: {
          accepted_at?: string
          archived_at?: string | null
          city?: string
          conditions_version?: string
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision_reason?: string | null
          details?: Json
          email?: string
          id?: string
          invitation_status?: string
          invited_user_id?: string | null
          kind?: string
          name?: string
          origin?: Json
          privacy_version?: string
          status?: string
          uf?: string
          updated_at?: string
          updated_by?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_applications_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payout_details: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          details: Json
          id: string
          partner_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          details: Json
          id?: string
          partner_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          details?: Json
          id?: string
          partner_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_payout_details_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: true
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          application_id: string
          archived_at: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: string
          status: string
          status_reason: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind: string
          status?: string
          status_reason?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: string
          status?: string
          status_reason?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "partner_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_items: {
        Row: {
          archived_at: string | null
          commission_item_id: string
          created_at: string
          created_by: string | null
          id: string
          payment_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          commission_item_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          payment_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          commission_item_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          payment_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_items_commission_item_id_fkey"
            columns: ["commission_item_id"]
            isOneToOne: true
            referencedRelation: "commission_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          id: string
          idempotency_key: string
          method: string
          paid_on: string
          partner_id: string
          reference: string
          registered_by: string
          total_cents: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idempotency_key: string
          method: string
          paid_on: string
          partner_id: string
          reference: string
          registered_by: string
          total_cents: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          idempotency_key?: string
          method?: string
          paid_on?: string
          partner_id?: string
          reference?: string
          registered_by?: string
          total_cents?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_registered_by_fkey"
            columns: ["registered_by"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          archived_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          decision_reason: string | null
          duplicate_status: string
          id: string
          intended_mode: string
          internal_owner: string | null
          partner_id: string
          proposed_company: Json
          proposed_contact: Json
          status: string
          updated_at: string
          updated_by: string | null
          validated_mode: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          decision_reason?: string | null
          duplicate_status: string
          id?: string
          intended_mode: string
          internal_owner?: string | null
          partner_id: string
          proposed_company: Json
          proposed_contact: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
          validated_mode?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          decision_reason?: string | null
          duplicate_status?: string
          id?: string
          intended_mode?: string
          internal_owner?: string | null
          partner_id?: string
          proposed_company?: Json
          proposed_contact?: Json
          status?: string
          updated_at?: string
          updated_by?: string | null
          validated_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "company_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_internal_owner_fkey"
            columns: ["internal_owner"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profile: {
        Row: {
          active: boolean
          archived_at: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          role: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id: string
          name: string
          role: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          role?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bind_invitation: {
        Args: { actor_id: string; application_id: string; user_id: string }
        Returns: string
      }
      commercial_command: { Args: { action: string; p: Json }; Returns: Json }
      commercial_overview: { Args: never; Returns: Json }
      receive_application: {
        Args: { payload: Json; rate_key: string }
        Returns: Json
      }
      reconcile_invitation: {
        Args: { actor_id: string; application_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
