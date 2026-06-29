# apps/personal-web-admin — Admin Dashboard

**Tech:** Next.js 15, React 19, TypeScript, Turbopack

## OVERVIEW

Frontend admin dashboard for the personal account platform. Stub application with page layouts and static UI components. Uses lucide-react for icons.

## KEY FILES

| File | Role |
|------|------|
| `src/app/login/page.tsx` | Login page |
| `src/app/dashboard/page.tsx` | Main dashboard |
| `src/app/dashboard/layout.tsx` | Dashboard layout wrapper |
| `src/app/layout.tsx` | Root layout |
| `src/components/page-header.tsx` | Shared page header component |
| `next.config.ts` | Next.js configuration |

## PAGES

| Route | Purpose |
|-------|---------|
| `/login` | Authentication |
| `/dashboard` | Main view |
| `/dashboard/users` | User management |
| `/dashboard/security` | Security settings |
| `/dashboard/settings` | Account settings |
| `/dashboard/activity` | Activity log |
| `/dashboard/analytics` | Analytics |
| `/dashboard/reports` | Reports |
| `/dashboard/blog` | Blog management |
| `/dashboard/help` | Help center |
| `/dashboard/balance-sheet` | Financial data |

## STACK

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, CSS modules (`globals.css`)
- **Icons**: lucide-react
- **Dev**: `next dev --turbopack`
- **Build**: `next build`
- **Notable**: Excluded from Go build via `.build_skip` sentinel
