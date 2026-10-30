// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://docs.authkestra.com',

	integrations: [
		starlight({
			title: 'Authkestra',
			/*
			  The mark sits beside the title rather than replacing it: at the 24px
			  Starlight renders it, an A on its own is not a name. `replacesTitle`
			  would also drop the only text label in the header.

			  It is the explicit-ink copy, not the `currentColor` one: Starlight
			  emits the logo as an `<img>`, and `currentColor` inside an `<img>`
			  resolves to black — which on this ground is an invisible mark.
			*/
			logo: { src: './src/assets/logo.svg' },
			head: [
				{ tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/marcjazz/authkestra' }],
			components: {
				PageTitle: './src/components/PageTitle.astro',
				Hero: './src/components/Hero.astro',
				SocialIcons: './src/components/SocialIcons.astro',
			},
			customCss: [
				'./src/styles/custom.css',
			],
			sidebar: [
				{
					label: 'Overview',
					items: [
						{ label: 'Introduction', link: '/' },
						{ label: 'Why Authkestra?', slug: 'concepts/architecture' },
						{ label: 'Typestate Builder Pattern', slug: 'concepts/typestate-builder' },
					],
				},
				{
					label: 'Getting Started',
					items: [
						{ label: 'Quickstart', slug: 'guides/quickstart' },
						{ label: 'Framework Integration', slug: 'guides/framework-integration' },
						{ label: 'Wired Endpoints', slug: 'guides/wired-endpoints' },
						{ label: 'AI Agents & MCP', slug: 'guides/ai-agents', badge: { text: 'New', variant: 'tip' } },
					],
				},
				{
					label: 'Authentication Methods',
					items: [
						{ label: 'Stateless OAuth2', slug: 'providers/oauth2' },
						{ label: 'OIDC Provider (Client)', slug: 'providers/oidc' },
						{ label: 'Passkeys (WebAuthn)', slug: 'providers/passkeys' },
						{ label: 'TOTP (Authenticator Apps)', slug: 'providers/totp' },
						{ label: 'Magic Link', slug: 'providers/magic-link' },
						{ label: 'Email/SMS One-Time Codes', slug: 'providers/otp' },
						{ label: 'Recovery Codes', slug: 'providers/recovery-codes' },
						{ label: 'Client Credentials', slug: 'providers/client-credentials' },
						{ label: 'Device Flow', slug: 'providers/device-flow' },
					],
				},
				{
					label: 'Security & Attestation',
					items: [
						{ label: 'Device Signatures', slug: 'providers/device-signatures' },
						{ label: 'Device Attestation', slug: 'guides/device-attestation' },
						{ label: 'Bot Protection (CAPTCHA)', slug: 'providers/bot-protection' },
					],
				},
				{
					label: 'Building Servers',
					items: [
						{ label: 'Resource Server (API)', slug: 'advanced/resource-server' },
						{ label: 'OpenID Provider (OP)', slug: 'advanced/op-server' },
					],
				},
				{
					label: 'Authorization & Continuous Trust',
					items: [
						{ label: 'Policy Engine (Cedar)', slug: 'advanced/policy-engine' },
						{ label: 'Continuous Access Evaluation', slug: 'advanced/continuous-access-evaluation' },
					],
				},
				{
					label: 'Data & Storage',
					items: [
						{ label: 'Storage Overview', slug: 'storage/overview' },
						{ label: 'KV Stores', slug: 'storage/kv-store' },
						{ label: 'OP SQL Store', slug: 'storage/sql-store' },
						{ label: 'Implementing Custom Stores', slug: 'storage/implementing-stores' },
					],
				},
				{
					label: 'Observability',
					items: [
						{ label: 'Instrumentation & Tracing', slug: 'advanced/instrumentation' },
					],
				},
			],
		}),
	],
});
