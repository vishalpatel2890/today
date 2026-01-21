/**
 * TypeScript declarations for direct lucide-react icon imports
 * This enables tree-shaking by importing icons directly from their ESM modules
 * instead of using the barrel file (which loads all 1500+ icons)
 *
 * Performance impact: ~200-800ms cold start improvement
 * Reference: react-best-practices/bundle-barrel-imports
 */
declare module 'lucide-react/dist/esm/icons/*' {
  import { LucideIcon } from 'lucide-react'
  const icon: LucideIcon
  export default icon
}
