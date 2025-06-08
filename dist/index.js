#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fetch from 'node-fetch';
import { z } from 'zod';
const STRAVA_TOKEN = process.env.STRAVA_ACCESS_TOKEN ?? '';
if (!STRAVA_TOKEN)
    throw new Error('Missing STRAVA_ACCESS_TOKEN');
const server = new Server({ name: 'strava-remote', version: '0.2.0' }, {
    capabilities: {
        tools: {
            'get-athlete': {
                description: 'Return authenticated athlete profile',
                parameters: z.object({}),
                handler: async () => {
                    const r = await callStrava('/athlete');
                    return r;
                },
            },
            'list-activities': {
                description: 'List recent activities',
                parameters: z.object({ per_page: z.number().optional() }),
                handler: async ({ per_page = 10 }) => callStrava(`/athlete/activities?per_page=${per_page}`),
            },
        },
    },
});
// Use stdio transport for now (easier to get working)
server.connect(new StdioServerTransport());
async function callStrava(path) {
    const r = await fetch(`https://www.strava.com/api/v3${path}`, {
        headers: { Authorization: `Bearer ${STRAVA_TOKEN}` },
    });
    if (!r.ok)
        throw new Error(await r.text());
    return r.json();
}
