import { get, put, BlobPreconditionFailedError } from '@vercel/blob';

// A single conditional document is sufficient for this small demo and keeps
// bill creation, link lookup, and payment idempotency in one atomic boundary.
export function createBlobRepository({read = get, write = put, pathname = process.env.BILLING_BLOB_PATH || 'billing/v1/state.json'} = {}) {
  async function load() {
    const result = await read(pathname, {access:'private', useCache:false});
    if (!result) return null;
    if (result.statusCode !== 200 || !result.stream) throw new Error('Unable to read shared billing state.');
    const state = await new Response(result.stream).json();
    if (state.version !== 1 || !Array.isArray(state.records)) throw new Error('Invalid shared billing state. Existing data has been kept.');
    return {state, etag:result.blob.etag};
  }
  async function transact(fn) {
    for (let attempt = 0; attempt < 6; attempt++) {
      const current = await load();
      const state = current?.state || {version:1, records:[]};
      const before = JSON.stringify(state);
      const result = fn(state.records);
      const after = JSON.stringify(state);
      if (before === after) return result;
      if (Buffer.byteLength(after) > 3_000_000) throw new Error('Shared demo storage limit reached. Existing records have been kept.');
      try {
        await write(pathname, after, {access:'private', addRandomSuffix:false, contentType:'application/json', allowOverwrite:!!current, ...(current ? {ifMatch:current.etag} : {})});
        return result;
      } catch (error) {
        if (error instanceof BlobPreconditionFailedError) continue;
        // Concurrent first creation: a create-only write loses to another creator.
        if (!current && await load()) continue;
        throw error;
      }
    }
    throw new Error('Another payment updated this bill. Please refresh and try again.');
  }
  return {transact};
}
