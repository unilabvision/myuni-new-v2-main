export const TARGET_DEFINITIONS = {
  identity: {
    urlKey: 'NEXT_PUBLIC_SUPABASE_IDENTITY_URL',
    keyKey: 'SUPABASE_IDENTITY_SECRET_KEY',
  },
  learning: {
    urlKey: 'NEXT_PUBLIC_SUPABASE_LEARNING_URL',
    keyKey: 'SUPABASE_LEARNING_SECRET_KEY',
  },
  forms: {
    urlKey: 'NEXT_PUBLIC_SUPABASE_FORMS_URL',
    keyKey: 'SUPABASE_FORMS_SECRET_KEY',
  },
};

export function parseCliArgs(argv = process.argv.slice(2)) {
  const args = {};
  for (const item of argv) {
    if (!item.startsWith('--')) continue;
    const separator = item.indexOf('=');
    if (separator === -1) args[item.slice(2)] = true;
    else args[item.slice(2, separator)] = item.slice(separator + 1);
  }
  return args;
}

export function getTargets(value = 'identity,learning,forms') {
  const names = String(value)
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  return names.map((name) => {
    const definition = TARGET_DEFINITIONS[name];
    if (!definition) throw new Error(`Unknown Supabase target: ${name}`);
    const url = process.env[definition.urlKey];
    const key = process.env[definition.keyKey];
    if (!url || !key) {
      throw new Error(
        `Missing ${definition.urlKey} or ${definition.keyKey} for ${name}`,
      );
    }
    return { name, url: url.replace(/\/$/, ''), key };
  });
}

export function authHeaders(target, extra = {}) {
  return {
    apikey: target.key,
    Authorization: `Bearer ${target.key}`,
    ...extra,
  };
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
}
