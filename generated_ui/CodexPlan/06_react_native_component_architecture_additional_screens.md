# React Native Component Architecture: Additional Screens

## Purpose

This document converts the newly added screen specs into React Native component architecture aligned with the current app structure.

Target screens:
- Full Photo Viewer
- Place Detail / Candidate Confirmation
- Collaboration / Members
- Flow Detail
- Onboarding

## Design Consistency Check

These additional screens are defined at the same target grain as the existing set:
- `Screen ID`
- `Purpose`
- `UX Role`
- `Primary Design Principle`
- `Information Priority`
- `Layout Structure`
- `Components`
- `Detailed Style Tokens`

This matches the normalized structure of the full screen spec set.

## Route Mapping

### Full Photo Viewer

- route:
  - `app/(app)/notes/[noteId]/photos/viewer.tsx`

### Place Detail / Candidate Confirmation

- route:
  - `app/(app)/notes/[noteId]/places/[placeGroupId].tsx`

### Members

- route:
  - `app/(app)/notes/[noteId]/members.tsx`

### Flow Detail

- route:
  - `app/(app)/notes/[noteId]/flows/[placeGroupId].tsx`

### Onboarding

- route:
  - `app/(auth)/onboarding.tsx`

## Feature Placement

### Recommended Directories

- `src/features/photos/components/viewer/`
- `src/features/placeIntelligence/components/placeDetail/`
- `src/features/collaboration/components/members/`
- `src/features/placeIntelligence/components/flowDetail/`
- `src/features/auth/components/onboarding/`

## 1. Full Photo Viewer

## Route Responsibilities

- read `noteId`
- read optional `placeGroupId`
- read optional `initialIndex`
- fetch note photos
- compute visible photo set
- render immersive carousel

## Screen Tree

`PhotoViewerRoute`
- full-screen container
- `PhotoViewerHeaderOverlay`
- `PhotoViewerCarousel`
- `PhotoViewerInfoOverlay`
- optional `PhotoViewerThumbnailRail`

## Recommended Components

- `src/features/photos/components/viewer/PhotoViewerCarousel.tsx`
- `src/features/photos/components/viewer/PhotoViewerHeaderOverlay.tsx`
- `src/features/photos/components/viewer/PhotoViewerInfoOverlay.tsx`
- `src/features/photos/components/viewer/PhotoViewerThumbnailRail.tsx`

## Key Props

### `PhotoViewerCarousel`

- `photos`
- `initialIndex`
- `onIndexChange`

### `PhotoViewerInfoOverlay`

- `photo`
- `placeLabel`
- `dateLabel`

## State Notes

Keep local state minimal:
- current index
- overlay visibility if needed

Do not push save logic into this route.

## 2. Place Detail / Candidate Confirmation

## Route Responsibilities

- fetch one place group
- fetch candidate list
- fetch related photos
- fetch map region data
- save selected candidate or manual override

## Screen Tree

`PlaceDetailRoute`
- `Screen`
- `ScreenHeader`
- `PlaceDetailScreenContent`
  - `SelectedPlaceCard`
  - `PlaceMiniMapCard`
  - `PlaceCandidateList`
  - `PlaceRelatedPhotoStrip`
  - `PlaceDetailActions`

## Recommended Components

- `src/features/placeIntelligence/components/placeDetail/PlaceDetailScreenContent.tsx`
- `src/features/placeIntelligence/components/placeDetail/SelectedPlaceCard.tsx`
- `src/features/placeIntelligence/components/placeDetail/PlaceCandidateList.tsx`
- `src/features/placeIntelligence/components/placeDetail/PlaceCandidateRow.tsx`
- `src/features/placeIntelligence/components/placeDetail/PlaceRelatedPhotoStrip.tsx`
- `src/features/placeIntelligence/components/placeDetail/PlaceDetailActions.tsx`

## State Notes

This route can own:
- selected candidate id
- manual correction draft
- saving state

## Existing Integration

Reuse where possible:
- `placeFunctionsClient`
- `placeGroupRepository`
- current candidate map logic patterns

## 3. Members Screen

## Route Responsibilities

- fetch note member list
- resolve current user role
- show invite / manage actions conditionally

## Screen Tree

`MembersRoute`
- `Screen`
- `ScreenHeader`
- `MembersScreenContent`
  - `ShareSummaryCard`
  - `MemberList`
  - `InviteMembersCard`
  - `RoleGuideCard`

## Recommended Components

- `src/features/collaboration/components/members/MembersScreenContent.tsx`
- `src/features/collaboration/components/members/ShareSummaryCard.tsx`
- `src/features/collaboration/components/members/MemberRow.tsx`
- `src/features/collaboration/components/members/InviteMembersCard.tsx`
- `src/features/collaboration/components/members/RoleGuideCard.tsx`

## State Notes

Keep route-level state for:
- invite modal open / close
- member mutation loading

## 4. Flow Detail

## Route Responsibilities

- fetch one flow / place group
- fetch related photos
- fetch route context
- link outward to edit and place confirmation

## Screen Tree

`FlowDetailRoute`
- `Screen`
- `ScreenHeader`
- `FlowDetailScreenContent`
  - `FlowHeroSection`
  - `FlowMetaCard`
  - `FlowRoutePreviewCard`
  - `FlowRelatedPhotoStrip`
  - `FlowMemoCard`
  - `FlowActionRow`

## Recommended Components

- `src/features/placeIntelligence/components/flowDetail/FlowDetailScreenContent.tsx`
- `src/features/placeIntelligence/components/flowDetail/FlowHeroSection.tsx`
- `src/features/placeIntelligence/components/flowDetail/FlowMetaCard.tsx`
- `src/features/placeIntelligence/components/flowDetail/FlowRoutePreviewCard.tsx`
- `src/features/placeIntelligence/components/flowDetail/FlowRelatedPhotoStrip.tsx`
- `src/features/placeIntelligence/components/flowDetail/FlowActionRow.tsx`

## Existing Integration

Reuse:
- `EventMapPreview`
- current flow route data
- note photo viewer entry logic

## 5. Onboarding

## Route Responsibilities

- present first-time explanation
- route into create flow
- optionally coordinate permission explanation timing

## Screen Tree

`OnboardingRoute`
- `Screen`
- `OnboardingScreenContent`
  - `OnboardingHeroBlock`
  - `OnboardingStepsSection`
  - `OnboardingPermissionHintCard`
  - `OnboardingActionFooter`

## Recommended Components

- `src/features/auth/components/onboarding/OnboardingScreenContent.tsx`
- `src/features/auth/components/onboarding/OnboardingHeroBlock.tsx`
- `src/features/auth/components/onboarding/OnboardingStepCard.tsx`
- `src/features/auth/components/onboarding/OnboardingPermissionHintCard.tsx`
- `src/features/auth/components/onboarding/OnboardingActionFooter.tsx`

## Recommended Implementation Order

1. Full Photo Viewer
2. Place Detail / Candidate Confirmation
3. Flow Detail
4. Members
5. Onboarding

## Why This Order

- Photo viewer already has strong product dependency
- Place detail is directly tied to current place intelligence work
- Flow detail strengthens the preview/edit storytelling bridge
- Members and onboarding are valuable but less structurally blocking

## Consistency Finding

After normalization, the screen specs are now effectively aligned to one shared documentation grain.

Minor historical differences remain in wording style, but not in implementation usefulness.
