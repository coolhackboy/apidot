# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 TypeScript application with App Router architecture for an AI-powered image and video generation platform called NanoImg. The application supports multi-language internationalization and integrates with various AI services for content generation.

## Development Commands

### Essential Development Commands
- `npm run dev` - Start development server
- `npm run build` - Production build (uses polling for file watching to avoid @parcel/watcher issues)
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run content` - Build content collections
- `npm run content-collections:generate` - Generate content collections

### Build Configuration
The build uses `CHOKIDAR_USEPOLLING=1 WATCHPACK_POLLING=true` flags to handle file watching issues in certain environments.

## Architecture Overview

### App Router Structure
- **`app/[locale]/`** - Internationalized pages using next-intl
- **`components/tool/`** - AI tool components for image/video generation
- **`services/`** - API service layers for different AI providers
- **`i18n/`** - Internationalization configuration and messages

### Key Architectural Patterns

#### Internationalization (i18n)
- Uses `next-intl` with 18 supported locales
- Locale-based routing with `[locale]` dynamic segments
- Middleware handles geo-blocking and language redirects
- Messages stored in `i18n/messages/` and `i18n/pages/landing/`

#### AI Service Architecture
Services are organized by provider/functionality:
- **Core API**: `services/api.ts` - Central API client with authentication
- **Individual AI APIs**: Each AI service has its own module (e.g., `FluxApi.ts`, `KlingApi.ts`)
- **Specialized Services**: `FluxKontext/` subfolder for related services
- **Types**: `services/types.ts` - Shared API response interfaces

#### Component Organization
- **`components/tool/`** - Tool-specific UI components for AI generation
- **`components/common/`** - Shared UI components
- **`components/ui/`** - Shadcn UI components
- **Tool components follow pattern**: Each tool has an `index.tsx` with its main interface

#### Content Management
- Uses `@content-collections` for markdown content
- Content stored in `content/articles/` (not currently present but configured)
- Knowledge base in `knowledge/` with documentation and showcases

### Configuration Files

#### App Configuration
- **`data/config.ts`** - App-wide settings including credit costs and branding
- **`next.config.js`** - Next.js config with next-intl and content-collections plugins
- **`middleware.ts`** - Handles i18n routing and geo-blocking

#### Key Environment Variables
Based on the codebase, these environment variables are likely needed:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID

### Authentication & State Management
- Google OAuth integration via `@react-oauth/google`
- Session management through cookies and localStorage
- Credit system for AI generation usage
- Device fingerprinting for security

### Styling & UI
- Tailwind CSS for styling
- Shadcn UI component library
- Dark theme support via `next-themes`
- Responsive design patterns

## Development Guidelines

### Tool Page Design Patterns

#### Standard Tool Page Structure
Based on the SpongeBob meme generator implementation, all tool pages should follow this pattern:

**1. Page Structure (`app/[locale]/(tools)/[tool-name]/page.tsx`)**
```tsx
import ToolComponent from "@/components/tool/tool-name";
import SSRPageContent from "@/components/common/SSRPageContent";
import FAQ from "@/components/common/FAQ";
import HowItWork from "@/components/common/HowItWork";
import ContentSection from "@/components/common/ContentSection";
import ExampleShowcase from "@/components/common/ExampleShowcase";
import { LandingPageService } from "@/services/landingPageService";

export default async function ToolPage({ params: { locale } }) {
  const page = await LandingPageService.getLandingPage(locale, "tool-name");

  return (
    <SSRPageContent
      toolComponent={
        <ToolComponent
          credits_amount={2}
          feature_code="15000XXX"
          title={page.hero?.title || ""}
          description={page.hero?.description || ""}
          locale={locale}
        />
      }
      landingPageContent={
        <div className="container mx-auto px-2 sm:px-4 max-w-7xl">
          {page.examples && <ExampleShowcase translations={page.examples} />}
          {page.sections?.map((section, index) => (
            <ContentSection key={index} translations={section} />
          ))}
          {page.howItWork && <HowItWork translations={page.howItWork} />}
          {page.faq && <FAQ translations={page.faq} />}
        </div>
      }
    />
  );
}
```

**2. Tool Component Structure (`components/tool/[tool-name]/index.tsx`)**

**Layout Design:**
- **Outer Container**: `p-6 lg:p-8` for proper spacing from viewport edges
- **Unified Background**: `bg-muted/50 rounded-lg overflow-hidden` for complete visual unity
- **Two-Panel Layout**: Left configuration (fixed width: `lg:w-96`), Right results (flex-1)
- **Height Management**: `h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)]` to account for outer padding

**Component Interface:**
```tsx
interface ToolComponentProps {
  credits_amount?: number;
  feature_code: string;
  title?: string;
  description?: string;
  locale?: string;
}
```

**Key Design Principles:**
- Use `ImageResult` for image generation tools
- Use `HistoryList` + `SampleVideoPlayer` for video tools (login-dependent)
- Maintain consistent spacing and visual hierarchy
- Ensure first-screen visibility of all important UI elements

**3. Tab-Based Tools Design Pattern**

For complex tools with multiple modes (like ImageToVideoTabs, TextToVideoTabs, AIImageTabs):

**Component Interface:**
```tsx
interface TabsComponentProps {
  locale?: string; // Only locale, no title/description
}
```

**Right Panel Content Based on User State:**
```tsx
{isLoggedIn ? (
  <HistoryList feature_code={["15000XXX", "15000YYY"]} />
) : (
  <SampleVideoPlayer sampleVideoUrl="sample.mp4" />
)}
```

**Page Integration:**
```tsx
// Import TitleSection for landing page content
import TabsComponent, { TitleSection } from "@/components/tool/tabs-component";

// In landingPageContent:
{page.hero && (
  <TitleSection
    title={page.hero.title || ""}
    description={page.hero.description || ""}
  />
)}
```

#### Component Design Standards

**Visual Consistency:**
- All tool components use `bg-muted/50` for unified background
- Rounded corners with `rounded-lg`
- Proper contrast with page background in both light/dark themes
- Responsive padding: `p-4 lg:p-6` for content areas

**Layout Structure:**
- Left panel: Configuration and input controls
- Right panel: Results, history, or examples
- Fixed bottom button area for primary actions
- Proper scrolling behavior for long content

**User Experience:**
- Logged-in users see HistoryList for tracking their generations
- Non-logged-in users see SampleVideoPlayer for product demonstration
- Clear visual feedback for loading and error states
- Responsive design for mobile and desktop

### Adding New AI Tools
1. Create component in `components/tool/[tool-name]/index.tsx` following the design patterns above
2. Add corresponding API service in `services/`
3. Create page in `app/[locale]/(tools)/[tool-route]/page.tsx` using SSRPageContent pattern
4. Add i18n messages in `i18n/pages/landing/[tool-name]/`
5. Follow the layout and styling guidelines for visual consistency

### Internationalization
- Always use `useTranslations()` hook for text content
- Add new locales to `i18n/routing.ts` locales array
- Create message files for each new locale

### API Integration
- Use the central `apiService` from `services/api.ts`
- Follow the `GenerateSubmitResponse` interface pattern
- Implement proper error handling and loading states

### Content Collections
When adding markdown content:
- Place files in `content/articles/[locale]/[slug].md`
- Use the schema defined in `content-collections.ts`
- Run `npm run content` to rebuild collections