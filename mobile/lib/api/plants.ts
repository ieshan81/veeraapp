import { supabase } from '@/lib/supabase';
import type {
  Plant,
  PlantCatalogPhoto,
  PlantContentSection,
  PlantTag,
  UserPlant,
  UserPlantProgress,
  UserPlantWithCatalog,
  UserPlantWithLatest,
} from '@/types/database';

const PROGRESS_BUCKET = 'user-plant-progress';
const CATALOG_BUCKET = 'plant-photos';

export async function resolvePlantQr(payload: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('resolve_plant_qr', { p_payload: payload });
  if (error) throw error;
  return data as string | null;
}

export async function fetchPlant(id: string): Promise<Plant | null> {
  const { data, error } = await supabase.from('plants').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data as Plant | null;
}

export async function fetchPlantPhotos(plantId: string): Promise<PlantCatalogPhoto[]> {
  const { data, error } = await supabase
    .from('plant_catalog_photos')
    .select('*')
    .eq('plant_id', plantId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PlantCatalogPhoto[];
}

export async function fetchPlantTags(plantId: string): Promise<PlantTag[]> {
  const { data: links, error: e1 } = await supabase
    .from('plant_tag_assignments')
    .select('tag_id')
    .eq('plant_id', plantId);
  if (e1) throw e1;
  const ids = (links ?? []).map((r: { tag_id: string }) => r.tag_id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('plant_tags').select('*').in('id', ids);
  if (error) throw error;
  return (data ?? []) as PlantTag[];
}

export async function fetchPlantSections(plantId: string): Promise<PlantContentSection[]> {
  const { data, error } = await supabase
    .from('plant_content_sections')
    .select('*')
    .eq('plant_id', plantId)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as PlantContentSection[];
}

export async function getSignedCatalogPhotoUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(CATALOG_BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error) {
    console.warn('Signed URL error', error.message);
    return null;
  }
  return data.signedUrl;
}

export async function fetchUserPlants(userId: string): Promise<UserPlantWithLatest[]> {
  const { data, error } = await supabase
    .from('user_plants')
    .select('*, plant:plants(id, common_name, scientific_name, water_level, light_level)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const plants = (data ?? []) as unknown as UserPlantWithCatalog[];

  const { data: progRows } = await supabase
    .from('user_plant_progress')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  const latestByPlant = new Map<string, UserPlantProgress>();
  for (const row of progRows ?? []) {
    const r = row as UserPlantProgress;
    if (!latestByPlant.has(r.user_plant_id)) latestByPlant.set(r.user_plant_id, r);
  }

  return plants.map((p) => ({
    ...p,
    latest_progress: latestByPlant.get(p.id) ?? null,
  }));
}

export async function fetchUserPlant(id: string, userId: string): Promise<UserPlantWithCatalog | null> {
  const { data, error } = await supabase
    .from('user_plants')
    .select('*, plant:plants(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as UserPlantWithCatalog | null;
}

export async function insertUserPlant(
  row: Omit<UserPlant, 'id' | 'created_at' | 'updated_at'>
): Promise<UserPlant> {
  const { data, error } = await supabase.from('user_plants').insert(row).select().single();
  if (error) throw error;
  return data as UserPlant;
}

export async function updateUserPlant(
  id: string,
  userId: string,
  patch: Partial<
    Pick<
      UserPlant,
      | 'nickname'
      | 'room'
      | 'acquired_at'
      | 'notes'
      | 'reminder_enabled'
      | 'reminder_time'
    >
  >
): Promise<UserPlant> {
  const { data, error } = await supabase
    .from('user_plants')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as UserPlant;
}

export async function fetchProgress(userPlantId: string, userId: string): Promise<UserPlantProgress[]> {
  const { data, error } = await supabase
    .from('user_plant_progress')
    .select('*')
    .eq('user_plant_id', userPlantId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserPlantProgress[];
}

export async function insertProgress(
  row: Omit<UserPlantProgress, 'id' | 'created_at'>
): Promise<UserPlantProgress> {
  const { data, error } = await supabase.from('user_plant_progress').insert(row).select().single();
  if (error) throw error;
  return data as UserPlantProgress;
}

export async function uploadProgressPhoto(
  userId: string,
  uri: string,
  mimeType: string
): Promise<string> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const res = await fetch(uri);
  const buf = await res.arrayBuffer();
  const { error } = await supabase.storage.from(PROGRESS_BUCKET).upload(path, buf, {
    contentType: mimeType,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function getSignedProgressPhotoUrl(
  storagePath: string,
  expiresIn = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(PROGRESS_BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error) return null;
  return data.signedUrl;
}
