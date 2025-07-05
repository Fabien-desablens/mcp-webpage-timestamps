import { TimestampExtractor } from '../extractor';

describe('Integration Tests', () => {
  let extractor: TimestampExtractor;

  beforeEach(() => {
    extractor = new TimestampExtractor({ timeout: 30000 });
  });

  // Skip these tests by default to avoid hitting real websites during CI
  describe.skip('Real website extraction', () => {
    it('should extract timestamps from a real news website', async () => {
      const result = await extractor.extractTimestamps('https://example.com');
      
      expect(result.url).toBe('https://example.com');
      expect(result.sources.length).toBeGreaterThan(0);
      expect(['high', 'medium', 'low']).toContain(result.confidence);
      
      // Should have at least some timestamp data
      expect(result.publishedAt || result.modifiedAt || result.createdAt).toBeDefined();
    });

    it('should handle redirects properly', async () => {
      // Test with a URL that redirects
      const result = await extractor.extractTimestamps('http://example.com');
      
      expect(result.url).toBe('http://example.com');
      expect(result.sources.length).toBeGreaterThan(0);
    });

    it('should handle timeout gracefully', async () => {
      const timeoutExtractor = new TimestampExtractor({ timeout: 1 });
      const result = await timeoutExtractor.extractTimestamps('https://httpbin.org/delay/5');
      
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0]).toContain('timeout');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid URLs gracefully', async () => {
      const result = await extractor.extractTimestamps('not-a-url');
      
      expect(result.url).toBe('not-a-url');
      expect(result.confidence).toBe('low');
      expect(result.sources).toHaveLength(0);
      expect(result.errors).toBeDefined();
    });

    it('should handle non-existent domains gracefully', async () => {
      const result = await extractor.extractTimestamps('https://this-domain-definitely-does-not-exist-12345.com');
      
      expect(result.url).toBe('https://this-domain-definitely-does-not-exist-12345.com');
      expect(result.confidence).toBe('low');
      expect(result.sources).toHaveLength(0);
      expect(result.errors).toBeDefined();
    });
  });
});