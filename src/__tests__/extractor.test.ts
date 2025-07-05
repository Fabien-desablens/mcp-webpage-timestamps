import { TimestampExtractor } from '../extractor';
import type { TimestampResult } from '../types';
import axios from 'axios';

// Mock axios to avoid real HTTP requests in tests
jest.mock('axios');
const mockedAxios = jest.mocked(axios);

describe('TimestampExtractor', () => {
  let extractor: TimestampExtractor;

  beforeEach(() => {
    extractor = new TimestampExtractor();
    jest.clearAllMocks();
  });

  describe('extractTimestamps', () => {
    it('should extract timestamps from HTML meta tags', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta name="article:published_time" content="2023-01-15T10:30:00Z">
            <meta name="article:modified_time" content="2023-01-16T14:20:00Z">
            <meta name="dc.date.created" content="2023-01-14T09:00:00Z">
          </head>
          <body></body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        headers: {},
        status: 200,
        request: { responseURL: 'https://example.com' },
      });

      const result = await extractor.extractTimestamps('https://example.com');

      expect(result.url).toBe('https://example.com');
      expect(result.confidence).toBe('high');
      expect(result.sources).toHaveLength(3);
      expect(result.publishedAt).toEqual(new Date('2023-01-15T10:30:00Z'));
      expect(result.modifiedAt).toEqual(new Date('2023-01-16T14:20:00Z'));
      expect(result.createdAt).toEqual(new Date('2023-01-14T09:00:00Z'));
    });

    it('should extract timestamps from JSON-LD structured data', async () => {
      const mockHtml = `
        <html>
          <head>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "datePublished": "2023-02-20T12:00:00Z",
              "dateModified": "2023-02-21T15:30:00Z"
            }
            </script>
          </head>
          <body></body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        headers: {},
        status: 200,
        request: { responseURL: 'https://example.com' },
      });

      const result = await extractor.extractTimestamps('https://example.com');

      expect(result.confidence).toBe('high');
      expect(result.sources).toHaveLength(2);
      expect(result.publishedAt).toEqual(new Date('2023-02-20T12:00:00Z'));
      expect(result.modifiedAt).toEqual(new Date('2023-02-21T15:30:00Z'));
    });

    it('should extract timestamps from microdata', async () => {
      const extractorWithoutHeuristics = new TimestampExtractor({ enableHeuristics: false });
      const mockHtml = `
        <html>
          <body>
            <div itemscope itemtype="http://schema.org/Article">
              <time itemprop="datePublished" datetime="2023-03-10T08:00:00Z">March 10, 2023</time>
              <time itemprop="dateModified" datetime="2023-03-11T10:00:00Z">March 11, 2023</time>
            </div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        headers: {},
        status: 200,
        request: { responseURL: 'https://example.com' },
      });

      const result = await extractorWithoutHeuristics.extractTimestamps('https://example.com');

      expect(result.confidence).toBe('high');
      expect(result.sources).toHaveLength(2);
      expect(result.publishedAt).toBeDefined();
      expect(result.modifiedAt).toBeDefined();
    });

    it('should extract timestamps from OpenGraph tags', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:article:published_time" content="2023-04-05T14:30:00Z">
            <meta property="og:article:modified_time" content="2023-04-06T16:45:00Z">
          </head>
          <body></body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        headers: {},
        status: 200,
        request: { responseURL: 'https://example.com' },
      });

      const result = await extractor.extractTimestamps('https://example.com');

      expect(result.confidence).toBe('high');
      expect(result.sources).toHaveLength(2);
      expect(result.publishedAt).toEqual(new Date('2023-04-05T14:30:00Z'));
      expect(result.modifiedAt).toEqual(new Date('2023-04-06T16:45:00Z'));
    });

    it('should extract timestamps from HTTP headers', async () => {
      const mockHtml = '<html><body></body></html>';

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        headers: {
          'last-modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
          'date': 'Thu, 22 Oct 2015 10:30:00 GMT',
        },
        status: 200,
        request: { responseURL: 'https://example.com' },
      });

      const result = await extractor.extractTimestamps('https://example.com');

      expect(result.sources).toHaveLength(2);
      expect(result.sources.some(s => s.type === 'http-header' && s.field === 'last-modified')).toBe(true);
      expect(result.sources.some(s => s.type === 'http-header' && s.field === 'date')).toBe(true);
    });

    it('should handle heuristic extraction from time elements', async () => {
      const mockHtml = `
        <html>
          <body>
            <time datetime="2023-05-15T12:00:00Z">May 15, 2023</time>
            <div class="date">Published on June 1, 2023</div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        headers: {},
        status: 200,
        request: { responseURL: 'https://example.com' },
      });

      const result = await extractor.extractTimestamps('https://example.com');

      expect(result.sources.some(s => s.type === 'heuristic')).toBe(true);
    });

    it('should handle fetch errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      const result = await extractor.extractTimestamps('https://example.com');

      expect(result.url).toBe('https://example.com');
      expect(result.confidence).toBe('low');
      expect(result.sources).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors?.[0]).toContain('Failed to fetch page');
    });

    it('should disable heuristics when configured', async () => {
      const extractorWithoutHeuristics = new TimestampExtractor({ enableHeuristics: false });
      const mockHtml = `
        <html>
          <body>
            <time datetime="2023-05-15T12:00:00Z">May 15, 2023</time>
            <div class="date">Published on June 1, 2023</div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        headers: {},
        status: 200,
        request: { responseURL: 'https://example.com' },
      });

      const result = await extractorWithoutHeuristics.extractTimestamps('https://example.com');

      expect(result.sources.every(s => s.type !== 'heuristic')).toBe(true);
    });

    it('should prioritize high confidence sources over low confidence ones', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta name="article:published_time" content="2023-01-15T10:30:00Z">
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Article",
              "datePublished": "2023-01-16T12:00:00Z"
            }
            </script>
          </head>
          <body>
            <div class="date">Published on January 17, 2023</div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
        headers: {},
        status: 200,
        request: { responseURL: 'https://example.com' },
      });

      const result = await extractor.extractTimestamps('https://example.com');

      expect(result.confidence).toBe('high');
      // Should prioritize JSON-LD over HTML meta (both high confidence, but JSON-LD is preferred)
      expect(result.publishedAt).toEqual(new Date('2023-01-16T12:00:00Z'));
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customExtractor = new TimestampExtractor({
        timeout: 5000,
        userAgent: 'CustomBot/1.0',
        followRedirects: false,
        maxRedirects: 3,
        enableHeuristics: false,
      });

      expect(customExtractor['config'].timeout).toBe(5000);
      expect(customExtractor['config'].userAgent).toBe('CustomBot/1.0');
      expect(customExtractor['config'].followRedirects).toBe(false);
      expect(customExtractor['config'].maxRedirects).toBe(3);
      expect(customExtractor['config'].enableHeuristics).toBe(false);
    });

    it('should use default configuration when not specified', () => {
      const defaultExtractor = new TimestampExtractor();

      expect(defaultExtractor['config'].timeout).toBe(10000);
      expect(defaultExtractor['config'].userAgent).toContain('MCP-Webpage-Timestamps');
      expect(defaultExtractor['config'].followRedirects).toBe(true);
      expect(defaultExtractor['config'].maxRedirects).toBe(5);
      expect(defaultExtractor['config'].enableHeuristics).toBe(true);
    });
  });
});