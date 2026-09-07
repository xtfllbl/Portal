import { readdir, mkdir, cp, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve('dist');
await rm(output, {recursive:true, force:true});
await mkdir(output, {recursive:true});
for (const entry of await readdir('.')) {
  if (/\.(html|css|png|jpe?g|svg|webp|gif|ico|woff2?|ttf)$/i.test(entry) || entry === 'processor-parameter-data.js' || ['assets','styles','scripts'].includes(entry)) {
    await cp(entry, resolve(output, entry), {recursive:true, filter:source=>!source.endsWith('.mjs')});
  }
}
console.log('Static pages built in dist/. Billing API deploys separately as a Vercel Function.');
