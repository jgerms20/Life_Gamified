// Regenerates docs/AGENT_API.md from the guide the Edge Function serves.
import { writeFileSync } from 'node:fs';
import { AGENT_GUIDE } from '../supabase/functions/_shared/agent-docs.js';

writeFileSync(new URL('../docs/AGENT_API.md', import.meta.url), `<!-- Generated from supabase/functions/_shared/agent-docs.js — run \`npm run docs\`. -->\n\n${AGENT_GUIDE}`);
console.log('docs/AGENT_API.md updated');
