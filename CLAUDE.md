# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **Bandmanager**, a React-based web application for managing band gigs and member availability. It's built with TypeScript, Vite, Firebase, and Tailwind CSS with internationalization support (Dutch/English).

## Development Commands

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production (runs TypeScript compiler + Vite build)
- `npm run lint` - Run ESLint linting
- `npm run preview` - Preview production build locally
- `npm run test` - Run unit tests in watch mode
- `npm run test:run` - Run unit tests once
- `npm run test:coverage` - Run unit tests with coverage reporting
- `npm run test:ui` - Run unit tests with Vitest UI
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with Playwright UI
- `npm run test:e2e:report` - View Playwright test report
- `npm run test:e2e:debug` - Debug Playwright tests

## Architecture Overview

### Core Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + PostCSS
- **Backend**: Firebase (Firestore database + Auth)
- **Email**: Netlify serverless functions + Nodemailer
- **Routing**: React Router v6
- **Internationalization**: i18next with Dutch (default) and English
- **UI Components**: Headless UI, Lucide React icons
- **Drag & Drop**: @dnd-kit for member/instrument management

### Project Structure

```
src/
├── pages/           # Main route components (GigList, GigDetails, NewGig, etc.)
├── components/      # Reusable UI components
├── context/         # React Context providers (Auth, Gig, Band, Member)
├── hooks/           # Custom React hooks (useRole)
├── lib/             # External service configurations (Firebase)
├── utils/           # Utility functions (calendar, email service, email templates)
├── locales/         # Translation files (en/, nl/)
├── types/           # TypeScript type definitions
└── app/api/         # API-related code

netlify/
└── functions/       # Netlify serverless functions (email sending)
```

### Key Architecture Patterns

**Context-Based State Management**: The app uses multiple React Context providers in a nested structure:
- `AuthProvider` (outermost) - Authentication state
- `MemberProvider` - Band member data
- `GigProvider` - Gig/event data  
- `BandProvider` - Band-specific data

**Role-Based Access Control**: Implemented through Firebase security rules with three role levels:
- `admin` - Full system access
- `bandManager` - Can manage gigs and members
- `bandMember` - Can view gigs and set availability

**Multi-Date Gig Support**: Gigs can span multiple dates with per-date availability tracking for each member.

**Email Service Architecture**: Centralized email functionality using Netlify serverless functions:
- `src/utils/emailService.ts` - Core email sending logic and Firestore email fetching helpers
- `src/utils/emailTemplates.ts` - Email content templates (separated from logic for easy content updates)
- `netlify/functions/sendEmail.ts` - Netlify serverless function using Nodemailer
- Environment variables for SMTP configuration (see Environment Configuration below)
- Automatic fallback to Ethereal test accounts in development

### Firebase Integration

The app uses Firebase for:
- **Authentication**: User signup/signin with email verification
- **Firestore Database**: Collections for users, roles, bandMembers, instruments, gigs
- **Security Rules**: Role-based access control defined in `firestore.rules`

Key Firestore collections:
- `users/` - User profile data
- `roles/` - User role assignments (admin/bandManager/bandMember)
- `bandMembers/` - Band member profiles with instruments
- `gigs/` - Gig events with member availability tracking
- `instruments/` - Available instruments for assignment

### Environment Configuration

Required environment variables (see `.env.example`):

**Firebase Configuration:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Email Configuration (Netlify environment variables):**
- `SMTP_HOST` - SMTP server hostname (optional, defaults to Ethereal for testing)
- `SMTP_PORT` - SMTP port (optional, defaults to 587)
- `SMTP_USER` - SMTP username/email (optional)
- `SMTP_PASS` - SMTP password (optional)

### TypeScript Configuration

Uses path mapping with `@/*` pointing to `src/*` for cleaner imports.

### Testing Setup

The project has **comprehensive testing** with both unit and end-to-end tests:

#### Unit Testing (Vitest)
- **Framework**: Vitest with jsdom environment for React component testing
- **Testing Library**: @testing-library/react for component testing
- **Mocking**: Comprehensive mocks for Firebase, routing, and i18n
- **Coverage**: V8 coverage reporting with HTML/text/JSON output
- **Test Files**: Located alongside source files with `.test.ts/tsx` extensions

Key testing utilities:
- `src/test/setup.ts` - Global test configuration and mocks
- `src/test/test-utils.tsx` - Custom render function with all providers

Unit test coverage includes:
- ✅ Utility functions (calendar operations)
- ✅ Custom hooks (useRole)
- ✅ UI components (AvailabilityStatus, LanguageSwitcher, Navigation, AvailabilityOverview)
- ✅ Context providers (AuthContext, BandContext, GigContext, MemberContext)
- ✅ Provider integration tests

#### End-to-End Testing (Playwright)
- **Framework**: Playwright with multi-browser support (Chrome, Firefox, Safari)
- **Test Environment**: Automated browser testing with real user interactions
- **Coverage**: Complete user workflows and integration testing
- **Mobile Testing**: Responsive design testing on mobile viewports
- **Test Files**: Located in `e2e/` directory with `.spec.ts` extensions

E2E test coverage includes:
- ✅ **Authentication flows** (`e2e/auth.spec.ts`) - Login, signup, email verification, error handling
- ✅ **Band management** (`e2e/band-management.spec.ts`) - Member CRUD, instruments, permissions
- ✅ **Gig management** (`e2e/gig-management.spec.ts`) - Gig CRUD, availability, calendar, validation
- ✅ **User workflows** (`e2e/user-workflows.spec.ts`) - Complete user journeys, onboarding, error recovery
- ✅ **Cross-browser compatibility** - Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

Test helpers and utilities:
- `e2e/helpers/auth-helpers.ts` - Authentication utilities (loginAsBandManager, etc.)
- `e2e/helpers/data-helpers.ts` - Test data creation and mocking
- `e2e/helpers/ui-helpers.ts` - UI interaction helpers
- `e2e/setup/global-setup.ts` - Global test environment setup

### Internationalization

- Default language: Dutch (`nl`)
- Fallback: Dutch  
- Translation files in `src/locales/{lang}/translation.json`
- Language switching available in UI

## Development Notes

- Email verification is required for certain actions (creating gigs, updating member data)
- The app handles both single-date and multi-date gigs with complex availability tracking
- Drag-and-drop functionality for assigning members to instruments
- Calendar export functionality for accepted gigs
- Toast notifications for user feedback
- **Email functionality**:
  - Centralized in `src/utils/emailService.ts` and `src/utils/emailTemplates.ts`
  - To add new email types, create a new template function in `emailTemplates.ts` and use the `sendEmail()` function
  - Email content is separated from logic for easy maintenance
  - Uses Netlify serverless function at `/.netlify/functions/sendEmail`
- **Always run tests before making changes**:
  - Unit tests: `npm run test:run`
  - E2E tests: `npm run test:e2e` (requires dev server running)
- **Use coverage reports** to identify untested code: `npm run test:coverage`
- **Test new features end-to-end** using Playwright to ensure complete functionality
- **See `e2e/README.md`** for detailed E2E testing documentation