# 🎨 BeforeSpend — Official Brand & Design System Guidelines

Instruction for AI Agent: Always enforce these design system rules, color tokens, typography, and styling guidelines when generating UI components, CSS/Tailwind configurations, or landing page code for the BeforeSpend platform.

## 1. Brand Overview & Strategy
- **Brand Name**: BeforeSpend
- **Wordmark Rule**: Case-sensitive. Written as **Before** (Primary Navy `#0E2A47`) and **Spend** (Ocean Teal `#00A896`).
- **Tagline**: Plan. Allocate. Protect.
- **Core Value Proposition**: Proactive cash flow management, percentage-based income splitting, and budget protection before spending occurs.
- **Target Audience**: Freelancers, solopreneurs, digital contractors, and micro-business owners.

## 2. Color System & Design Tokens

### Primary Brand Colors
| Token Name | Color Description | HEX Code | RGB | Primary Usage |
| :--- | :--- | :--- | :--- | :--- |
| `color-primary` | Deep Slate Navy | `#0E2A47` | `rgb(14, 42, 71)` | "Before" text, primary headers, dark buttons, outer logo stroke |
| `color-secondary` | Ocean Teal / Mint | `#00A896` | `rgb(0, 168, 150)` | "Spend" text, active states, key accents, coins icon, mobile app icon bg |
| `color-bg-main` | Soft Canvas Off-White | `#F8F9F5` | `rgb(248, 249, 245)` | Default light mode page background |
| `color-card-bg` | Pure White | `#FFFFFF` | `rgb(255, 255, 255)` | Dashboard cards, modals, table backgrounds |

### Functional & UI State Colors
- **Success / Safe Bucket**: `#10B981` (Positive balances, completed goals, allocated funds)
- **Warning / Near Limit**: `#F59E0B` (Bucket approaching depletion < 15%)
- **Danger / Overspent**: `#EF4444` (Unallocated deficits, error alerts, overdrawn buckets)
- **Muted Text / Border**: `#64748B` (Subtitles, helper text, card borders)

## 3. Typography Hierarchy
- **Headings & Display**: Plus Jakarta Sans or Montserrat (Fallback: sans-serif)
- **Body & UI Text**: Inter or Plus Jakarta Sans (Fallback: system-ui)

### Type Scale Rules
- **Page Title (H1)**: `text-3xl` to `text-4xl`, Bold (`font-bold`), Text Color: `#0E2A47`
- **Section Header (H2)**: `text-2xl`, Semi-Bold (`font-semibold`), Text Color: `#0E2A47`
- **Card Titles / Subheaders**: `text-lg` or `text-xl`, Medium (`font-medium`)
- **Body Copy**: `text-base` or `text-sm`, Regular (`font-normal`), Text Color: `#64748B` (secondary) or `#0E2A47` (primary)
- **Tagline Display**: `text-xs` or `text-sm`, Tracking: `tracking-wider`, Title Case, Centered or Left-aligned under logo ("Plan. Allocate. Protect.")

## 4. Logo & Favicon Guidelines
### Horizontal Logo Composition
- **Icon**: Intertwined monoline 'B'/'P' with stacked coins in the lower loop.
- **Wordmark**: <span style="color:#0E2A47;font-weight:bold;">Before</span><span style="color:#00A896;font-weight:bold;">Spend</span>
- **Tagline**: Plan. Allocate. Protect. (placed small directly underneath the wordmark text)

## 5. UI Component & Layout Styling Standards
- **Primary Buttons**: `bg-[#0E2A47] hover:bg-[#00A896] text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md`
- **Secondary / Outline Buttons**: `border-2 border-[#0E2A47] text-[#0E2A47] hover:bg-[#0E2A47] hover:text-white font-semibold py-3 px-6 rounded-xl transition-all`
- **Dashboard Cards**: `bg-white rounded-[20px] p-6 border border-[#0E2A47]/10 shadow-soft hover:shadow-card-hover transition-all`
