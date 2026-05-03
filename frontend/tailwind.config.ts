import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				title: ['Nunito', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
				body: ['Nunito', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				squircle: '28px'
			},
			boxShadow: {
				'clay-purple': 'inset 4px 4px 10px hsl(265 80% 60% / 0.45), inset -4px -4px 10px hsl(265 100% 8% / 0.6), 0 12px 32px hsl(265 100% 50% / 0.25)',
				'clay-pink': 'inset 4px 4px 10px hsl(330 90% 65% / 0.45), inset -4px -4px 10px hsl(330 100% 10% / 0.6), 0 12px 32px hsl(330 100% 55% / 0.25)',
				'clay-cyan': 'inset 4px 4px 10px hsl(190 90% 65% / 0.45), inset -4px -4px 10px hsl(210 100% 10% / 0.6), 0 12px 32px hsl(200 100% 55% / 0.25)',
				'clay-emerald': 'inset 4px 4px 10px hsl(160 80% 60% / 0.45), inset -4px -4px 10px hsl(160 100% 8% / 0.6), 0 12px 32px hsl(150 100% 50% / 0.22)',
				'clay-amber': 'inset 4px 4px 10px hsl(35 95% 65% / 0.5), inset -4px -4px 10px hsl(20 100% 10% / 0.6), 0 12px 32px hsl(28 100% 55% / 0.25)',
				'clay-indigo': 'inset 4px 4px 10px hsl(245 80% 65% / 0.45), inset -4px -4px 10px hsl(245 100% 10% / 0.6), 0 12px 32px hsl(255 100% 55% / 0.25)',
				'purple-glow': '0 0 40px hsl(265 100% 55% / 0.45), 0 0 90px hsl(265 100% 55% / 0.25)'
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
