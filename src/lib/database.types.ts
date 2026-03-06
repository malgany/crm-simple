export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          origin: string | null;
          owner_user_id: string;
          phone: string;
          phone_normalized: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          origin?: string | null;
          owner_user_id?: string;
          phone: string;
          phone_normalized: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          origin?: string | null;
          owner_user_id?: string;
          phone?: string;
          phone_normalized?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deals: {
        Row: {
          contact_id: string;
          created_at: string;
          id: string;
          moved_at: string;
          owner_user_id: string;
          stage_id: string;
        };
        Insert: {
          contact_id: string;
          created_at?: string;
          id?: string;
          moved_at?: string;
          owner_user_id?: string;
          stage_id: string;
        };
        Update: {
          contact_id?: string;
          created_at?: string;
          id?: string;
          moved_at?: string;
          owner_user_id?: string;
          stage_id?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          body: string;
          created_at: string;
          deal_id: string;
          id: string;
          owner_user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          deal_id: string;
          id?: string;
          owner_user_id?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          deal_id?: string;
          id?: string;
          owner_user_id?: string;
        };
        Relationships: [];
      };
      stages: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_user_id: string;
          position: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          owner_user_id?: string;
          position?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          owner_user_id?: string;
          position?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_contact_with_deal: {
        Args: {
          p_email?: string | null;
          p_name: string;
          p_origin?: string | null;
          p_phone: string;
          p_phone_normalized: string;
          p_stage_id: string;
        };
        Returns: {
          contact_id: string;
          deal_id: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

type PublicSchema = Database["public"];

export type TableName = keyof PublicSchema["Tables"];
export type TableRow<T extends TableName> = PublicSchema["Tables"][T]["Row"];
export type TableInsert<T extends TableName> = PublicSchema["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> = PublicSchema["Tables"][T]["Update"];
