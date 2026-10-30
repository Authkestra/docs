import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const PAGE_ORDER = [
	'index',
	'concepts/architecture',
	'concepts/typestate-builder',
	'guides/quickstart',
	'guides/framework-integration',
	'guides/wired-endpoints',
	'guides/ai-agents',
	'providers/oauth2',
	'providers/oidc',
	'providers/client-credentials',
	'providers/device-flow',
	'providers/passkeys',
	'providers/totp',
	'providers/magic-link',
	'providers/otp',
	'providers/recovery-codes',
	'providers/bot-protection',
	'providers/device-signatures',
	'advanced/resource-server',
	'advanced/op-server',
	'guides/device-attestation',
	'advanced/policy-engine',
	'advanced/continuous-access-evaluation',
	'advanced/instrumentation',
	'storage/overview',
	'storage/kv-store',
	'storage/sql-store',
	'storage/implementing-stores',
];

function cleanMdxBody(raw: string): string {
	return raw
		.replace(/^import\s+.*?;?\s*$/gm, '')
		.replace(/<\/?(?:Tabs|CardGrid)\b[^>]*>/g, '')
		.replace(/<TabItem\s+label="([^"]+)"[^>]*>/g, '\n#### $1\n')
		.replace(/<\/TabItem>/g, '')
		.replace(
			/<LinkCard\s+title="([^"]+)"\s+description="([^"]+)"\s+href="([^"]+)"\s*\/>/g,
			'- [$1](https://docs.authkestra.com$3): $2',
		)
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export const GET: APIRoute = async () => {
	const docs = await getCollection('docs');
	const byId = new Map(docs.map((doc) => [doc.id.replace(/\.(mdx?|md)$/, ''), doc]));

	const orderedIds = [
		...PAGE_ORDER.filter((id) => byId.has(id)),
		...Array.from(byId.keys())
			.filter((id) => !PAGE_ORDER.includes(id))
			.sort(),
	];

	const sections: string[] = [
		'# Authkestra -  Complete Documentation Corpus (v0.13)',
		'',
		'> Source: https://docs.authkestra.com | Index: https://docs.authkestra.com/llms.txt | Crate: https://crates.io/crates/authkestra | Skills: https://github.com/Authkestra/skills',
		'',
	];

	for (const id of orderedIds) {
		const doc = byId.get(id);
		if (!doc) continue;
		const url =
			id === 'index' ? 'https://docs.authkestra.com/' : `https://docs.authkestra.com/${id}/`;
		sections.push('---');
		sections.push('');
		sections.push(`# ${doc.data.title}`);
		if (doc.data.description) {
			sections.push(`> ${doc.data.description}`);
		}
		sections.push(`URL: ${url}`);
		sections.push('');
		sections.push(cleanMdxBody(doc.body ?? ''));
		sections.push('');
	}

	return new Response(sections.join('\n'), {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
		},
	});
};
