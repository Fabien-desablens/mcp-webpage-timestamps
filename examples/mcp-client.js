#!/usr/bin/env node

// Example MCP client for testing the MCP Webpage Timestamps server
// This demonstrates how to interact with the MCP server

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function main() {
  // Start the MCP server
  const serverProcess = spawn('node', ['../dist/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Create MCP client
  const transport = new StdioClientTransport({
    reader: serverProcess.stdout,
    writer: serverProcess.stdin
  });

  const client = new Client(
    { name: 'test-client', version: '1.0.0' },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server');

    // List available tools
    console.log('\n🔧 Available tools:');
    const tools = await client.listTools();
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Test single URL extraction
    console.log('\n🔍 Testing single URL extraction...');
    const singleResult = await client.callTool({
      name: 'extract_timestamps',
      arguments: {
        url: 'https://example.com',
        config: {
          timeout: 10000,
          enableHeuristics: true
        }
      }
    });

    console.log('Single URL result:');
    console.log(singleResult.content[0].text);

    // Test batch extraction
    console.log('\n🔄 Testing batch extraction...');
    const batchResult = await client.callTool({
      name: 'batch_extract_timestamps',
      arguments: {
        urls: [
          'https://example.com',
          'https://example.org',
          'https://httpbin.org/html' // This should work for testing
        ],
        config: {
          timeout: 10000
        }
      }
    });

    console.log('Batch result:');
    console.log(batchResult.content[0].text);

    // Test error handling
    console.log('\n❌ Testing error handling...');
    const errorResult = await client.callTool({
      name: 'extract_timestamps',
      arguments: {
        url: 'invalid-url'
      }
    });

    console.log('Error result:');
    console.log(errorResult.content[0].text);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    serverProcess.kill();
    console.log('\n👋 Disconnected from MCP server');
  }
}

main().catch(console.error);