import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => readFile(resolve(root, relativePath), 'utf8');
const readJson = async (relativePath) => JSON.parse(await read(relativePath));
const assertIncludes = (value, expected) => assert.ok(value.includes(expected), `expected output to include: ${expected}`);

async function githubPagesFallback(pathname, search = '', hash = '') {
  const html = await read('dist/404.html');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  const fallback = scripts.find((script) => script.includes('URLSearchParams(location.search)'));
  assert.ok(fallback, 'the built 404 page must contain the GitHub Pages fallback');

  const location = {
    origin: 'https://agoraclan.com',
    pathname,
    search,
    hash,
    replace: (target) => { location.redirect = target; },
  };
  runInNewContext(fallback, { location, URL, URLSearchParams });
  return location.redirect ?? null;
}

async function legacyLegalAlias(search = '', hash = '') {
  const html = await read('dist/terminos-y-politicas/index.html');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  const redirect = scripts.find((script) => script.includes("new URL('../assets/legal/privacy.html'"));
  assert.ok(redirect, 'the legacy legal route must redirect to the published privacy policy');

  const location = {
    href: 'https://agoraclan.com/terminos-y-politicas/',
    search,
    hash,
    replace: (target) => { location.redirect = target; },
  };
  runInNewContext(redirect, { location, URL });
  return location.redirect ?? null;
}

async function privacyAlias(search = '', hash = '') {
  const html = await read('dist/privacy/index.html');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  const redirect = scripts.find((script) => script.includes("new URL('../assets/legal/privacy.html'"));
  assert.ok(redirect, 'the /privacy route must redirect to the existing privacy policy');

  const location = {
    href: 'https://agoraclan.com/privacy/',
    search,
    hash,
    replace: (target) => { location.redirect = target; },
  };
  runInNewContext(redirect, { location, URL });
  return location.redirect ?? null;
}

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

test('GitHub Pages fallback validates deep links, prefers the path token, and never redirects off-site', async () => {
  const referralTarget = await githubPagesFallback('/r/Invite_42', '?ref=attacker&campaign=summer', '#join');
  const referral = new URL(referralTarget, 'https://agoraclan.com');
  assert.equal(referral.origin, 'https://agoraclan.com');
  assert.equal(referral.pathname, '/r.html');
  assert.equal(referral.searchParams.get('ref'), 'Invite_42');
  assert.equal(referral.searchParams.get('campaign'), 'summer');
  assert.equal(referral.hash, '#join');

  const tournamentToken = '2d2d135e-9404-4cd0-a540-85a6a56e6428';
  const tournamentTarget = await githubPagesFallback(`/t/${tournamentToken}`, '?next=https%3A%2F%2Fevil.example');
  const tournament = new URL(tournamentTarget, 'https://agoraclan.com');
  assert.equal(tournament.origin, 'https://agoraclan.com');
  assert.equal(tournament.pathname, '/t.html');
  assert.equal(tournament.searchParams.get('token'), tournamentToken);

  assert.equal(await githubPagesFallback('/r/%2F%2Fevil.example'), null);
  assert.equal(await githubPagesFallback('/r/ab'), null);
  assert.equal(await githubPagesFallback('/t/not%20a%20token'), null);
  assert.equal(await githubPagesFallback('/t/../../outside'), null);
});

test('legal documents are published with the current approved contact and retention policy', async () => {
  const [privacy, deletion, stylesheet] = await Promise.all([
    read('dist/assets/legal/privacy.html'),
    read('dist/assets/legal/account-deletion.html'),
    read('dist/assets/legal/legal.css'),
  ]);

  assertIncludes(privacy, '<h1>Política de privacidad</h1>');
  assertIncludes(privacy, 'Actualizada el 7 de octubre de 2026');
  assertIncludes(privacy, 'Ricardo Ruiz Gracia');
  assertIncludes(privacy, 'agoragaming99@gmail.com');
  assertIncludes(privacy, 'hasta 24 meses desde su envío');
  assertIncludes(privacy, 'Responderemos en un plazo máximo de un mes');
  assertIncludes(privacy, 'account-deletion.html');

  assertIncludes(deletion, '<h1>Solicitar eliminación de cuenta o datos</h1>');
  assertIncludes(deletion, 'agoragaming99@gmail.com');
  assertIncludes(deletion, 'máximo de 30 días');
  assertIncludes(deletion, 'hasta 90 días en copias de seguridad');
  assertIncludes(deletion, 'privacy.html');
  assertIncludes(stylesheet, '#0aff7a');
});

test('the legacy legal URL resolves only to privacy and keeps query and hash', async () => {
  const target = new URL(await legacyLegalAlias('?source=preregister', '#solicitudes'));
  assert.equal(target.origin, 'https://agoraclan.com');
  assert.equal(target.pathname, '/assets/legal/privacy.html');
  assert.equal(target.search, '?source=preregister');
  assert.equal(target.hash, '#solicitudes');
});

test('the canonical /privacy route resolves to the current policy and keeps query and hash', async () => {
  const target = new URL(await privacyAlias('?source=preregister', '#conservacion'));
  assert.equal(target.origin, 'https://agoraclan.com');
  assert.equal(target.pathname, '/assets/legal/privacy.html');
  assert.equal(target.search, '?source=preregister');
  assert.equal(target.hash, '#conservacion');
});

test('preregistration links to the available privacy policy without claiming terms acceptance', async () => {
  const homepage = await read('dist/index.html');
  assertIncludes(homepage, 'href="https://agoraclan.com/privacy"');
  assertIncludes(homepage, 'name="gdpr" required');
  assertIncludes(homepage, 'Acepto la <a href="https://agoraclan.com/privacy"');
  assertIncludes(homepage, 'title="Política de privacidad de Ágora"');
  assertIncludes(homepage, '>política de privacidad</a>, incluido el tratamiento de mis datos para el pre-registro.');
  assert.ok(!homepage.includes('Acepto los <a'), 'consent should not claim acceptance of unpublished terms');
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
