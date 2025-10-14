# MVP Todo - Table Tennis Tournament Management Platform

## Overview
Building a complete table tennis tournament management platform with social features, ELO ranking system, and club management capabilities.

## Core Files to Create (8 files maximum)

### 1. Database & Types
- `lib/db.ts` - Prisma client configuration
- `lib/types.ts` - TypeScript interfaces for all entities
- `lib/validations.ts` - Zod schemas for form validation

### 2. Authentication & User Management
- `components/auth/AuthForms.tsx` - Login/Register forms
- `app/(auth)/login/page.tsx` - Login page
- `app/(auth)/register/page.tsx` - Registration page

### 3. Core Features
- `app/(dashboard)/dashboard/page.tsx` - Main dashboard
- `app/(dashboard)/tournaments/page.tsx` - Tournament management
- `components/tournaments/TournamentCard.tsx` - Tournament display component
- `components/tournaments/TournamentBracket.tsx` - Tournament bracket visualization

### 4. Social Features
- `components/social/UserProfile.tsx` - User profile component
- `app/(dashboard)/profile/page.tsx` - Profile page
- `components/social/RankingTable.tsx` - ELO ranking display

### 5. Utilities
- `lib/elo-rating.ts` - ELO rating calculation algorithm
- `lib/tournament-generator.ts` - Tournament bracket generation

## Implementation Strategy

### Phase 1: Core Setup (Current)
1. ✅ Template setup with shadcn-ui
2. 🔄 Database schema implementation with Prisma
3. 🔄 Authentication system with NextAuth
4. 🔄 Basic user registration/login

### Phase 2: Tournament Management
1. Tournament creation form
2. Tournament listing and filtering
3. Player registration system
4. Bracket generation algorithm
5. Result input system

### Phase 3: Social & Ranking
1. ELO rating calculation
2. User profiles and following system
3. Challenge system between players
4. Activity feed

### Phase 4: Polish & Optimization
1. Responsive design improvements
2. Performance optimizations
3. Error handling
4. Testing

## Key Features to Implement

### Authentication
- Email/password registration and login
- User profile with tennis-specific data (level, dominant hand, etc.)
- Role-based access (Player, Club Admin)

### Tournament Management
- Create tournaments with flexible configurations
- Player registration with validation
- Automatic bracket generation (single elimination)
- Result input with score validation
- Real-time tournament status updates

### ELO Ranking System
- Automatic rating calculation after matches
- Rating history tracking
- Global and local rankings
- Seeding based on ratings

### Social Features
- User profiles with statistics
- Follow/unfollow system
- Challenge system between players
- Activity feed with match results

### Club Management
- Club creation and administration
- Member management
- Tournament organization tools

## Technical Requirements
- Next.js 14 with App Router
- TypeScript for type safety
- Prisma ORM with PostgreSQL
- Tailwind CSS + shadcn/ui components
- NextAuth.js for authentication
- React Hook Form + Zod for forms
- React Query for data fetching

## Success Criteria
- Users can register and create profiles
- Club admins can create and manage tournaments
- Players can register for tournaments
- Automatic bracket generation works correctly
- ELO ratings are calculated accurately
- Responsive design works on mobile and desktop
- All core user flows are functional