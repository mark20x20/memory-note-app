/**
 * UI-8: Photo Viewer Navigation Helpers
 *
 * Utilities for deciding whether a grouped photo viewer (filtered by placeGroupId)
 * can be safely opened. When only photoPreviewURLs fallback is available — i.e. the
 * group has no real PhotoDoc IDs — opening the viewer with placeGroupId would result
 * in 0 photos displayed (the viewer filters allPhotos by photoIds, which would be empty).
 */

/**
 * Returns true when the group has real PhotoDoc IDs that map to Firestore PhotoDocs.
 * Use this before navigating to the viewer with `placeGroupId` in the query params.
 *
 * When false, only photoPreviewURLs fallback is available — render the image without
 * a tap handler instead of opening the grouped viewer.
 */
export function canOpenGroupedPhotoViewer(group: {
  photoIds?: string[] | null;
}): boolean {
  return Array.isArray(group.photoIds) && group.photoIds.length > 0;
}
