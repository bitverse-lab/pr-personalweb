export function resolveProfilePhotoUrls(heroPhotoUrl: string | null, aboutPhotoUrl: string | null) {
  return {
    heroPhotoUrl,
    aboutPhotoUrl: aboutPhotoUrl ?? heroPhotoUrl,
  };
}
