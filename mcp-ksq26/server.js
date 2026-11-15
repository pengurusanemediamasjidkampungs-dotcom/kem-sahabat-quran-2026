#!/usr/bin/env node
/**
 * KSQ 2026 MCP server.
 * Newline-delimited JSON-RPC 2.0 over stdio. No npm dependencies.
 *
 * Environment:
 *   KSQ_API_URL            Apps Script /exec URL
 *   KSQ_ADMIN_TOKEN        admin token (optional until an admin tool is used)
 *   KSQ_FASILITATOR_TOKEN  facilitator token (optional, attendance only)
 */

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import readline from 'node:readline';

import { ApiError, createApiClient } from './lib/api-client.js';
import { callTool, toolDefinitions } from './lib/tools.js';
import { listResources, readResource } from './lib/resources.js';

const SERVER_NAME = 'ksq26-mcp';
const SERVER_VERSION = '1.0.0';
const SUPPORTED_PROTOCOLS = ['2024-11-05', '2025-03-26', '2025-06-18'];

function log(message) {
  process.stderr.write(`[ksq26-mcp] ${message}\n`);
}

function rpcError(id, code, message, data) {
  return {
    jsonrpc: '2.0',
    id: id === undefined ? null : id,
    error: { code, message, ...(data === undefined ? {} : { data }) }
  };
}

function rpcResult(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function textResult(value) {
  const structured = value && typeof value === 'object' && !Array.isArray(value) ? value : { value };
  return {
    content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
    structuredContent: structured,
    isError: false
  };
}

export function createServer({ api = null, protocolVersion = '' } = {}) {
  let client = api;
  let negotiatedProtocol = SUPPORTED_PROTOCOLS.includes(protocolVersion)
    ? protocolVersion
    : SUPPORTED_PROTOCOLS[SUPPORTED_PROTOCOLS.length - 1];

  function getApi() {
    if (!client) client = createApiClient();
    return client;
  }

  async function handleRequest(message) {
    const { id, method, params } = message;

    switch (method) {
      case 'initialize': {
        const requested = String(params?.protocolVersion || '');
        if (SUPPORTED_PROTOCOLS.includes(requested)) negotiatedProtocol = requested;
        return {
          protocolVersion: negotiatedProtocol,
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false }
          },
          serverInfo: {
            name: SERVER_NAME,
            title: 'KSQ 2026 — Sistem Pengurusan Kem Sahabat Quran',
            version: SERVER_VERSION
          },
          instructions: [
            'Pelayan MCP untuk sistem KSQ 2026.',
            'Mulakan dengan ksq_stats atau ksq_dashboard.',
            'Alat admin memerlukan KSQ_ADMIN_TOKEN; alat kehadiran menerima KSQ_FASILITATOR_TOKEN.',
            'Jangan dedahkan token atau data peserta kepada saluran awam.',
            'Kewangan: siling RM5,500; item Cadangan tidak dikira; dana masjid = max(0, kos dikira - yuran diterima).'
          ].join(' ')
        };
      }

      case 'ping':
        return {};

      case 'tools/list':
        return { tools: toolDefinitions };

      case 'tools/call': {
        const name = String(params?.name || '');
        const args = params?.arguments && typeof params.arguments === 'object' ? params.arguments : {};
        if (!name) throw new ApiError('Nama alat diperlukan.', 'BAD_REQUEST');
        if (!toolDefinitions.some((tool) => tool.name === name)) {
          throw new ApiError(`Alat tidak dikenali: ${name}`, 'UNKNOWN_TOOL');
        }
        try {
          const result = await callTool(name, args, getApi());
          return textResult(result);
        } catch (err) {
          const code = err && err.code ? err.code : 'TOOL_ERROR';
          const messageText = err && err.message ? err.message : 'Alat gagal.';
          return {
            content: [{ type: 'text', text: JSON.stringify({ ok: false, code, error: messageText }, null, 2) }],
            structuredContent: { ok: false, code, error: messageText },
            isError: true
          };
        }
      }

      case 'resources/list':
        return { resources: listResources() };

      case 'resources/read': {
        const uri = String(params?.uri || '');
        if (!uri) throw new ApiError('URI sumber diperlukan.', 'BAD_REQUEST');
        const resource = readResource(uri);
        if (!resource) throw new ApiError(`Sumber tidak dijumpai: ${uri}`, 'NOT_FOUND');
        return { contents: [resource] };
      }

      case 'resources/templates/list':
        return { resourceTemplates: [] };

      case 'prompts/list':
        return { prompts: [] };

      case 'logging/setLevel':
        return {};

      case 'shutdown':
        return null;

      default:
        return undefined;
    }
  }

  async function handleMessage(message) {
    if (!message || typeof message !== 'object' || Array.isArray(message)) {
      return rpcError(null, -32600, 'Permintaan JSON-RPC tidak sah.');
    }
    if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
      if (message.id === undefined) return null;
      return rpcError(message.id, -32600, 'Permintaan JSON-RPC tidak sah.');
    }

    const isNotification = message.id === undefined;

    try {
      const result = await handleRequest(message);
      if (result === undefined) {
        if (isNotification) return null;
        return rpcError(message.id, -32601, `Kaedah tidak dijumpai: ${message.method}`);
      }
      if (isNotification) return null;
      return rpcResult(message.id, result);
    } catch (err) {
      if (isNotification) {
        log(`Notification error (${message.method}): ${err && err.message ? err.message : err}`);
        return null;
      }
      const code = err && err.code === 'BAD_REQUEST' ? -32602
        : err && err.code === 'NOT_FOUND' ? -32004
          : -32603;
      return rpcError(message.id, code, err && err.message ? err.message : 'Ralat dalaman.', {
        code: err && err.code ? err.code : 'INTERNAL'
      });
    }
  }

  return { handleMessage, handleRequest, getApi };
}

export function startServer() {
  const server = createServer();
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let payload;
    try {
      payload = JSON.parse(trimmed);
    } catch {
      process.stdout.write(JSON.stringify(rpcError(null, -32700, 'JSON tidak sah.')) + '\n');
      return;
    }

    if (Array.isArray(payload)) {
      if (!payload.length) {
        process.stdout.write(JSON.stringify(rpcError(null, -32600, 'Batch kosong.')) + '\n');
        return;
      }
      const responses = [];
      for (const item of payload) {
        const response = await server.handleMessage(item);
        if (response) responses.push(response);
      }
      if (responses.length) process.stdout.write(JSON.stringify(responses) + '\n');
      return;
    }

    if (payload && payload.method === 'exit') {
      rl.close();
      process.exit(0);
    }

    const response = await server.handleMessage(payload);
    if (response) process.stdout.write(JSON.stringify(response) + '\n');
  });

  rl.on('close', () => process.exit(0));
  process.on('uncaughtException', (err) => {
    log(`Uncaught exception: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });
  process.on('unhandledRejection', (err) => {
    log(`Unhandled rejection: ${err && err.stack ? err.stack : err}`);
    process.exit(1);
  });

  log(`Server sedia (${toolDefinitions.length} alat). Menunggu JSON-RPC pada stdin.`);
}

const isMain = process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  if (process.argv.includes('--version')) {
    process.stdout.write(`${SERVER_NAME} ${SERVER_VERSION}\n`);
  } else if (process.argv.includes('--list-tools')) {
    process.stdout.write(JSON.stringify(toolDefinitions.map((tool) => tool.name), null, 2) + '\n');
  } else {
    startServer();
  }
}
