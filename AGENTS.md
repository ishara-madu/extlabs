## Package Manager

Always use `pnpm` for managing dependencies and executing commands/scripts:
- Install packages: `pnpm install` / `pnpm add <package>`
- Run scripts/commands: `pnpm <command>` (e.g. `pnpm astro ...`, `pnpm dev`, `pnpm build`)

## Development

When starting the dev server, use background mode:

```
pnpm astro dev --background
```

Manage the background server with `pnpm astro dev stop`, `pnpm astro dev status`, and `pnpm astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## UI Component Libraries & Design Resources Guide (Framework-Free & Minimalist)

> [!IMPORTANT]
> **Strict UI & Minimalist Design Policy**:
> - **Framework-Free / Vanilla First**: Do NOT use or install JS UI frameworks (e.g., Framer Motion, GSAP, Alpine.js, React). Build all UI using native HTML/Astro templates, Tailwind CSS, and Vanilla CSS.
> - **Minimalist Aesthetics (No Bloated Motion/Animations)**: Keep the design clean, elegant, minimal, and content-focused. Strictly forbid animations, motion effects, particle systems, or complex transitions. Prefer instant, static, crisp interactions, generous whitespace, subtle borders, and modern typography.
> - **Cards Policy (Essential-Only)**: Use cards ONLY for essential container elements (e.g. product listing cards on shelves/directories, cohesive specification sidebars). Strictly avoid "card fatigue" — keep content sections (headers, overviews, features, workflows, FAQs) open, seamless, and typographic with subtle dividers and generous whitespace.
> - **Section Headers Policy (No Floating Right-Side Badges/Tags)**: Strictly forbid placing metadata pills, badges, or decorative tags (e.g. `Workflow`, `Architecture`, `100% Payout`, `Verified`, etc.) on the right side of section header bars. Section headers must remain clean, natural, and typographic (`<h2>` with optional brief subtitle `<p>` below, without floating right-side tags).
> - **No Pill Badges with Borders/Backgrounds around Text Policy**: Strictly forbid surrounding text with colored backgrounds and borders (e.g., `bg-emerald-50 border border-emerald-200`, `bg-amber-50 border ...`, rounded pill boxes around metadata labels like `100% Live`, `4 Submissions`, `Verified`, `Pending`, etc.). If color emphasis is needed, **color only the text itself** (e.g., `<span class="text-emerald-600 font-semibold">100% Live</span>`), with an optional minimal dot (`<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>`). Strictly avoid boxing text inside colored, bordered pills.
> - **Icons Policy (Lucide Icons Only)**: Exclusively use **Lucide Icons** (`lucide-astro` or native Lucide SVGs) across the entire application for clean, modern, and unified iconography.
> - **Disregard default/generic AI styling patterns**: Do NOT rely on default habits, generic purple/blue gradient backgrounds, bland cookie-cutter cards, or cluttered layouts.
> - **Exclusive Component Resources**: Strictly use and reference ONLY the following component libraries when designing and building UI:

| Resource | Focus & Key Features | Primary Use Cases | Tech Stack |
| :--- | :--- | :--- | :--- |
| **[HyperUI](https://hyperui.dev/components/application/)** | Free, open-source Tailwind CSS components (Application UI, Marketing UI, eCommerce) | Clean application UI, dashboards, navigation, cards, inputs, stats, sidebars | HTML / Tailwind CSS |
| **[daisyUI](https://daisyui.com/components/)** | Clean, semantic Tailwind CSS components and utility patterns | Component primitives, buttons, badges, modals, tables, toggles, alerts | HTML / Tailwind CSS |
| **[Lucide Icons](https://lucide.dev/)** | Beautiful & consistent open-source icon suite | Universal iconography across all UI elements, buttons, and navigation | SVG / `lucide-astro` |

### Scenario-Based Selection Guide:
- **Application & Dashboard UI / Marketing Sections**: Use **[HyperUI](https://hyperui.dev/components/application/)** for clean, copy-paste HTML + Tailwind application components, sidebars, data tables, stats, and form controls.
- **Component Primitives & Layout Elements**: Use **[daisyUI](https://daisyui.com/components/)** for clean semantic structures, button variations, badges, alerts, and navigation bars.
- **Icons**: Use **[Lucide Icons](https://lucide.dev/)** exclusively for all UI symbols.
- **Styling & Layout**: Prioritize crisp typography, subtle neutral borders, structured grids, and plenty of breathing room (whitespace) with zero motion.

## Database Queries & Data Access Architecture (Repository Pattern)

> [!IMPORTANT]
> **Strict Database Query & Reusability Policy**:
> - **Dedicated Queries Directory (`src/lib/queries/`)**: All Cloudflare D1 SQL queries MUST reside in `src/lib/queries/` (e.g., `developers.ts`, `extensions.ts`, `settings.ts`). Re-export them from `src/lib/queries/index.ts` and `src/lib/db.ts`.
> - **Always Check Existing Queries First**: Before writing any new query, always inspect `src/lib/queries/` to verify if a relevant query already exists.
> - **Reuse or Safely Extend**: If an existing query satisfies the requirement or can be safely modified/extended with optional parameters without breaking existing callers, reuse or extend it.
> - **Strictly No Raw SQL in Astro Pages or Components**: Strictly forbid writing raw inline `db.prepare(...)` SQL queries inside `.astro` pages, layouts, or UI components. Always extract queries into typed helper functions in `src/lib/queries/` and import them.


