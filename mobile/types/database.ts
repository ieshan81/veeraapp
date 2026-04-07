export type PlantStatus = 'active' | 'inactive' | 'archived';

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Plant = {
  id: string;
  slug: string;
  common_name: string;
  scientific_name: string | null;
  status: PlantStatus;
  summary: string | null;
  light_level: string | null;
  water_level: string | null;
  qr_target_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PlantCatalogPhoto = {
  id: string;
  plant_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
};

export type PlantTag = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
};

export type PlantContentSection = {
  id: string;
  plant_id: string;
  section_key: string;
  section_label: string;
  content: string;
  sort_order: number;
  is_active: boolean;
};

export type UserPlant = {
  id: string;
  user_id: string;
  plant_id: string;
  nickname: string | null;
  room: string | null;
  acquired_at: string | null;
  notes: string | null;
  reminder_enabled: boolean;
  reminder_time: string | null;
  created_at: string;
  updated_at: string;
};

export type UserPlantProgress = {
  id: string;
  user_plant_id: string;
  user_id: string;
  note: string | null;
  health_tag: string | null;
  issue_tag: string | null;
  height_estimate: number | null;
  photo_storage_path: string | null;
  created_at: string;
};

export type UserPlantWithCatalog = UserPlant & {
  plant: Pick<Plant, 'id' | 'common_name' | 'scientific_name'> | null;
};

export type UserPlantWithLatest = UserPlantWithCatalog & {
  latest_progress: UserPlantProgress | null;
};
