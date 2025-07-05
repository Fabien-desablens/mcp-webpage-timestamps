#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { TimestampExtractor } from './extractor.js';

const server = new Server(
  {
    name: 'mcp-webpage-timestamps',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const extractor = new TimestampExtractor();

const tools: Tool[] = [
  {
    name: 'extract_timestamps',
    description: 'Extract creation, modification, and publication timestamps from a webpage',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL of the webpage to extract timestamps from',
        },
        config: {
          type: 'object',
          description: 'Optional configuration for the extraction',
          properties: {
            timeout: {
              type: 'number',
              description: 'Request timeout in milliseconds (default: 10000)',
            },
            userAgent: {
              type: 'string',
              description: 'User agent string to use for requests',
            },
            followRedirects: {
              type: 'boolean',
              description: 'Whether to follow HTTP redirects (default: true)',
            },
            maxRedirects: {
              type: 'number',
              description: 'Maximum number of redirects to follow (default: 5)',
            },
            enableHeuristics: {
              type: 'boolean',
              description: 'Whether to enable heuristic timestamp detection (default: true)',
            },
          },
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'batch_extract_timestamps',
    description: 'Extract timestamps from multiple webpages in batch',
    inputSchema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Array of URLs to extract timestamps from',
        },
        config: {
          type: 'object',
          description: 'Optional configuration for the extraction',
          properties: {
            timeout: {
              type: 'number',
              description: 'Request timeout in milliseconds (default: 10000)',
            },
            userAgent: {
              type: 'string',
              description: 'User agent string to use for requests',
            },
            followRedirects: {
              type: 'boolean',
              description: 'Whether to follow HTTP redirects (default: true)',
            },
            maxRedirects: {
              type: 'number',
              description: 'Maximum number of redirects to follow (default: 5)',
            },
            enableHeuristics: {
              type: 'boolean',
              description: 'Whether to enable heuristic timestamp detection (default: true)',
            },
          },
        },
      },
      required: ['urls'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'extract_timestamps') {
      const { url, config } = args as {
        url: string;
        config?: {
          timeout?: number;
          userAgent?: string;
          followRedirects?: boolean;
          maxRedirects?: number;
          enableHeuristics?: boolean;
        };
      };

      if (!url) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: URL is required',
            },
          ],
          isError: true,
        };
      }

      const timestampExtractor = config ? new TimestampExtractor(config) : extractor;
      const result = await timestampExtractor.extractTimestamps(url);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    if (name === 'batch_extract_timestamps') {
      const { urls, config } = args as {
        urls: string[];
        config?: {
          timeout?: number;
          userAgent?: string;
          followRedirects?: boolean;
          maxRedirects?: number;
          enableHeuristics?: boolean;
        };
      };

      if (!Array.isArray(urls) || urls.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: URLs array is required and must not be empty',
            },
          ],
          isError: true,
        };
      }

      const timestampExtractor = config ? new TimestampExtractor(config) : extractor;
      const results = await Promise.allSettled(
        urls.map(url => timestampExtractor.extractTimestamps(url))
      );

      const processedResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            url: urls[index],
            sources: [],
            confidence: 'low' as const,
            errors: [`Failed to extract timestamps: ${result.reason}`],
          };
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(processedResults, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Error: Unknown tool: ${name}`,
        },
      ],
      isError: true,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Webpage Timestamps Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});