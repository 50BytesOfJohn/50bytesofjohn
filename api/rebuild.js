/**
 * Triggers a production rebuild so the build-time GitHub contribution graph stays
 * fresh. Invoked by the Vercel cron in vercel.json; the site itself is fully static,
 * this is the only function in the project.
 *
 * Env: CRON_SECRET (Vercel sends it as a bearer token on cron invocations),
 *      DEPLOY_HOOK_URL (the project's own deploy hook, main branch).
 */
export default async function handler(req, res) {
	if (req.method !== 'GET') {
		return res.status(405).json({ error: 'Method not allowed' });
	}

	// Without this the endpoint is a public "rebuild my site" button.
	const secret = process.env.CRON_SECRET;
	if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
		return res.status(401).json({ error: 'Unauthorized' });
	}

	const hook = process.env.DEPLOY_HOOK_URL;
	if (!hook) {
		return res.status(500).json({ error: 'DEPLOY_HOOK_URL is not set' });
	}

	const hookRes = await fetch(hook, { method: 'POST' });
	if (!hookRes.ok) {
		return res.status(502).json({ error: `Deploy hook returned ${hookRes.status}` });
	}

	return res.status(200).json({ triggered: true });
}
