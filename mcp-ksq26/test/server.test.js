/**
 * JSON-RPC and resource tests for the KSQ MCP server.
 * These tests call handleMessage directly; no process or network is started.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createServer } from '../server.js';
import { validateApiUrl } from '../lib/api-client.js';
import { listResources, readResource } from '../lib/resources.js';

function fakeApi() {
  return {
    hasFacilitatorToken: false,
    stats: async () => ({
      kapasiti: 40, disahkan: 1, menunggu: 0, senaraiTunggu: 0, bakiSlot: 39,
      pendaftaranDibuka: true, tarikhTutup: '2026-12-07T23:59:00+08:00',
      yuran: { asal: 180, promo: 120, online: 110 }
    }),
    adminPost: async (action) => {
      if (action === 'list') {
        return {
          registrations: [{
            id: 'KSQ26-0001', masa_daftar: '2026-11-19T09:00:00+08:00', nama_peserta: 'Ahmad',
            umur: 12, jantina: 'L', nama_penjaga: 'Ali', tel_penjaga: '0123456789',
            kaedah_daftar: 'online', yuran_rm: 110, status_bayaran: 'Sudah',
            rujukan_bayaran: '', status: 'Disahkan', alahan_kesihatan: 'Tiada', catatan: ''
          }]
        };
      }
      if (action === 'tasks.list') return { tasks: [] };
      if (action === 'milestones.list') return { milestones: [] };
      if (action === 'budget.list') return { budget: [] };
      throw new Error(`Unexpected action: ${action}`);
    },
    facilitatorPost: async () => {
      throw new Error('not used');
    }
  };
}

test('initialize negotiates a supported protocol and advertises tools/resources', async () => {
  const server = createServer({ api: fakeApi() });
  const response = await server.handleMessage({
    jsonrpc: '2.0', id: 1, method: 'initialize',
    params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test' } }
  });
  assert.equal(response.jsonrpc, '2.0');
  assert.equal(response.id, 1);
  assert.equal(response.result.protocolVersion, '2024-11-05');
  assert.equal(response.result.capabilities.tools.listChanged, false);
  assert.equal(response.result.capabilities.resources.subscribe, false);
  assert.equal(response.result.serverInfo.name, 'ksq26-mcp');
  assert.match(response.result.instructions, /RM5,500/);
});

test('initialize falls back to the newest supported protocol', async () => {
  const server = createServer({ api: fakeApi() });
  const response = await server.handleMessage({
    jsonrpc: '2.0', id: 2, method: 'initialize',
    params: { protocolVersion: '1999-01-01' }
  });
  assert.equal(response.result.protocolVersion, '2025-06-18');
});

test('notifications are accepted without a response', async () => {
  const server = createServer({ api: fakeApi() });
  const response = await server.handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(response, null);
});

test('ping returns an empty result', async () => {
  const server = createServer({ api: fakeApi() });
  const response = await server.handleMessage({ jsonrpc: '2.0', id: 3, method: 'ping' });
  assert.deepEqual(response.result, {});
});

test('tools/list returns all 13 tools with schemas', async () => {
  const server = createServer({ api: fakeApi() });
  const response = await server.handleMessage({ jsonrpc: '2.0', id: 4, method: 'tools/list' });
  assert.equal(response.result.tools.length, 13);
  const names = response.result.tools.map((tool) => tool.name);
  assert.ok(names.includes('ksq_dashboard'));
  assert.ok(names.includes('ksq_mark_attendance'));
  response.result.tools.forEach((tool) => {
    assert.equal(tool.inputSchema.type, 'object');
  });
});

test('tools/call returns text and structured content', async () => {
  const server = createServer({ api: fakeApi() });
  const response = await server.handleMessage({
    jsonrpc: '2.0', id: 5, method: 'tools/call',
    params: { name: 'ksq_stats', arguments: {} }
  });
  const result = response.result;
  assert.equal(result.isError, false);
  assert.equal(result.content[0].type, 'text');
  const parsed = JSON.parse(result.content[0].text);
  assert.equal(parsed.kapasiti, 40);
  assert.equal(result.structuredContent.kapasiti, 40);
});

test('tools/call reports unknown tools as a JSON-RPC error', async () => {
  const server = createServer({ api: fakeApi() });
  const response = await server.handleMessage({
    jsonrpc: '2.0', id: 6, method: 'tools/call',
    params: { name: 'ksq_hapus_semua', arguments: {} }
  });
  assert.equal(response.error.code, -32603);
  assert.equal(response.error.data.code, 'UNKNOWN_TOOL');
});

test('tools/call converts handler failures into isError results', async () => {
  const server = createServer({
    api: fakeApi(),
    protocolVersion: ''
  });
  const response = await server.handleMessage({
    jsonrpc: '2.0', id: 7, method: 'tools/call',
    params: { name: 'ksq_get_settings', arguments: {} }
  });
  assert.equal(response.result.isError, true);
  const parsed = JSON.parse(response.result.content[0].text);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.code, 'TOOL_ERROR');
});

test('unknown methods return -32601 and malformed messages return -32600', async () => {
  const server = createServer({ api: fakeApi() });
  const unknown = await server.handleMessage({ jsonrpc: '2.0', id: 8, method: 'kaedah/tidak/wujud' });
  assert.equal(unknown.error.code, -32601);

  const malformed = await server.handleMessage({ id: 9, method: 'ping' });
  assert.equal(malformed.error.code, -32600);

  const invalid = await server.handleMessage({ jsonrpc: '2.0', id: 10, method: 42 });
  assert.equal(invalid.error.code, -32600);
});

test('resources/list and resources/read expose the bundled reference files', async () => {
  const server = createServer({ api: fakeApi() });
  const list = await server.handleMessage({ jsonrpc: '2.0', id: 11, method: 'resources/list' });
  assert.equal(list.result.resources.length, 4);
  const uris = list.result.resources.map((resource) => resource.uri);
  assert.ok(uris.includes('ksq://finance/rules'));

  const read = await server.handleMessage({
    jsonrpc: '2.0', id: 12, method: 'resources/read',
    params: { uri: 'ksq://finance/rules' }
  });
  assert.equal(read.result.contents.length, 1);
  assert.equal(read.result.contents[0].mimeType, 'text/markdown');
  assert.match(read.result.contents[0].text, /RM5,500/);
});

test('resources/read rejects unknown URIs with -32004', async () => {
  const server = createServer({ api: fakeApi() });
  const response = await server.handleMessage({
    jsonrpc: '2.0', id: 13, method: 'resources/read',
    params: { uri: 'ksq://tidak/wujud' }
  });
  assert.equal(response.error.code, -32004);
  assert.equal(response.error.data.code, 'NOT_FOUND');
});

test('resources resolve on disk and contain no secrets', () => {
  const resources = listResources();
  assert.equal(resources.length, 4);
  resources.forEach((resource) => {
    const loaded = readResource(resource.uri);
    assert.ok(loaded.text.length > 100, `${resource.uri} too short`);
    assert.doesNotMatch(loaded.text, /AIza[0-9A-Za-z_-]{20,}/);
    assert.doesNotMatch(loaded.text, /script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{25,}\/exec/);
  });
});

test('validateApiUrl accepts only a real /exec URL', () => {
  assert.equal(
    validateApiUrl('https://script.google.com/macros/s/ABCdef123_-/exec'),
    'https://script.google.com/macros/s/ABCdef123_-/exec'
  );
  assert.throws(() => validateApiUrl(''), /KSQ_API_URL/);
  assert.throws(() => validateApiUrl('https://example.com/exec'), /KSQ_API_URL/);
  assert.throws(
    () => validateApiUrl('https://script.google.com/macros/s/ISI_DEPLOYMENT_ID/exec'),
    /KSQ_API_URL/
  );
});
