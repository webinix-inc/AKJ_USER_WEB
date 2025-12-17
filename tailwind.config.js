module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // Apple-inspired color palette
      colors: {
        // Primary Apple Blues
        'apple-blue': {
          50: '#f0f9ff',
          100: '#e0f2fe', 
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Main Apple Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Apple Grays (System colors)
        'apple-gray': {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        // Apple System Colors
        'apple-red': '#ff3b30',
        'apple-orange': '#ff9500',
        'apple-yellow': '#ffcc00',
        'apple-green': '#34c759',
        'apple-mint': '#00c7be',
        'apple-teal': '#30b0c7',
        'apple-cyan': '#32d74b',
        'apple-indigo': '#5856d6',
        'apple-purple': '#af52de',
        'apple-pink': '#ff2d92',
        'apple-brown': '#a2845e',
        
        // Custom brand colors (keeping existing brand identity)
        'brand-primary': '#023d50',
        'brand-secondary': '#0086b2',
        'brand-accent': '#fc9721',
        'brand-accent-light': '#ff953a',
        
        // Surface colors
        'surface': {
          50: '#ffffff',
          100: '#f8fafc',
          200: '#f1f5f9',
          300: '#e2e8f0',
          400: '#cbd5e1',
          500: '#94a3b8',
        }
      },
      
      // Apple-inspired typography
      fontFamily: {
        'apple': ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        'apple-mono': ['SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'source-code-pro', 'Menlo', 'Consolas', 'monospace'],
      },
      
      // Apple-inspired spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      // Apple-inspired border radius
      borderRadius: {
        'apple': '12px',
        'apple-lg': '16px',
        'apple-xl': '20px',
        'apple-2xl': '24px',
      },
      
      // Apple-inspired shadows
      boxShadow: {
        'apple-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'apple': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'apple-md': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'apple-lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'apple-xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'apple-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      },
      
      // Apple-inspired animations
      animation: {
        'apple-bounce': 'bounce 1s infinite',
        'apple-pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'apple-ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'apple-spin': 'spin 1s linear infinite',
      },
      
      // Apple-inspired transitions
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'apple-in': 'cubic-bezier(0, 0, 0.2, 1)',
        'apple-out': 'cubic-bezier(0.4, 0, 1, 1)',
        'apple-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
