// PostCSS config to strip @property rules for Electron compatibility
// Tailwind v4 uses @property for modern CSS features, but they can cause issues in Electron

/** @type {import('postcss').Plugin} */
const stripAtProperty = () => ({
  postcssPlugin: 'strip-at-property',
  AtRule: {
    property: (atRule) => {
      // Remove @property rules as they cause rendering issues in Electron
      atRule.remove()
    }
  }
})
stripAtProperty.postcss = true

export default {
  plugins: [
    stripAtProperty()
  ]
}
