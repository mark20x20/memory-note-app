# React Native Component Architecture: Preview V2 / Tabbed Edit

## Purpose

This document converts the approved mockups and UI rules into a React Native component architecture aligned with the current app structure.

Target:
- Expo Router screen structure
- `src/features/*` based component organization
- reusable shared UI where practical
- preview v2 + tabbed edit flow

## Scope

This document covers:
- preview v2 screen architecture
- tabbed edit screen architecture
- component tree
- recommended file placement
- hooks / state ownership
- navigation responsibilities

This document does not define:
- final Firestore schema changes
- final save API shape for every tab
- styling token changes outside current theme system

## Current Project Fit

The current codebase already has:
- route screens under `app/(app)/notes/[noteId]/`
- note hooks under `src/features/memoryNotes/hooks/`
- photo hooks under `src/features/photos/hooks/`
- place timeline / place UI under `src/features/placeIntelligence/components/`
- shared UI primitives under `src/shared/components/ui/`

The proposed architecture keeps those boundaries.

## Route Strategy

### Recommended Routes

- preview route
  - `app/(app)/notes/[noteId]/preview.tsx`

- edit route
  - keep existing `app/(app)/notes/[noteId]/edit.tsx`

### Edit Tab Strategy

Prefer tab state inside one route first:
- `edit.tsx` owns current tab state
- query param tab support is optional later

Optional future support:
- `/(app)/notes/[noteId]/edit?tab=overview`
- `/(app)/notes/[noteId]/edit?tab=photos`
- `/(app)/notes/[noteId]/edit?tab=flows`
- `/(app)/notes/[noteId]/edit?tab=places`
- `/(app)/notes/[noteId]/edit?tab=memo`

Reason:
- keeps implementation simpler at first
- keeps header/save behavior centralized
- easier to preserve unsaved tab state

## Feature Placement

### Recommended New Directories

- `src/features/memoryNotes/components/preview/`
- `src/features/memoryNotes/components/edit/`
- `src/features/memoryNotes/types/edit.ts`
- `src/features/memoryNotes/hooks/useNoteEditDraft.ts`

### Recommended File Layout

#### Preview

- `src/features/memoryNotes/components/preview/NotePreviewScreenContent.tsx`
- `src/features/memoryNotes/components/preview/PreviewHeroSection.tsx`
- `src/features/memoryNotes/components/preview/PreviewMetaBlock.tsx`
- `src/features/memoryNotes/components/preview/PreviewMemoryNoteCard.tsx`
- `src/features/memoryNotes/components/preview/PreviewBottomActions.tsx`

#### Edit Shell

- `src/features/memoryNotes/components/edit/NoteEditScreenContent.tsx`
- `src/features/memoryNotes/components/edit/EditTabBar.tsx`
- `src/features/memoryNotes/components/edit/EditSaveBar.tsx`
- `src/features/memoryNotes/components/edit/EditDirtyStateBadge.tsx`

#### Edit Panels

- `src/features/memoryNotes/components/edit/panels/OverviewEditPanel.tsx`
- `src/features/memoryNotes/components/edit/panels/PhotosEditPanel.tsx`
- `src/features/memoryNotes/components/edit/panels/FlowsEditPanel.tsx`
- `src/features/memoryNotes/components/edit/panels/PlacesEditPanel.tsx`
- `src/features/memoryNotes/components/edit/panels/MemoEditPanel.tsx`

#### Edit Subcomponents

- `src/features/memoryNotes/components/edit/PhotoThumbnailReorderList.tsx`
- `src/features/memoryNotes/components/edit/FlowEditCard.tsx`
- `src/features/memoryNotes/components/edit/PlaceCandidatePicker.tsx`
- `src/features/memoryNotes/components/edit/CoverPhotoEditor.tsx`
- `src/features/memoryNotes/components/edit/MemoryMemoEditor.tsx`

## Screen Composition

## Preview Screen Composition

### Route File

- `app/(app)/notes/[noteId]/preview.tsx`

### Responsibilities

- fetch note detail
- fetch note photos
- fetch place groups
- resolve user permission for edit CTA
- render preview-only experience

### Screen Tree

`NotePreviewRoute`
- `Screen`
- `ScreenHeader`
- `NotePreviewScreenContent`
  - `PreviewHeroSection`
  - `PreviewMetaBlock`
  - `VisitTimelineSection`
  - `EventMapPreview`
  - `PreviewMemoryNoteCard`
  - `PreviewBottomActions`

### Reuse From Existing Code

- `VisitTimelineSection`
- `EventMapPreview`
- possibly `AiDiarySection` logic, but not its current wording/UI directly

### New Wrapper Components

#### `NotePreviewScreenContent`

Purpose:
- orchestrates the preview layout only

Props:
- `note`
- `photos`
- `canEdit`
- `noteId`

#### `PreviewHeroSection`

Purpose:
- display hero photo and supporting thumbnails

Props:
- `photos`
- `title`
- `dateLabel`
- `locationLabel`

#### `PreviewMemoryNoteCard`

Purpose:
- show memo / memory note text without technical explanation

Props:
- `memo`
- `aiDiary`

Rule:
- choose one final display text source
- avoid showing both memo and AI diary in competing blocks unless intentionally designed

#### `PreviewBottomActions`

Purpose:
- hold the quiet `編集する` CTA

Props:
- `canEdit`
- `onPressEdit`

## Edit Screen Composition

### Route File

- `app/(app)/notes/[noteId]/edit.tsx`

### Responsibilities

- fetch note detail
- initialize edit draft state
- control active tab
- collect edits across tabs
- save through a unified action
- route to deeper existing place/flow screens where needed

### Screen Tree

`NoteEditRoute`
- `Screen`
- `ScreenHeader`
- `NoteEditScreenContent`
  - `EditDirtyStateBadge`
  - `EditTabBar`
  - active panel
    - `OverviewEditPanel`
    - or `PhotosEditPanel`
    - or `FlowsEditPanel`
    - or `PlacesEditPanel`
    - or `MemoEditPanel`
  - `EditSaveBar`

## State Ownership

### Recommended Central Draft Hook

- `useNoteEditDraft(noteId, note, photos, placeGroups)`

This hook should own:
- active tab
- editable title
- editable memo
- editable ai diary text
- selected cover photo id
- local photo ordering
- local flow edits
- local place selection overrides
- dirty state

### Why Centralize

Because save is shared across tabs, the parent should own the draft.

Tabs should mostly receive:
- current slice of draft state
- update callbacks

This avoids:
- losing changes when switching tabs
- fragmented save logic
- duplicated dirty-state tracking

## Suggested Types

### `EditTabKey`

File:
- `src/features/memoryNotes/types/edit.ts`

```ts
export type EditTabKey = 'overview' | 'photos' | 'flows' | 'places' | 'memo';
```

### `NoteEditDraft`

```ts
export type NoteEditDraft = {
  title: string;
  memo: string;
  aiDiary: string;
  noteType: 'personal' | 'shared';
  coverPhotoId: string | null;
  orderedPhotoIds: string[];
  flowEdits: FlowEditDraft[];
  placeEdits: Record<string, PlaceEditDraft>;
};
```

### `FlowEditDraft`

```ts
export type FlowEditDraft = {
  flowId: string;
  title?: string | null;
  orderedPhotoIds: string[];
  placeGroupId?: string | null;
  splitFromFlowId?: string | null;
  mergedFlowIds?: string[];
};
```

### `PlaceEditDraft`

```ts
export type PlaceEditDraft = {
  placeGroupId: string;
  selectedCandidateId?: string | null;
  manualLabel?: string;
  manualCategory?: string;
};
```

## Tab-by-Tab Component Design

## 1. Overview Tab

### Component

- `OverviewEditPanel`

### Responsibilities

- edit title
- edit note type if retained
- edit date label if exposed
- edit summary location label
- change cover photo entry point

### Child Components

- `CoverPhotoEditor`
- `AppTextInput` style field wrappers if later introduced

### Props

- `draft`
- `photos`
- `onChangeTitle`
- `onChangeCoverPhoto`
- `onChangeNoteType`

## 2. Photos Tab

### Component

- `PhotosEditPanel`

### Responsibilities

- reorder photos
- set cover
- remove photo
- add photo
- launch full viewer

### Child Components

- `PhotoThumbnailReorderList`
- `SelectedPhotoPreviewCard`

### Existing Hook Reuse

- `usePhotoPicker`
- `usePhotoUpload`

### Important Decision

Do not put upload logic directly into the route screen.
Keep it inside panel-level handlers or a dedicated hook used by the panel.

## 3. Flows Tab

### Component

- `FlowsEditPanel`

### Responsibilities

- display editable flow cards
- reorder flow groups
- split flow
- merge adjacent flows
- move photos between flows

### Child Components

- `FlowEditCard`
- `FlowPhotoMiniStrip`
- `FlowStructureActions`

### Existing Integration

Can deep-link to:
- `app/(app)/notes/[noteId]/flow-settings.tsx`
- `app/(app)/notes/[noteId]/flows/[placeGroupId].tsx`

Use these when:
- editing becomes too dense for in-panel interaction
- a dedicated full-screen adjustment is more practical

## 4. Places Tab

### Component

- `PlacesEditPanel`

### Responsibilities

- display selected place
- show candidate list
- allow map confirmation
- allow manual override

### Child Components

- `PlaceCandidatePicker`
- `SelectedPlaceCard`
- `PlaceManualOverrideForm`

### Existing Integration

Can reuse / connect to:
- `app/(app)/notes/[noteId]/places/index.tsx`
- `app/(app)/notes/[noteId]/places/[placeGroupId].tsx`
- `app/(app)/notes/[noteId]/places/manual.tsx` if added/kept

### Practical Rule

Keep lightweight confirmation in-panel.
Push heavy candidate comparison or manual correction to existing dedicated routes if needed.

## 5. Memo Tab

### Component

- `MemoEditPanel`

### Responsibilities

- edit the final displayed memory text
- optionally switch between memo and AI diary source
- keep the writing experience calm

### Child Components

- `MemoryMemoEditor`
- optional `RewriteActionsRow`

## Shared UI Recommendations

## New Shared Components Worth Adding

Under `src/shared/components/ui/` only if reused broadly:

- `SegmentedTabs.tsx`
- `StickyBottomBar.tsx`
- `SectionCard.tsx`
- `InlineStatusBadge.tsx`

If usage is mostly note-edit-specific, keep them inside `memoryNotes/components/edit/`.

## Data / Save Flow

### Parent Save Strategy

`edit.tsx` should remain the save orchestrator.

Suggested flow:
1. route loads raw entities
2. `useNoteEditDraft` builds draft
3. panels update draft
4. `EditSaveBar` triggers `handleSave`
5. parent converts draft to repository payload(s)

### Save Buckets

Do not force one huge repository method immediately.
It is acceptable to save by concern:
- note fields via `useUpdateNote`
- photos via photo repository / ordering update
- places via place group update flow
- flows via dedicated flow settings path

Then wrap these under one route-level save action.

## Migration Strategy From Current `edit.tsx`

### Current Problems

Current `edit.tsx` mixes:
- data loading
- field rendering
- flow recreation action
- save / delete action
- permission handling

### Suggested Refactor Steps

#### Step 1

Keep current route file, but extract:
- `NoteEditScreenContent`
- `EditSaveBar`
- `OverviewEditPanel`

#### Step 2

Introduce `EditTabBar` and active tab state.

#### Step 3

Move current flow actions into `FlowsEditPanel`.

#### Step 4

Move place correction actions into `PlacesEditPanel`.

#### Step 5

Add `preview.tsx` and route detail screen CTA there if desired.

## Recommended Props Boundaries

### Route Layer

Owns:
- fetching
- permissions
- save orchestration
- destructive actions
- navigation

### Panel Layer

Owns:
- view logic
- local interaction details
- event callbacks upward

### Leaf Component Layer

Owns:
- rendering only
- tiny interaction units

## Naming Guidance

Prefer:
- `PreviewHeroSection`
- `EditTabBar`
- `PhotosEditPanel`
- `FlowEditCard`

Avoid vague names like:
- `EditorBox`
- `MainPanel`
- `InfoSection2`

## First Implementation Slice

If implementing incrementally, start with:

1. `preview.tsx`
2. `NotePreviewScreenContent`
3. `EditTabBar`
4. `OverviewEditPanel`
5. route-level tab state in `edit.tsx`

This gets:
- preview/edit separation
- visible tabbed architecture
- minimal disruption to current code

## Deliverables Mapping

### Mockup → Component

- `memory-preview-screen-v2.png`
  - `NotePreviewScreenContent`

- `memory-edit-overview-tab-v1.png`
  - `OverviewEditPanel`

- `memory-edit-photos-tab-v1.png`
  - `PhotosEditPanel`

- `memory-edit-flows-tab-v1.png`
  - `FlowsEditPanel`

- `memory-edit-places-tab-v1.png`
  - `PlacesEditPanel`

- `memory-edit-memo-tab-v1.png`
  - `MemoEditPanel`

## Final Recommendation

The safest architecture is:
- one dedicated preview route
- one edit route with internal tabs
- central edit draft hook
- narrow focused panels
- reuse existing timeline / map / place flows where already built

This fits the current repository without forcing a large rewrite.

## Component Token Defaults

### `EditTabBar`

- height: `44`
- tab padding x: `14`
- active bg: `#FDE7E2`
- active text: `#F26B5B`
- inactive text: `#7A746D`
- label: `13 / 600 / Noto Sans JP`

### `OverviewEditPanel`

- cover height: `280`
- cover radius: `24`
- title input height: `52`
- row field height: `48`
- field border: `#E8DED4`
- field radius: `16`

### `EditSaveBar`

- min height: `78`
- background: `rgba(250,247,242,0.94)`
- top border: `1px #F0E7DE`
- primary button height: `52`
