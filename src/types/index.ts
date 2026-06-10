// =====================
// Permission / Role
// =====================
export type PermissionRole = 'owner' | 'editor' | 'viewer';
export type PermissionStatus = 'active' | 'invited' | 'left' | 'removed';

// =====================
// User
// =====================
export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// =====================
// Memory Note
// =====================
export interface MemoryNote {
  id: string;
  title: string;
  description: string | null;
  coverPhotoUrl: string | null;
  noteDate: Date;
  photoCount: number;
  spotCount: number;
  memberCount: number;
  ownerId: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =====================
// Memory Note Member
// =====================
export interface MemoryNoteMember {
  userId: string;
  noteId: string;
  role: PermissionRole;
  status: PermissionStatus;
  invitedAt: Date | null;
  joinedAt: Date | null;
}

// =====================
// Photo
// =====================
export interface MemoryNotePhoto {
  id: string;
  noteId: string;
  uploadedBy: string;
  storagePath: string;
  thumbnailPath: string | null;
  takenAt: Date | null;
  latitude: number | null;
  longitude: number | null;
  placeGroupId: string | null;
  width: number | null;
  height: number | null;
  isDeleted: boolean;
  createdAt: Date;
}

// =====================
// Place Group (Spot)
// =====================
export interface PlaceGroup {
  id: string;
  noteId: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  photoCount: number;
  order: number;
}

// =====================
// AI Result
// =====================
export interface AiResult {
  id: string;
  noteId: string;
  type: 'title' | 'diary' | 'summary';
  content: string;
  generatedAt: Date;
  isSelected: boolean;
}

// =====================
// Share Card
// =====================
export interface ShareCard {
  id: string;
  noteId: string;
  imageUrl: string;
  ratio: '1:1' | '4:5' | '9:16';
  createdAt: Date;
}

// =====================
// Invitation
// =====================
export interface Invitation {
  id: string;
  noteId: string;
  invitedBy: string;
  inviteeEmail: string;
  role: PermissionRole;
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: Date;
}

// =====================
// Notification
// =====================
export interface AppNotification {
  id: string;
  userId: string;
  type: 'invitation' | 'member_joined' | 'photo_added' | 'note_shared';
  title: string;
  body: string;
  isRead: boolean;
  payload: Record<string, unknown>;
  createdAt: Date;
}
