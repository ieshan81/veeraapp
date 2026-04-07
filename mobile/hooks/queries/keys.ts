export const qk = {
  profile: (userId: string) => ['profile', userId] as const,
  plant: (id: string) => ['plant', id] as const,
  plantPhotos: (id: string) => ['plantPhotos', id] as const,
  plantTags: (id: string) => ['plantTags', id] as const,
  plantSections: (id: string) => ['plantSections', id] as const,
  userPlants: (userId: string) => ['userPlants', userId] as const,
  userPlant: (id: string, userId: string) => ['userPlant', id, userId] as const,
  progress: (userPlantId: string, userId: string) => ['progress', userPlantId, userId] as const,
};
