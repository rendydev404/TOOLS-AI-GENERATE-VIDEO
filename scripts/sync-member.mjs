import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const targetRoot = path.resolve(
  process.argv[2] || process.env.MEMBER_APP_DIR || 'D:\\PROJECT-WEB-SS\\PANDUAN-PRODUK-DIGITAL'
);

if (!fs.existsSync(path.join(targetRoot, 'server.js'))) {
  console.error(`Target Member Area directory not found or missing server.js: ${targetRoot}`);
  process.exit(1);
}

const outClientDir = path.join(targetRoot, 'studioflow-dist');
const outCoreFile = path.join(targetRoot, 'lib', 'studioflow-core.cjs');

console.log(`1/3 Typechecking StudioFlow...`);
execSync('npx tsc --noEmit', { stdio: 'inherit' });

console.log(`2/3 Building StudioFlow client for /member/studioflow/ -> ${outClientDir}`);
execSync('npx vite build', {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_BASE_PATH: '/member/studioflow/',
    VITE_API_BASE: '/api/member/studioflow',
    VITE_OUT_DIR: outClientDir,
  },
});

console.log(`3/3 Bundling StudioFlow Director core (CJS) -> ${outCoreFile}`);
const entryTmp = path.resolve('shared', '.core-entry.tmp.ts');
fs.writeFileSync(
  entryTmp,
  `export * from './director';\nexport * from './templates';\n`,
  'utf8'
);
try {
  execSync(
    `npx esbuild "${entryTmp}" --bundle --platform=node --format=cjs --outfile="${outCoreFile}"`,
    { stdio: 'inherit' }
  );
} finally {
  fs.rmSync(entryTmp, { force: true });
}

console.log('Done! StudioFlow synced into Member Area.');
