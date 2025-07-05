# MCP Webpage Timestamps

A powerful [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for extracting webpage creation, modification, and publication timestamps. This tool is designed for content freshness evaluation, web scraping, and temporal analysis of web content.

## Features

- **Comprehensive Timestamp Extraction**: Extracts creation, modification, and publication timestamps from webpages
- **Multiple Data Sources**: Supports HTML meta tags, HTTP headers, JSON-LD, microdata, OpenGraph, Twitter cards, and heuristic analysis
- **Confidence Scoring**: Provides confidence levels (high/medium/low) for extracted timestamps
- **Batch Processing**: Extract timestamps from multiple URLs simultaneously
- **Configurable**: Customizable timeout, user agent, redirect handling, and heuristic options
- **Production Ready**: Robust error handling, comprehensive logging, and TypeScript support

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

## Usage

### As MCP Server

The server can be used with any MCP-compatible client. Here's how to configure it:

#### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "webpage-timestamps": {
      "command": "node",
      "args": ["/path/to/mcp-webpage-timestamps/dist/index.js"],
      "env": {}
    }
  }
}
```

#### Cline Configuration

Add to your MCP settings:

```json
{
  "mcpServers": {
    "webpage-timestamps": {
      "command": "node",
      "args": ["/path/to/mcp-webpage-timestamps/dist/index.js"]
    }
  }
}
```

### Direct Usage

```bash
# Start the server
npm start

# Or run in development mode
npm run dev
```

## API Reference

### Tools

#### `extract_timestamps`

Extract timestamps from a single webpage.

**Parameters:**
- `url` (string, required): The URL of the webpage to extract timestamps from
- `config` (object, optional): Configuration options

**Configuration Options:**
- `timeout` (number): Request timeout in milliseconds (default: 10000)
- `userAgent` (string): User agent string for requests
- `followRedirects` (boolean): Whether to follow HTTP redirects (default: true)
- `maxRedirects` (number): Maximum number of redirects to follow (default: 5)
- `enableHeuristics` (boolean): Enable heuristic timestamp detection (default: true)

**Example:**
```json
{
  "name": "extract_timestamps",
  "arguments": {
    "url": "https://example.com/article",
    "config": {
      "timeout": 15000,
      "enableHeuristics": true
    }
  }
}
```

#### `batch_extract_timestamps`

Extract timestamps from multiple webpages in batch.

**Parameters:**
- `urls` (array of strings, required): Array of URLs to extract timestamps from
- `config` (object, optional): Same configuration options as `extract_timestamps`

**Example:**
```json
{
  "name": "batch_extract_timestamps",
  "arguments": {
    "urls": [
      "https://example.com/article1",
      "https://example.com/article2",
      "https://example.com/article3"
    ],
    "config": {
      "timeout": 10000
    }
  }
}
```

### Response Format

Both tools return a JSON object with the following structure:

```typescript
{
  url: string;
  createdAt?: Date;
  modifiedAt?: Date;
  publishedAt?: Date;
  sources: TimestampSource[];
  confidence: 'high' | 'medium' | 'low';
  errors?: string[];
}
```

**TimestampSource:**
```typescript
{
  type: 'html-meta' | 'http-header' | 'json-ld' | 'microdata' | 'opengraph' | 'twitter' | 'heuristic';
  field: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
}
```

## Supported Timestamp Sources

### HTML Meta Tags
- `article:published_time`
- `article:modified_time`
- `date`
- `pubdate`
- `publishdate`
- `last-modified`
- `dc.date.created`
- `dc.date.modified`
- `dcterms.created`
- `dcterms.modified`

### HTTP Headers
- `Last-Modified`
- `Date`

### JSON-LD Structured Data
- `datePublished`
- `dateModified`
- `dateCreated`

### Microdata
- `datePublished`
- `dateModified`

### OpenGraph
- `og:article:published_time`
- `og:article:modified_time`
- `og:updated_time`

### Twitter Cards
- `twitter:data1` (when containing date information)

### Heuristic Analysis
- Time elements with `datetime` attributes
- Common date patterns in text
- Date-related CSS classes

## Development

### Scripts

```bash
# Development with hot reload
npm run dev

# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Testing

The project includes comprehensive tests:

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- extractor.test.ts
```

### Code Quality

- **TypeScript**: Full TypeScript support with strict type checking
- **ESLint**: Code linting with recommended rules
- **Prettier**: Code formatting
- **Jest**: Unit and integration testing
- **95%+ Test Coverage**: Comprehensive test suite

## Examples

### Basic Usage

```javascript
import { TimestampExtractor } from './src/extractor.js';

const extractor = new TimestampExtractor();
const result = await extractor.extractTimestamps('https://example.com/article');

console.log('Published:', result.publishedAt);
console.log('Modified:', result.modifiedAt);
console.log('Confidence:', result.confidence);
console.log('Sources:', result.sources.length);
```

### Custom Configuration

```javascript
const extractor = new TimestampExtractor({
  timeout: 15000,
  userAgent: 'MyBot/1.0',
  enableHeuristics: false,
  maxRedirects: 3
});

const result = await extractor.extractTimestamps('https://example.com');
```

### Batch Processing

```javascript
const urls = [
  'https://example.com/article1',
  'https://example.com/article2',
  'https://example.com/article3'
];

const results = await Promise.all(
  urls.map(url => extractor.extractTimestamps(url))
);
```

## Use Cases

- **Content Freshness Analysis**: Evaluate how recent web content is
- **Web Scraping**: Extract temporal metadata from scraped pages
- **SEO Analysis**: Analyze publication and modification patterns
- **Research**: Study temporal aspects of web content
- **Content Management**: Track content lifecycle and updates

## Error Handling

The extractor handles various error conditions gracefully:

- **Network Errors**: Timeout, connection refused, DNS resolution failures
- **HTTP Errors**: 404, 500, and other HTTP status codes
- **Parsing Errors**: Invalid HTML, malformed JSON-LD, unparseable dates
- **Configuration Errors**: Invalid URLs, timeout values, etc.

All errors are captured in the `errors` array of the response, allowing for robust error handling and debugging.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/Fabien-desablens/mcp-webpage-timestamps.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature`
5. Make your changes
6. Run tests: `npm test`
7. Commit your changes: `git commit -m 'Add some feature'`
8. Push to the branch: `git push origin feature/your-feature`
9. Submit a pull request

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Add tests for new functionality
- Update documentation as needed

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/Fabien-desablens/mcp-webpage-timestamps/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Fabien-desablens/mcp-webpage-timestamps/discussions)
- **Documentation**: [Wiki](https://github.com/Fabien-desablens/mcp-webpage-timestamps/wiki)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io) for the excellent MCP framework
- [Cheerio](https://cheerio.js.org) for HTML parsing
- [Axios](https://axios-http.com) for HTTP requests
- [date-fns](https://date-fns.org) for date parsing and manipulation