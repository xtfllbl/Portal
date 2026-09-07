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
// Publish email HTML and image assets without renderer source or fixture JSON.
const emailDirectory = '邮件模版html/邮件模版html';
await mkdir(resolve(output, emailDirectory), {recursive:true});
for (const entry of await readdir(emailDirectory)) {
  if (/\.(html|css|png|jpe?g|svg|webp|gif|ico)$/i.test(entry)) {
    await cp(resolve(emailDirectory, entry), resolve(output, emailDirectory, entry));
  }
}
console.log('Static pages built in dist/. Billing API deploys separately as a Vercel Function.');
