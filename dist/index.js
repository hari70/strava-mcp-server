#!/usr/bin/env node
import http from 'http';
import { URL } from 'url';
import fetch from 'node-fetch';
const STRAVA_TOKEN = process.env.STRAVA_ACCESS_TOKEN ?? '';
if (!STRAVA_TOKEN)
    throw new Error('Missing STRAVA_ACCESS_TOKEN');
const PORT = process.env.PORT || 8080;
// Helper to parse JSON from request
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            }
            catch (e) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}
// Helper to send JSON response
function sendJson(res, data, status = 200) {
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}
// Main server
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '', `http://localhost:${PORT}`);
    const method = req.method;
    const pathname = url.pathname;
    // Handle CORS preflight
    if (method === 'OPTIONS') {
        sendJson(res, {});
        return;
    }
    try {
        // Root endpoint - health check
        if (pathname === '/' && method === 'GET') {
            sendJson(res, {
                status: 'ok',
                service: 'Strava MCP Server',
                version: '0.2.0',
                endpoints: {
                    health: '/',
                    tools: '/mcp/tools',
                    execute: '/mcp/tools/:toolName'
                }
            });
            return;
        }
        // List tools endpoint
        if (pathname === '/mcp/tools' && method === 'GET') {
            sendJson(res, {
                tools: [
                    {
                        name: 'get-athlete',
                        description: 'Return authenticated athlete profile',
                        method: 'POST',
                        endpoint: '/mcp/tools/get-athlete'
                    },
                    {
                        name: 'list-activities',
                        description: 'List recent activities',
                        method: 'POST',
                        endpoint: '/mcp/tools/list-activities',
                        parameters: {
                            per_page: { type: 'number', optional: true, default: 10 }
                        }
                    }
                ]
            });
            return;
        }
        // Tool execution endpoints
        if (pathname.startsWith('/mcp/tools/') && method === 'POST') {
            const toolName = pathname.split('/')[3];
            const body = await parseBody(req);
            let result;
            switch (toolName) {
                case 'get-athlete':
                    result = await callStrava('/athlete');
                    break;
                case 'list-activities':
                    const perPage = body.per_page || 10;
                    result = await callStrava(`/athlete/activities?per_page=${perPage}`);
                    break;
                default:
                    sendJson(res, { error: `Unknown tool: ${toolName}` }, 404);
                    return;
            }
            sendJson(res, { result });
            return;
        }
        // Default 404
        sendJson(res, { error: 'Not found' }, 404);
    }
    catch (error) {
        console.error('Server error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        sendJson(res, { error: errorMessage }, 500);
    }
});
server.listen(PORT, () => {
    console.log(`Strava MCP Server running on port ${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  GET  / - Health check`);
    console.log(`  GET  /mcp/tools - List tools`);
    console.log(`  POST /mcp/tools/get-athlete - Get athlete profile`);
    console.log(`  POST /mcp/tools/list-activities - List activities`);
});
async function callStrava(path) {
    const r = await fetch(`https://www.strava.com/api/v3${path}`, {
        headers: { Authorization: `Bearer ${STRAVA_TOKEN}` },
    });
    if (!r.ok)
        throw new Error(await r.text());
    return r.json();
}
