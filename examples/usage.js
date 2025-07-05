#!/usr/bin/env node

// Example usage of the MCP Webpage Timestamps server
// This demonstrates how to use the extractor directly (not through MCP)

import { TimestampExtractor } from '../dist/extractor.js';

async function main() {
  const extractor = new TimestampExtractor({
    timeout: 15000,
    enableHeuristics: true,
  });

  console.log('🔍 Extracting timestamps from example websites...\n');

  // Example 1: News article
  try {
    console.log('📰 Analyzing news article...');
    const newsResult = await extractor.extractTimestamps('https://example.com/news/article');
    console.log('Results:', JSON.stringify(newsResult, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 2: Blog post
  try {
    console.log('📝 Analyzing blog post...');
    const blogResult = await extractor.extractTimestamps('https://example.com/blog/post');
    console.log('Results:', JSON.stringify(blogResult, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Example 3: Batch processing
  try {
    console.log('🔄 Batch processing multiple URLs...');
    const urls = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3',
    ];

    const results = await Promise.allSettled(
      urls.map(url => extractor.extractTimestamps(url))
    );

    results.forEach((result, index) => {
      console.log(`\n📄 URL ${index + 1}: ${urls[index]}`);
      if (result.status === 'fulfilled') {
        console.log('✅ Success');
        console.log('Published:', result.value.publishedAt);
        console.log('Modified:', result.value.modifiedAt);
        console.log('Confidence:', result.value.confidence);
        console.log('Sources:', result.value.sources.length);
      } else {
        console.log('❌ Failed:', result.reason.message);
      }
    });
  } catch (error) {
    console.error('❌ Batch processing error:', error.message);
  }

  console.log('\n✨ Done!');
}

main().catch(console.error);