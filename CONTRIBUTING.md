# Contributing to MCP Webpage Timestamps

Thank you for your interest in contributing to MCP Webpage Timestamps! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to fdesablens@gmail.com.

## How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use the issue template** provided
3. **Provide detailed information** including:
   - Steps to reproduce the issue
   - Expected vs actual behavior
   - Environment details (Node.js version, OS, etc.)
   - Sample URLs if applicable

### Suggesting Enhancements

We welcome feature requests and enhancements! Please:

1. **Check existing feature requests** first
2. **Describe the use case** clearly
3. **Explain the expected behavior**
4. **Consider the impact** on existing functionality

### Development Process

1. **Fork the repository**
2. **Create a feature branch** from `main`
3. **Make your changes**
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Submit a pull request**

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn
- Git

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/Fabien-desablens/mcp-webpage-timestamps.git
cd mcp-webpage-timestamps

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Development Workflow

```bash
# Start development mode with hot reload
npm run dev

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Code Style

### TypeScript

- Use TypeScript for all new code
- Enable strict type checking
- Provide type annotations for public APIs
- Use meaningful variable and function names

### Code Formatting

- Use Prettier for code formatting
- Follow existing code style
- Run `npm run format` before committing

### Linting

- Use ESLint with the provided configuration
- Fix all linting errors before submitting
- Run `npm run lint` to check for issues

## Testing

### Test Requirements

- **Unit tests** for all new functionality
- **Integration tests** for external dependencies
- **Error handling tests** for edge cases
- **Maintain 90%+ code coverage**

### Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    // Setup
  });

  describe('methodName', () => {
    it('should do something specific', () => {
      // Test implementation
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- extractor.test.ts

# Run tests in watch mode
npm run test:watch
```

## Documentation

### README Updates

- Update the README.md for new features
- Include examples for new functionality
- Update API documentation as needed

### Code Documentation

- Use JSDoc comments for public APIs
- Include parameter descriptions and return types
- Provide usage examples for complex functions

### Changelog

- Add entries to CHANGELOG.md for notable changes
- Follow [Keep a Changelog](https://keepachangelog.com/) format
- Include breaking changes, new features, and bug fixes

## Pull Request Process

### Before Submitting

1. **Ensure tests pass**: `npm test`
2. **Check code quality**: `npm run lint`
3. **Format code**: `npm run format`
4. **Update documentation** as needed
5. **Add changelog entry** if applicable

### Pull Request Template

```markdown
## Description

Brief description of the changes made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass
- [ ] Code coverage maintained

## Checklist

- [ ] Code follows the project's style guidelines
- [ ] Self-review of code completed
- [ ] Code is commented, particularly in hard-to-understand areas
- [ ] Documentation updated
- [ ] No new warnings or errors introduced
```

### Review Process

1. **Automated checks** must pass (CI/CD pipeline)
2. **Code review** by maintainers
3. **Address feedback** promptly
4. **Final approval** and merge

## Architectural Guidelines

### Project Structure

```
src/
├── types.ts          # Type definitions
├── extractor.ts      # Main extraction logic
├── index.ts          # MCP server implementation
└── __tests__/        # Test files
    ├── extractor.test.ts
    ├── integration.test.ts
    └── server.test.ts
```

### Design Principles

- **Separation of Concerns**: Keep extraction logic separate from MCP server logic
- **Error Handling**: Graceful error handling with detailed error messages
- **Performance**: Efficient extraction with configurable timeouts
- **Extensibility**: Easy to add new timestamp sources
- **Testability**: Code should be easily testable

### Adding New Timestamp Sources

To add a new timestamp source:

1. **Update types.ts** with new source type
2. **Add extraction method** in extractor.ts
3. **Update consolidation logic** if needed
4. **Add comprehensive tests**
5. **Update documentation**

Example:

```typescript
private extractFromNewSource($: cheerio.CheerioAPI): TimestampSource[] {
  const sources: TimestampSource[] = [];
  
  // Extraction logic here
  
  return sources;
}
```

## Performance Considerations

- **Timeout Configuration**: Respect user-defined timeouts
- **Memory Usage**: Avoid loading large HTML documents into memory unnecessarily
- **Concurrent Requests**: Use appropriate concurrency limits for batch operations
- **Caching**: Consider caching strategies for frequently accessed URLs

## Security Considerations

- **Input Validation**: Validate all user inputs
- **URL Safety**: Prevent access to internal/local URLs
- **Rate Limiting**: Implement appropriate rate limiting
- **User Agent**: Use appropriate user agent strings

## Release Process

1. **Version Bump**: Update package.json version
2. **Changelog**: Update CHANGELOG.md
3. **Tag Release**: Create git tag
4. **Build**: Generate distribution files
5. **Publish**: Publish to npm (maintainers only)

## Getting Help

- **Documentation**: Check the README and code comments
- **Issues**: Search existing issues for similar problems
- **Discussions**: Use GitHub Discussions for questions
- **Contact**: Reach out to maintainers for complex issues

## Recognition

Contributors will be recognized in:

- **CONTRIBUTORS.md** file
- **GitHub contributors** section
- **Release notes** for significant contributions

Thank you for contributing to MCP Webpage Timestamps!