import { useState } from 'react'
import { OtpInput } from './OtpInput'

/**
 * TokenShowcase - Temporary component for visual verification of design tokens
 * This component displays all design tokens from the Slate Sophisticated theme
 * for manual verification during development.
 *
 * Remove this component after Story 1.2 validation is complete.
 */

type ColorSwatchProps = {
  name: string
  cssVar: string
  hex: string
  className: string
}

const ColorSwatch = ({ name, cssVar, hex, className }: ColorSwatchProps) => (
  <div className="flex items-center gap-3 py-2">
    <div className={`w-12 h-12 rounded-lg border border-border ${className}`} />
    <div>
      <p className="font-body text-sm font-medium text-foreground">{name}</p>
      <p className="font-mono text-xs text-muted-foreground">
        {cssVar} / {hex}
      </p>
    </div>
  </div>
)

type TypographySampleProps = {
  name: string
  fontClass: string
  description: string
}

const TypographySample = ({ name, fontClass, description }: TypographySampleProps) => (
  <div className="py-3 border-b border-border-subtle last:border-b-0">
    <p className={`text-xl ${fontClass} text-foreground`}>{name}</p>
    <p className="font-mono text-xs text-muted-foreground mt-1">{description}</p>
  </div>
)

type SpacingSampleProps = {
  name: string
  size: string
  pixels: string
}

const SpacingSample = ({ name, size, pixels }: SpacingSampleProps) => (
  <div className="flex items-center gap-4 py-2">
    <div className="w-20 text-sm font-mono text-muted-foreground">{name}</div>
    <div
      className="h-4 bg-primary rounded"
      style={{ width: pixels }}
    />
    <div className="text-xs font-mono text-tertiary">{size} / {pixels}</div>
  </div>
)

export const TokenShowcase = () => {
  // OtpInput demo state
  const [otpValue, setOtpValue] = useState('')
  const [otpComplete, setOtpComplete] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)
  const [showDisabled, setShowDisabled] = useState(false)

  return (
    <div className="p-8 bg-background min-h-screen">
      <h1 className="font-display text-3xl font-semibold text-foreground mb-8">
        Design Token Showcase
      </h1>
      <p className="font-body text-muted-foreground mb-8">
        Slate Sophisticated Theme - Visual verification for Story 1.2
      </p>

      {/* OTP Input Demo Section - Story 8.1 */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-medium text-foreground mb-4 pb-2 border-b border-border">
          OTP Input Component (Story 8.1)
        </h2>

        <div className="bg-surface p-6 rounded-lg shadow-sm space-y-6">
          <div>
            <h3 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Interactive Demo
            </h3>
            <OtpInput
              value={otpValue}
              onChange={setOtpValue}
              onComplete={(code) => {
                setOtpComplete(code)
                console.log('[Today] OTP Complete:', code)
              }}
              error={showError}
              disabled={showDisabled}
            />
            <div className="mt-4 text-center space-y-2">
              <p className="font-mono text-sm text-muted-foreground">
                Value: "{otpValue}" {otpComplete && `| Complete: "${otpComplete}"`}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => { setOtpValue(''); setOtpComplete(null) }}
                  className="px-3 py-1 text-sm bg-surface-muted rounded border border-border hover:bg-border transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowError(!showError)}
                  className={`px-3 py-1 text-sm rounded border transition-colors ${
                    showError ? 'bg-error text-white border-error' : 'bg-surface-muted border-border hover:bg-border'
                  }`}
                >
                  Error: {showError ? 'ON' : 'OFF'}
                </button>
                <button
                  onClick={() => setShowDisabled(!showDisabled)}
                  className={`px-3 py-1 text-sm rounded border transition-colors ${
                    showDisabled ? 'bg-primary text-white border-primary' : 'bg-surface-muted border-border hover:bg-border'
                  }`}
                >
                  Disabled: {showDisabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <h3 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Test Checklist
            </h3>
            <ul className="font-mono text-xs text-muted-foreground space-y-1">
              <li>✓ AC1.1: 6 individual digit boxes rendered</li>
              <li>✓ AC1.2: First box auto-focuses on mount</li>
              <li>✓ AC1.3: Type digit → focus advances</li>
              <li>✓ AC1.4: Paste "123456" → fills all boxes</li>
              <li>✓ AC1.5: onComplete fires at 6 digits</li>
              <li>✓ AC1.6: Toggle Error → red borders</li>
              <li>✓ AC1.7: Toggle Disabled → reduced opacity</li>
              <li>✓ AC1.8: Backspace → moves focus back</li>
              <li>✓ AC1.9: Type "abc" → nothing happens</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Color Tokens Section */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-medium text-foreground mb-4 pb-2 border-b border-border">
          Color Tokens
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Base Colors */}
          <div className="bg-surface p-4 rounded-lg shadow-sm">
            <h3 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Base
            </h3>
            <ColorSwatch name="Background" cssVar="--background" hex="#f8fafc" className="bg-background" />
            <ColorSwatch name="Surface" cssVar="--surface" hex="#ffffff" className="bg-surface" />
            <ColorSwatch name="Surface Muted" cssVar="--surface-muted" hex="#f1f5f9" className="bg-surface-muted" />
          </div>

          {/* Border Colors */}
          <div className="bg-surface p-4 rounded-lg shadow-sm">
            <h3 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Borders
            </h3>
            <ColorSwatch name="Border" cssVar="--border" hex="#e2e8f0" className="bg-border" />
            <ColorSwatch name="Border Subtle" cssVar="--border-subtle" hex="#f1f5f9" className="bg-border-subtle" />
          </div>

          {/* Text Colors */}
          <div className="bg-surface p-4 rounded-lg shadow-sm">
            <h3 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Text
            </h3>
            <ColorSwatch name="Foreground" cssVar="--foreground" hex="#0f172a" className="bg-foreground" />
            <ColorSwatch name="Muted Foreground" cssVar="--muted-foreground" hex="#64748b" className="bg-muted-foreground" />
            <ColorSwatch name="Tertiary" cssVar="--tertiary" hex="#94a3b8" className="bg-tertiary" />
          </div>

          {/* Interactive Colors */}
          <div className="bg-surface p-4 rounded-lg shadow-sm">
            <h3 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Interactive
            </h3>
            <ColorSwatch name="Primary" cssVar="--primary" hex="#475569" className="bg-primary" />
            <ColorSwatch name="Primary Hover" cssVar="--primary-hover" hex="#334155" className="bg-primary-hover" />
            <ColorSwatch name="Accent" cssVar="--accent" hex="#0f172a" className="bg-accent" />
          </div>

          {/* Semantic Colors */}
          <div className="bg-surface p-4 rounded-lg shadow-sm">
            <h3 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Semantic
            </h3>
            <ColorSwatch name="Success" cssVar="--success" hex="#22c55e" className="bg-success" />
            <ColorSwatch name="Success BG" cssVar="--success-bg" hex="#f0fdf4" className="bg-success-bg" />
            <ColorSwatch name="Error" cssVar="--error" hex="#ef4444" className="bg-error" />
            <ColorSwatch name="Error BG" cssVar="--error-bg" hex="#fef2f2" className="bg-error-bg" />
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-medium text-foreground mb-4 pb-2 border-b border-border">
          Typography
        </h2>

        <div className="bg-surface p-6 rounded-lg shadow-sm">
          <TypographySample
            name="Playfair Display - The quick brown fox"
            fontClass="font-display"
            description="font-display: 'Playfair Display', Georgia, serif"
          />
          <TypographySample
            name="DM Sans - The quick brown fox jumps over the lazy dog"
            fontClass="font-body"
            description="font-body: 'DM Sans', system-ui, sans-serif"
          />
          <TypographySample
            name="JetBrains Mono - const x = 42;"
            fontClass="font-mono"
            description="font-mono: 'JetBrains Mono', monospace"
          />
        </div>
      </section>

      {/* Spacing Section */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-medium text-foreground mb-4 pb-2 border-b border-border">
          Spacing Scale (8px base)
        </h2>

        <div className="bg-surface p-6 rounded-lg shadow-sm">
          <SpacingSample name="space-1" size="0.25rem" pixels="4px" />
          <SpacingSample name="space-2" size="0.5rem" pixels="8px" />
          <SpacingSample name="space-3" size="0.75rem" pixels="12px" />
          <SpacingSample name="space-4" size="1rem" pixels="16px" />
          <SpacingSample name="space-6" size="1.5rem" pixels="24px" />
          <SpacingSample name="space-8" size="2rem" pixels="32px" />
          <SpacingSample name="space-12" size="3rem" pixels="48px" />
        </div>
      </section>

      {/* Shadows & Radius Section */}
      <section className="mb-12">
        <h2 className="font-display text-xl font-medium text-foreground mb-4 pb-2 border-b border-border">
          Shadows & Border Radius
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shadows */}
          <div className="bg-surface p-6 rounded-lg shadow-sm">
            <h3 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Shadows
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-background rounded-lg shadow-sm">
                <p className="font-mono text-xs text-muted-foreground">shadow-sm</p>
              </div>
              <div className="p-4 bg-background rounded-lg shadow">
                <p className="font-mono text-xs text-muted-foreground">shadow (default)</p>
              </div>
              <div className="p-4 bg-background rounded-lg shadow-lg">
                <p className="font-mono text-xs text-muted-foreground">shadow-lg</p>
              </div>
            </div>
          </div>

          {/* Border Radius */}
          <div className="bg-surface p-6 rounded-lg shadow-sm">
            <h3 className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Border Radius
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="w-16 h-16 bg-primary rounded-sm flex items-center justify-center">
                <span className="font-mono text-[10px] text-surface">sm</span>
              </div>
              <div className="w-16 h-16 bg-primary rounded flex items-center justify-center">
                <span className="font-mono text-[10px] text-surface">default</span>
              </div>
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                <span className="font-mono text-[10px] text-surface">lg</span>
              </div>
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                <span className="font-mono text-[10px] text-surface">xl</span>
              </div>
            </div>
            <div className="mt-4 font-mono text-xs text-muted-foreground">
              <p>radius-sm: 4px | radius: 6px | radius-lg: 8px | radius-xl: 12px</p>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Checklist */}
      <section className="bg-surface-muted p-6 rounded-lg border border-border">
        <h2 className="font-display text-xl font-medium text-foreground mb-4">
          Verification Checklist
        </h2>
        <ul className="space-y-2 font-body text-sm text-foreground">
          <li>AC-1.2.1: Custom Tailwind classes apply correct colors (bg-background, bg-surface, text-foreground, etc.)</li>
          <li>AC-1.2.2: Background = #f8fafc, Surface = #ffffff, Border = #e2e8f0</li>
          <li>AC-1.2.3: font-display = Playfair Display, font-body = DM Sans, font-mono = JetBrains Mono</li>
          <li>AC-1.2.4: Spacing follows 8px base (space-2 = 8px, space-4 = 16px)</li>
          <li>AC-1.2.5: Check Network tab for Google Font woff2 files</li>
        </ul>
      </section>
    </div>
  )
}
