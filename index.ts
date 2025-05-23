#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fetch from 'node-fetch';

// Strava API configuration
const STRAVA_BASE_URL = 'https://www.strava.com/api/v3';

class StravaServer {
  private server: Server;
  private accessToken: string;

  constructor() {
    this.server = new Server(
      {
        name: 'strava-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Get access token from environment variable
    this.accessToken = process.env.STRAVA_ACCESS_TOKEN || '';
    
    if (!this.accessToken) {
      console.error('STRAVA_ACCESS_TOKEN environment variable is required');
      process.exit(1);
    }

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_athlete_profile',
            description: 'Get the authenticated athlete\'s profile information',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'get_athlete_activities',
            description: 'Get the authenticated athlete\'s activities',
            inputSchema: {
              type: 'object',
              properties: {
                before: {
                  type: 'integer',
                  description: 'Unix timestamp to get activities before',
                },
                after: {
                  type: 'integer',
                  description: 'Unix timestamp to get activities after',
                },
                page: {
                  type: 'integer',
                  description: 'Page number (default: 1)',
                },
                per_page: {
                  type: 'integer',
                  description: 'Number of activities per page (default: 30, max: 200)',
                },
              },
            },
          },
          {
            name: 'get_activity_details',
            description: 'Get detailed information about a specific activity',
            inputSchema: {
              type: 'object',
              properties: {
                activity_id: {
                  type: 'string',
                  description: 'The ID of the activity',
                },
              },
              required: ['activity_id'],
            },
          },
          {
            name: 'get_athlete_stats',
            description: 'Get the authenticated athlete\'s statistics',
            inputSchema: {
              type: 'object',
              properties: {
                athlete_id: {
                  type: 'string',
                  description: 'The ID of the athlete (use current athlete if not provided)',
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_athlete_profile':
            return await this.getAthleteProfile();
          
          case 'get_athlete_activities':
            return await this.getAthleteActivities(args);
          
          case 'get_activity_details':
            return await this.getActivityDetails(args.activity_id);
          
          case 'get_athlete_stats':
            return await this.getAthleteStats(args.athlete_id);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    });
  }

  private async makeStravaRequest(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${STRAVA_BASE_URL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Strava API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  private async getAthleteProfile() {
    const data = await this.makeStravaRequest('/athlete');
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getAthleteActivities(args: any = {}) {
    const params = {
      before: args.before,
      after: args.after,
      page: args.page || 1,
      per_page: args.per_page || 30,
    };

    const data = await this.makeStravaRequest('/athlete/activities', params);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getActivityDetails(activityId: string) {
    const data = await this.makeStravaRequest(`/activities/${activityId}`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  private async getAthleteStats(athleteId?: string) {
    // If no athlete ID provided, get current athlete first
    if (!athleteId) {
      const athlete = await this.makeStravaRequest('/athlete');
      athleteId = athlete.id.toString();
    }

    const data = await this.makeStravaRequest(`/athletes/${athleteId}/stats`);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Strava MCP server running on stdio');
  }
}

// Start the server
const server = new StravaServer();
server.run().catch(console.error);