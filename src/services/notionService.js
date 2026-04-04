/**
 * Notion API Service
 * All calls route through a user-supplied Cloudflare Worker proxy
 * so the token stays in the browser and CORS is handled server-side.
 */

const NOTION_VERSION = '2022-06-28';

export class NotionService {
  constructor(workerUrl, token) {
    // Remove trailing slash
    this.base   = workerUrl.replace(/\/$/, '');
    this.token  = token;
  }

  async _req(path, options = {}) {
    const url = `${this.base}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization':   `Bearer ${this.token}`,
        'Notion-Version':  NOTION_VERSION,
        'Content-Type':    'application/json',
        ...(options.headers || {}),
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || `Notion API error ${res.status}`);
    }
    return data;
  }

  /** Verify the token works and return the bot user */
  async testConnection() {
    return this._req('/v1/users/me');
  }

  /**
   * Search the workspace for databases (and optionally pages).
   * Returns the raw Notion search results array.
   */
  async searchDatabases(query = '') {
    const body = {
      filter: { value: 'database', property: 'object' },
      sort:   { direction: 'descending', timestamp: 'last_edited_time' },
    };
    if (query) body.query = query;
    const data = await this._req('/v1/search', {
      method: 'POST',
      body:   JSON.stringify(body),
    });
    return data.results || [];
  }

  /**
   * Query all rows of a database.
   * Handles pagination automatically (up to 200 items).
   */
  async queryDatabase(databaseId, filter = null) {
    const allResults = [];
    let cursor = undefined;

    do {
      const body = { page_size: 100 };
      if (cursor)  body.start_cursor = cursor;
      if (filter)  body.filter       = filter;

      const data = await this._req(`/v1/databases/${databaseId}/query`, {
        method: 'POST',
        body:   JSON.stringify(body),
      });

      allResults.push(...(data.results || []));
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor && allResults.length < 200);

    return allResults;
  }

  /** Retrieve the schema of a database (property definitions) */
  async getDatabase(databaseId) {
    return this._req(`/v1/databases/${databaseId}`);
  }

  /**
   * Mark a Notion page as done.
   * Tries common "status" property names automatically.
   */
  async markPageComplete(pageId, properties) {
    return this._req(`/v1/pages/${pageId}`, {
      method: 'PATCH',
      body:   JSON.stringify({ properties }),
    });
  }
}

// ── Property Helpers ─────────────────────────────────────────

/** Extract the plain-text title from a Notion page */
export function getPageTitle(page) {
  const titleProp = Object.values(page.properties || {}).find(
    p => p.type === 'title'
  );
  if (!titleProp) return '(Untitled)';
  return titleProp.title?.map(t => t.plain_text).join('') || '(Untitled)';
}

/** Extract a text/rich_text value */
export function getRichText(prop) {
  if (!prop) return '';
  const arr = prop.rich_text || prop.text || [];
  return arr.map(t => t.plain_text).join('');
}

/** Extract a date string from a date property */
export function getDate(prop) {
  return prop?.date?.start || null;
}

/** Extract a select value */
export function getSelect(prop) {
  return prop?.select?.name || null;
}

/** Extract a status value */
export function getStatus(prop) {
  return prop?.status?.name || null;
}

/** Extract a checkbox value */
export function getCheckbox(prop) {
  return prop?.checkbox ?? false;
}

/**
 * Try to detect which property holds "completion" state.
 * Returns { propName, type } or null.
 */
export function detectStatusProperty(database) {
  const props = database.properties || {};
  const candidates = ['Status', 'Done', 'Complete', 'Completed', 'State', 'Progress'];

  for (const name of candidates) {
    if (props[name]) return { propName: name, type: props[name].type };
  }

  // Fallback: first checkbox or status property
  for (const [name, prop] of Object.entries(props)) {
    if (prop.type === 'checkbox' || prop.type === 'status') {
      return { propName: name, type: prop.type };
    }
  }
  return null;
}

/**
 * Build the Notion PATCH body to mark a page complete,
 * based on the detected status property type.
 */
export function buildCompletePayload(propName, propType, database) {
  if (propType === 'checkbox') {
    return { [propName]: { checkbox: true } };
  }
  if (propType === 'status') {
    // Find a "done" option in the schema
    const options = database.properties?.[propName]?.status?.options || [];
    const doneOption = options.find(o =>
      /done|complete|finished|closed/i.test(o.name)
    );
    if (doneOption) return { [propName]: { status: { name: doneOption.name } } };
  }
  if (propType === 'select') {
    const options = database.properties?.[propName]?.select?.options || [];
    const doneOption = options.find(o =>
      /done|complete|finished|closed/i.test(o.name)
    );
    if (doneOption) return { [propName]: { select: { name: doneOption.name } } };
  }
  return null;
}

// ── The Cloudflare Worker script users should deploy ─────────
export const WORKER_SCRIPT = `/**
 * Life Gamified — Notion Proxy Worker
 * Deploy this at: https://workers.cloudflare.com/
 * Free tier: 100,000 requests/day — plenty for personal use.
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Notion-Version',
};

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url     = new URL(request.url);
  const target  = 'https://api.notion.com' + url.pathname + url.search;

  const notionRes = await fetch(target, {
    method:  request.method,
    headers: {
      'Authorization':  request.headers.get('Authorization') || '',
      'Notion-Version': '2022-06-28',
      'Content-Type':   'application/json',
    },
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  });

  const body = await notionRes.text();
  return new Response(body, {
    status:  notionRes.status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}`;
