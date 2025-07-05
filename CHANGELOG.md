# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of MCP Webpage Timestamps server
- Comprehensive timestamp extraction from multiple sources
- Support for HTML meta tags, HTTP headers, JSON-LD, microdata, OpenGraph, and Twitter cards
- Heuristic analysis for timestamp detection
- Batch processing capabilities
- Configurable extraction options with confidence scoring
- Production-ready error handling and logging
- Full TypeScript support with strict type checking
- Comprehensive test suite with high coverage
- Complete documentation and usage examples
- CI/CD pipeline with GitHub Actions
- MCP server implementation with two tools: extract_timestamps and batch_extract_timestamps

### Security
- Input validation for all user inputs
- Safe URL handling to prevent access to internal resources
- Appropriate rate limiting and timeout configurations