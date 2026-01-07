# ReactorMap

Interactive 3D visualization of nuclear power plants worldwide.

**[reactormap.com](https://reactormap.com)**

![ReactorMap Preview](https://reactormap.com/opengraph-image)

## Features

- **Interactive 3D Globe** - Explore Earth with high-resolution day/night textures and dynamic cloud layers
- **800+ Nuclear Reactors** - Comprehensive database sourced from GeoNuclearData (IAEA PRIS records)
- **Real-time Status Tracking** - Monitor operational, under construction, planned, suspended, shutdown, and cancelled reactors
- **Country Filtering** - Filter reactors by country with flag indicators
- **Status Filtering** - Toggle visibility of different reactor statuses
- **Search** - Find reactors by name with keyboard shortcut support
- **Reactor Details** - View capacity, reactor type, operator, timeline, Wikipedia info, and satellite imagery links
- **Co-located Reactors** - Navigate between multiple reactors at the same site
- **Share Links** - Copy direct links to specific reactors
- **Lighting Modes** - Switch between realistic, day, and night views
- **Responsive Design** - Optimized for desktop and mobile devices
- **PWA Support** - Install as an app on your device
- **Keyboard Shortcuts** - Navigate efficiently with keyboard controls

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **3D Rendering**: [Three.js](https://threejs.org/) + [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Analytics**: [PostHog](https://posthog.com/)
- **Deployment**: [Vercel](https://vercel.com/)
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/vinvuk/reactormap.git
cd reactormap

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

Create a `.env.local` file for optional analytics:

```env
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/reactors/         # API route for reactor data
│   ├── layout.tsx            # Root layout with metadata & fonts
│   ├── page.tsx              # Main page component
│   ├── not-found.tsx         # Custom 404 page
│   ├── manifest.ts           # PWA manifest
│   ├── opengraph-image.tsx   # Dynamic OG image
│   └── globals.css           # Global styles
├── components/
│   ├── Earth.tsx             # 3D Earth globe with textures
│   ├── Scene.tsx             # Three.js scene setup & controls
│   ├── ReactorMarkers.tsx    # Reactor point markers with effects
│   ├── SearchBar.tsx         # Reactor search modal
│   ├── LoadingScreen.tsx     # Loading animation
│   ├── CookieConsent.tsx     # GDPR cookie banner
│   ├── PostHogProvider.tsx   # Analytics provider
│   └── v3/                   # UI components
│       ├── MinimalHeader.tsx # Header with stats & filters
│       ├── CompactPanel.tsx  # Reactor detail panel
│       ├── MiniControls.tsx  # Globe control buttons
│       └── InfoModal.tsx     # About/Privacy/Terms modal
├── hooks/
│   ├── useReactors.ts        # Reactor data fetching
│   └── useKeyboardShortcuts.ts
└── lib/
    └── types.ts              # TypeScript types & constants
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `/` or `⌘K` | Open search |
| `Escape` | Close panels/search |
| `?` | Show keyboard shortcuts |
| `L` | Go to my location |
| `R` | Reset globe view |
| `+` / `-` | Zoom in/out |
| `←` / `→` | Navigate operational reactors |

## Data Sources

- **Reactor Database**: [GeoNuclearData](https://github.com/cristianst85/GeoNuclearData) - compiled from IAEA PRIS and World Nuclear Association records
- **Earth Textures**: [Solar System Scope](https://www.solarsystemscope.com/textures/) (CC BY 4.0)
- **Wikipedia Data**: Enriched with Wikipedia extracts, thumbnails, and Wikidata metadata

## API

The app exposes a simple API for reactor data:

```
GET /api/reactors
```

Returns JSON array of all reactors with coordinates, status, capacity, and metadata.

## Performance

- Texture preloading for faster initial load
- Dynamic imports for Three.js (no SSR)
- Optimized marker rendering with instancing
- Lazy loading for Wikipedia images
- Edge runtime for OG image generation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Earth textures are used under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).

## Disclaimer

This application is **for informational and educational purposes only**. Reactor status information may be delayed, incomplete, or inaccurate. Always refer to official sources such as the IAEA, national nuclear regulatory authorities, or utility operators for authoritative information.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [GeoNuclearData](https://github.com/cristianst85/GeoNuclearData) for the comprehensive reactor database
- [Solar System Scope](https://www.solarsystemscope.com/) for the beautiful Earth textures
- The React Three Fiber community for excellent 3D tooling
