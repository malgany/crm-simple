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
      companies: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          status: Database["public"]["Enums"]["company_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          status?: Database["public"]["Enums"]["company_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          status?: Database["public"]["Enums"]["company_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      company_users: {
        Row: {
          auth_user_id: string;
          company_id: string;
          created_at: string;
          email: string;
          id: string;
          name: string;
          role: Database["public"]["Enums"]["company_user_role"];
          status: Database["public"]["Enums"]["company_user_status"];
          updated_at: string;
        };
        Insert: {
          auth_user_id: string;
          company_id: string;
          created_at?: string;
          email: string;
          id?: string;
          name: string;
          role: Database["public"]["Enums"]["company_user_role"];
          status?: Database["public"]["Enums"]["company_user_status"];
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string;
          company_id?: string;
          created_at?: string;
          email?: string;
          id?: string;
          name?: string;
          role?: Database["public"]["Enums"]["company_user_role"];
          status?: Database["public"]["Enums"]["company_user_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          company_id: string;
          created_at: string;
          email: string | null;
          id: string;
          name: string;
          origin: string | null;
          phone: string;
          phone_normalized: string;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          name: string;
          origin?: string | null;
          phone: string;
          phone_normalized: string;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          email?: string | null;
          id?: string;
          name?: string;
          origin?: string | null;
          phone?: string;
          phone_normalized?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      deals: {
        Row: {
          assigned_user_id: string | null;
          company_id: string;
          contact_id: string;
          created_at: string;
          id: string;
          moved_at: string;
          stage_id: string;
        };
        Insert: {
          assigned_user_id?: string | null;
          company_id: string;
          contact_id: string;
          created_at?: string;
          id?: string;
          moved_at?: string;
          stage_id: string;
        };
        Update: {
          assigned_user_id?: string | null;
          company_id?: string;
          contact_id?: string;
          created_at?: string;
          id?: string;
          moved_at?: string;
          stage_id?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          author_name: string;
          author_user_id: string | null;
          body: string;
          created_at: string;
          deal_id: string;
          id: string;
        };
        Insert: {
          author_name?: string;
          author_user_id?: string | null;
          body: string;
          created_at?: string;
          deal_id: string;
          id?: string;
        };
        Update: {
          author_name?: string;
          author_user_id?: string | null;
          body?: string;
          created_at?: string;
          deal_id?: string;
          id?: string;
        };
        Relationships: [];
      };
      stages: {
        Row: {
          company_id: string;
          created_at: string;
          id: string;
          name: string;
          position: number;
          updated_at: string;
        };
        Insert: {
          company_id: string;
          created_at?: string;
          id?: string;
          name: string;
          position?: number;
          updated_at?: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          id?: string;
          name?: string;
          position?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_company_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      is_company_admin: {
        Args: {
          p_company_id: string;
        };
        Returns: boolean;
      };
      is_company_member: {
        Args: {
          p_company_id: string;
        };
        Returns: boolean;
      };
      seed_company_stages: {
        Args: {
          p_company_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      company_status: "active" | "inactive";
      company_user_role: "admin" | "member";
      company_user_status: "active" | "inactive" | "deleted";
    };
    CompositeTypes: Record<string, never>;
  };
}

type PublicSchema = Database["public"];

export type TableName = keyof PublicSchema["Tables"];
export type TableRow<T extends TableName> = PublicSchema["Tables"][T]["Row"];
export type TableInsert<T extends TableName> = PublicSchema["Tables"][T]["Insert"];
export type TableUpdate<T extends TableName> = PublicSchema["Tables"][T]["Update"];
