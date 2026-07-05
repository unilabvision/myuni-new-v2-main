export interface CourseTier {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  description?: string | null;
  price: number;
  original_price?: number | null;
  early_bird_price?: number | null;
  early_bird_deadline?: string | null;
  shopier_product_id?: string | null;
  shopier_product_url?: string | null;
  is_registration_open: boolean;
  is_active: boolean;
  order_index: number;
  includes_qa: boolean;
  /** true ise tam eğitim paketi; bireysel paketlerle birlikte seçilemez */
  is_full_course?: boolean;
  session_labels?: string[] | null;
  sessions?: TierSession[];
}

export interface TierSession {
  id: string;
  tier_id: string;
  session_id: string;
  order_index: number;
  session?: {
    id: string;
    title?: string;
    session_number?: number;
    start_time?: string;
    end_time?: string;
  };
}
