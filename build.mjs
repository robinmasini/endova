/**
 * Assemble le site vitrine et l'application en un seul dossier à servir.
 *
 *   dist/            ← le site, à la racine du domaine
 *   dist/dashboard/  ← l'application React, compilée avec base:'/dashboard/'
 *
 * Deux projets séparés auraient été plus simples à déployer, mais l'application
 * doit vivre sous endova.fr/dashboard et non sur un sous-domaine : il faut donc
 * qu'un seul déploiement porte les deux.
 */
import { execSync } from 'node:child_process';
import { rmSync, mkdirSync, cpSync, existsSync, readdirSync } from 'node:fs';

const lancer = (cmd, cwd) => execSync(cmd, { cwd, stdio: 'inherit' });

console.log('→ dépendances de l’application');
lancer(existsSync('dashboard/package-lock.json') ? 'npm ci' : 'npm install', 'dashboard');

console.log('→ compilation de l’application');
lancer('npm run build', 'dashboard');

console.log('→ assemblage');
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
// Le site d'abord, à la racine.
for (const f of readdirSync('site')) {
  if (f === '.git' || f === '.gitignore' || f === '.DS_Store') continue;
  cpSync(`site/${f}`, `dist/${f}`, { recursive: true });
}
// Puis l'application, dans son sous-dossier.
cpSync('dashboard/dist', 'dist/dashboard', { recursive: true });

const listing = readdirSync('dist');
console.log('→ dist contient :', listing.join(', '));
if (!listing.includes('index.html') || !listing.includes('dashboard')) {
  throw new Error('assemblage incomplet : index.html ou dashboard manquant');
}
