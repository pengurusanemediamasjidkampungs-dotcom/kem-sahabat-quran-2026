/**
 * Static MCP resources bundled with the KSQ server.
 * Resources are read-only reference material, not live participant data.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESOURCE_DIR = path.join(__dirname, '..', 'resources');

export const resourceDefinitions = [
  {
    uri: 'ksq://program/facts',
    name: 'program-facts',
    title: 'Fakta program KSQ 2026',
    description: 'Tarikh, lokasi, kapasiti, yuran, syarat umur dan sasaran hafazan.',
    mimeType: 'application/json',
    file: 'program-facts.json'
  },
  {
    uri: 'ksq://finance/rules',
    name: 'finance-rules',
    title: 'Peraturan kewangan dan siling RM5,500',
    description: 'Formula dana masjid, item Cadangan yang dikecualikan dan paparan dashboard wajib.',
    mimeType: 'text/markdown',
    file: 'finance-rules.md'
  },
  {
    uri: 'ksq://api/reference',
    name: 'api-reference',
    title: 'Rujukan API Apps Script',
    description: 'Bentuk permintaan, tindakan awam/admin/fasilitator, helaian dan kod ralat.',
    mimeType: 'text/markdown',
    file: 'api-reference.md'
  },
  {
    uri: 'ksq://privacy/guide',
    name: 'privacy-guide',
    title: 'Panduan privasi dan keselamatan',
    description: 'Penyamaran telefon, data kesihatan, token dan had alat MCP.',
    mimeType: 'text/markdown',
    file: 'privacy.md'
  }
];

export function listResources() {
  return resourceDefinitions.map(({ uri, name, title, description, mimeType }) => ({
    uri, name, title, description, mimeType
  }));
}

export function readResource(uri) {
  const resource = resourceDefinitions.find((item) => item.uri === uri);
  if (!resource) return null;
  const filePath = path.join(RESOURCE_DIR, resource.file);
  return {
    uri: resource.uri,
    mimeType: resource.mimeType,
    text: fs.readFileSync(filePath, 'utf8')
  };
}
