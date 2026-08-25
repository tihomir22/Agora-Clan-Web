import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(resolve(root, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await read(relativePath));

const productionFingerprints = [
  'F6:9A:E0:99:47:F9:62:7B:56:21:CD:69:8D:F3:E0:6A:25:C9:E5:9A:6A:38:54:BF:87:1D:D7:47:34:74:7D:5A',
  'A0:EC:14:8C:D8:A8:EF:4A:B4:CC:C8:5C:65:BD:DA:AF:A1:E0:B6:53:A7:88:F9:FE:F9:0C:2B:B9:92:9E:DB:4C',
];
const debugFingerprint =
  '87:65:EE:6A:2E:05:A9:48:B7:C5:1C:C5:3D:48:13:27:27:3A:0D:45:6B:B3:8A:D5:EC:16:4B:8E:07:77:BE:6F';
const fingerprintPattern = /^[0-9A-F]{2}(?::[0-9A-F]{2}){31}$/;

test('production Apple association is the exact approved JSON', async () => {
  assert.deepEqual(await readJson('public/.well-known/apple-app-site-association'), {
    applinks: {
      details: [
        {
          appID: '84F6K9ACAA.com.agoraclan.app',
          paths: ['/r/*', '/t/*'],
        },
      ],
    },
  });
});

test('production Android association has release certificates only', async () => {
  const assetlinks = await readJson('public/.well-known/assetlinks.json');
  assert.deepEqual(assetlinks, [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.agoraclan.app',
        sha256_cert_fingerprints: productionFingerprints,
      },
    },
  ]);
  const fingerprints = assetlinks[0].target.sha256_cert_fingerprints;
  assert.ok(fingerprints.every((value) => fingerprintPattern.test(value)));
  assert.ok(!fingerprints.includes(debugFingerprint));
});

test('Cloudflare headers protect association files and immutable Astro assets', async () => {
  const headers = await read('public/_headers');
  for (const endpoint of ['apple-app-site-association', 'assetlinks.json']) {
    assert.match(headers, new RegExp(`/.well-known/${endpoint}[\\s\\S]*Content-Type: application/json`));
    assert.match(headers, new RegExp(`/.well-known/${endpoint}[\\s\\S]*Cache-Control: public, max-age=300, must-revalidate`));
  }
  assert.match(headers, /\/_astro\/\*[\s\S]*Cache-Control: public, max-age=31536000, immutable/);
  for (const header of [
    'Content-Security-Policy:',
    'Permissions-Policy:',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'Strict-Transport-Security:',
    'X-Content-Type-Options: nosniff',
    'X-Frame-Options: DENY',
  ]) {
    assert.match(headers, new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('Cloudflare proxies deep-link routes to extensionless destinations', async () => {
  const redirectsSource = await read('public/_redirects');
  const redirects = redirectsSource.trim().split(/\r?\n/);
  assert.deepEqual(redirects, ['/r/* /r 200', '/t/* /t 200']);
  assert.doesNotMatch(redirectsSource, /\/r\.html|\/t\.html/);
  // Cloudflare Pages normalizes an HTML destination with a 308 before the
  // fallback can read the splat, so these proxy targets must stay extensionless.
  assert.doesNotMatch(redirectsSource, /\.html\s+200/);
  assert.doesNotMatch(redirectsSource, /\.well-known/);
});

test('deep-link pages are thin wrappers around one shared fallback component', async () => {
  const [referral, tournament, shared] = await Promise.all([
    read('src/pages/r.astro'),
    read('src/pages/t.astro'),
    read('src/components/DeepLinkFallback.astro'),
  ]);

  for (const wrapper of [referral, tournament]) {
    assert.match(wrapper, /DeepLinkFallback/);
    assert.doesNotMatch(wrapper, /<section|<style|<script/);
  }
  assert.equal((referral.match(/DeepLinkFallback/g) || []).length, 3);
  assert.equal((tournament.match(/DeepLinkFallback/g) || []).length, 3);
  assert.match(shared, /referralPattern = \/\^\[A-Za-z0-9_-\]\{3,16\}\$\//);
  assert.match(shared, /tokenPattern = \/\^\[A-Za-z0-9_-\]\{3,64\}\$\//);
  assert.match(shared, /uuidPattern/);
  assert.match(shared, /localStorage\.setItem\(storageKey, value\)/);
  assert.match(shared, /textContent/);
  assert.doesNotMatch(shared, /innerHTML/);
});

test('GitHub Pages fallback keeps route parameters and hash for both artifacts', async () => {
  const notFound = await read('src/pages/404.astro');
  assert.match(notFound, /referralArtifact: url\('\/r\.html'\)/);
  assert.match(notFound, /tournamentArtifact: url\('\/t\.html'\)/);
  assert.match(notFound, /URLSearchParams\(location\.search\)/);
  assert.match(notFound, /location\.hash/);
  assert.match(notFound, /params\.has\(parameter\)/);
});

test('build emits both artifacts and does not expose store links while APP.live is false', async () => {
  for (const artifact of [
    'dist/r.html',
    'dist/t.html',
    'dist/_headers',
    'dist/_redirects',
    'dist/.well-known/apple-app-site-association',
    'dist/.well-known/assetlinks.json',
  ]) {
    await access(resolve(root, artifact));
  }

  assert.deepEqual(
    await readJson('dist/.well-known/apple-app-site-association'),
    await readJson('public/.well-known/apple-app-site-association'),
  );
  assert.deepEqual(await readJson('dist/.well-known/assetlinks.json'), await readJson('public/.well-known/assetlinks.json'));
  assert.equal(await read('dist/_redirects'), await read('public/_redirects'));

  const [referral, tournament] = await Promise.all([read('dist/r.html'), read('dist/t.html')]);
  assert.match(referral, /Te han invitado a Ágora/);
  assert.match(tournament, /Te han invitado a un torneo/);
  assert.match(referral, /\/descargar/);
  assert.match(tournament, /\/descargar/);
  assert.doesNotMatch(referral, /play\.google\.com/);
  assert.doesNotMatch(tournament, /play\.google\.com/);
});

test('build inputs do not depend on the retired alternate landing', async () => {
  const files = [
    'package.json',
    'astro.config.mjs',
    '.github/workflows/deploy.yml',
    'src/pages/r.astro',
    'src/pages/t.astro',
    'src/components/DeepLinkFallback.astro',
  ];
  const sources = await Promise.all(files.map(read));
  assert.ok(sources.every((source) => !source.includes('Agora-landing')));
});
