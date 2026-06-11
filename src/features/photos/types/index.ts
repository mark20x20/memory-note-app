export type PickedPhoto = {
  /** Local unique id (not a Firestore id) */
  id: string;
  /** Local file URI returned by expo-image-picker */
  uri: string;
  fileName?: string | null;
  width?: number;
  height?: number;
  mimeType?: string | null;
  fileSize?: number;
  /** ISO 8601 string extracted from EXIF DateTimeOriginal / DateTime, or null */
  takenAt?: string | null;
  /** Decimal degrees from EXIF GPSLatitude, or null */
  latitude?: number | null;
  /** Decimal degrees from EXIF GPSLongitude, or null */
  longitude?: number | null;
  /** Raw EXIF data from expo-image-picker, or null */
  exif?: Record<string, unknown> | null;
};
