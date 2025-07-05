import axios, { type AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { parseISO, isValid } from 'date-fns';
import type { TimestampResult, TimestampSource, ExtractorConfig, FetchResult } from './types.js';

export class TimestampExtractor {
  private config: Required<ExtractorConfig>;

  constructor(config: ExtractorConfig = {}) {
    this.config = {
      timeout: config.timeout ?? 10000,
      userAgent: config.userAgent ?? 'Mozilla/5.0 (compatible; MCP-Webpage-Timestamps/1.0)',
      followRedirects: config.followRedirects ?? true,
      maxRedirects: config.maxRedirects ?? 5,
      enableHeuristics: config.enableHeuristics ?? true,
    };
  }

  async extractTimestamps(url: string): Promise<TimestampResult> {
    const errors: string[] = [];
    let fetchResult: FetchResult;

    try {
      fetchResult = await this.fetchPage(url);
    } catch (error) {
      return {
        url,
        sources: [],
        confidence: 'low',
        errors: [`Failed to fetch page: ${error instanceof Error ? error.message : String(error)}`],
      };
    }

    const $ = cheerio.load(fetchResult.html);
    const sources: TimestampSource[] = [];

    // Extract timestamps from various sources
    sources.push(...this.extractFromHtmlMeta($));
    sources.push(...this.extractFromHttpHeaders(fetchResult.headers));
    sources.push(...this.extractFromJsonLd($));
    sources.push(...this.extractFromMicrodata($));
    sources.push(...this.extractFromOpenGraph($));
    sources.push(...this.extractFromTwitterCards($));
    
    if (this.config.enableHeuristics) {
      sources.push(...this.extractFromHeuristics($));
    }

    const result = this.consolidateTimestamps(url, sources);
    
    if (errors.length > 0) {
      result.errors = errors;
    }

    return result;
  }

  private async fetchPage(url: string): Promise<FetchResult> {
    const config: AxiosRequestConfig = {
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
      },
      maxRedirects: this.config.maxRedirects,
      validateStatus: (status) => status < 400,
    };

    const response = await axios.get(url, config);
    
    return {
      html: response.data,
      headers: response.headers as Record<string, string>,
      finalUrl: response.request.responseURL || url,
      statusCode: response.status,
    };
  }

  private extractFromHtmlMeta($: cheerio.CheerioAPI): TimestampSource[] {
    const sources: TimestampSource[] = [];
    const metaTags = [
      { name: 'article:published_time', type: 'publishedAt' },
      { name: 'article:modified_time', type: 'modifiedAt' },
      { name: 'date', type: 'publishedAt' },
      { name: 'pubdate', type: 'publishedAt' },
      { name: 'publishdate', type: 'publishedAt' },
      { name: 'last-modified', type: 'modifiedAt' },
      { name: 'dc.date.created', type: 'createdAt' },
      { name: 'dc.date.modified', type: 'modifiedAt' },
      { name: 'dcterms.created', type: 'createdAt' },
      { name: 'dcterms.modified', type: 'modifiedAt' },
    ];

    metaTags.forEach(({ name }) => {
      const content = $(`meta[name="${name}"], meta[property="${name}"]`).attr('content');
      if (content) {
        const date = this.parseDate(content);
        if (date) {
          sources.push({
            type: 'html-meta',
            field: name,
            value: content,
            confidence: 'high',
          });
        }
      }
    });

    return sources;
  }

  private extractFromHttpHeaders(headers: Record<string, string>): TimestampSource[] {
    const sources: TimestampSource[] = [];
    
    if (headers['last-modified']) {
      const date = this.parseDate(headers['last-modified']);
      if (date) {
        sources.push({
          type: 'http-header',
          field: 'last-modified',
          value: headers['last-modified'],
          confidence: 'medium',
        });
      }
    }

    if (headers.date) {
      const date = this.parseDate(headers.date);
      if (date) {
        sources.push({
          type: 'http-header',
          field: 'date',
          value: headers.date,
          confidence: 'low',
        });
      }
    }

    return sources;
  }

  private extractFromJsonLd($: cheerio.CheerioAPI): TimestampSource[] {
    const sources: TimestampSource[] = [];
    
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonText = $(element).html();
        if (!jsonText) return;
        
        const data = JSON.parse(jsonText);
        const items = Array.isArray(data) ? data : [data];
        
        items.forEach((item) => {
          if (item.datePublished) {
            const date = this.parseDate(item.datePublished);
            if (date) {
              sources.push({
                type: 'json-ld',
                field: 'datePublished',
                value: item.datePublished,
                confidence: 'high',
              });
            }
          }
          
          if (item.dateModified) {
            const date = this.parseDate(item.dateModified);
            if (date) {
              sources.push({
                type: 'json-ld',
                field: 'dateModified',
                value: item.dateModified,
                confidence: 'high',
              });
            }
          }
          
          if (item.dateCreated) {
            const date = this.parseDate(item.dateCreated);
            if (date) {
              sources.push({
                type: 'json-ld',
                field: 'dateCreated',
                value: item.dateCreated,
                confidence: 'high',
              });
            }
          }
        });
      } catch (error) {
        // Invalid JSON, skip
      }
    });

    return sources;
  }

  private extractFromMicrodata($: cheerio.CheerioAPI): TimestampSource[] {
    const sources: TimestampSource[] = [];
    
    $('[itemprop="datePublished"]').each((_, element) => {
      const content = $(element).attr('content') || $(element).text();
      if (content) {
        const date = this.parseDate(content);
        if (date) {
          sources.push({
            type: 'microdata',
            field: 'datePublished',
            value: content,
            confidence: 'high',
          });
        }
      }
    });

    $('[itemprop="dateModified"]').each((_, element) => {
      const content = $(element).attr('content') || $(element).text();
      if (content) {
        const date = this.parseDate(content);
        if (date) {
          sources.push({
            type: 'microdata',
            field: 'dateModified',
            value: content,
            confidence: 'high',
          });
        }
      }
    });

    return sources;
  }

  private extractFromOpenGraph($: cheerio.CheerioAPI): TimestampSource[] {
    const sources: TimestampSource[] = [];
    
    const ogTags = [
      { property: 'og:article:published_time', type: 'publishedAt' },
      { property: 'og:article:modified_time', type: 'modifiedAt' },
      { property: 'og:updated_time', type: 'modifiedAt' },
    ];

    ogTags.forEach(({ property }) => {
      const content = $(`meta[property="${property}"]`).attr('content');
      if (content) {
        const date = this.parseDate(content);
        if (date) {
          sources.push({
            type: 'opengraph',
            field: property,
            value: content,
            confidence: 'high',
          });
        }
      }
    });

    return sources;
  }

  private extractFromTwitterCards($: cheerio.CheerioAPI): TimestampSource[] {
    const sources: TimestampSource[] = [];
    
    const content = $('meta[name="twitter:data1"]').attr('content') || 
                   $('meta[name="twitter:label1"]').attr('content');
    
    if (content && content.toLowerCase().includes('date')) {
      const date = this.parseDate(content);
      if (date) {
        sources.push({
          type: 'twitter',
          field: 'twitter:data1',
          value: content,
          confidence: 'medium',
        });
      }
    }

    return sources;
  }

  private extractFromHeuristics($: cheerio.CheerioAPI): TimestampSource[] {
    const sources: TimestampSource[] = [];
    
    // Look for common date patterns in text
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/g,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g,
      /(\w+ \d{1,2}, \d{4})/g,
      /(\d{1,2} \w+ \d{4})/g,
    ];

    const text = $('time, .date, .published, .timestamp, .created, .modified').text();
    
    datePatterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const date = this.parseDate(match);
          if (date) {
            sources.push({
              type: 'heuristic',
              field: 'text-pattern',
              value: match,
              confidence: 'low',
            });
          }
        });
      }
    });

    // Look for time elements
    $('time').each((_, element) => {
      const datetime = $(element).attr('datetime');
      const text = $(element).text();
      
      if (datetime) {
        const date = this.parseDate(datetime);
        if (date) {
          sources.push({
            type: 'heuristic',
            field: 'time-datetime',
            value: datetime,
            confidence: 'medium',
          });
        }
      } else if (text) {
        const date = this.parseDate(text);
        if (date) {
          sources.push({
            type: 'heuristic',
            field: 'time-text',
            value: text,
            confidence: 'low',
          });
        }
      }
    });

    return sources;
  }

  private parseDate(dateString: string): Date | null {
    if (!dateString) return null;
    
    try {
      // Try ISO format first
      const isoDate = parseISO(dateString);
      if (isValid(isoDate)) {
        return isoDate;
      }
      
      // Try native Date parsing
      const nativeDate = new Date(dateString);
      if (isValid(nativeDate)) {
        return nativeDate;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private consolidateTimestamps(url: string, sources: TimestampSource[]): TimestampResult {
    const result: TimestampResult = {
      url,
      sources,
      confidence: 'low',
    };

    // Group sources by timestamp type
    const publishedSources = sources.filter(s => 
      s.field.includes('published') || s.field.includes('pubdate') || 
      (s.field.includes('date') && !s.field.includes('modified') && !s.field.includes('created') && !s.field.includes('Modified'))
    );
    const modifiedSources = sources.filter(s => 
      s.field.includes('modified') || s.field.includes('updated') || s.field.includes('Modified')
    );
    const createdSources = sources.filter(s => 
      s.field.includes('created') || s.field.includes('Created')
    );

    // Select best timestamp for each type
    if (publishedSources.length > 0) {
      const best = this.selectBestSource(publishedSources);
      const date = this.parseDate(best.value);
      if (date) result.publishedAt = date;
    }

    if (modifiedSources.length > 0) {
      const best = this.selectBestSource(modifiedSources);
      const date = this.parseDate(best.value);
      if (date) result.modifiedAt = date;
    }

    if (createdSources.length > 0) {
      const best = this.selectBestSource(createdSources);
      const date = this.parseDate(best.value);
      if (date) result.createdAt = date;
    }

    // Determine overall confidence
    const highConfidenceSources = sources.filter(s => s.confidence === 'high');
    const mediumConfidenceSources = sources.filter(s => s.confidence === 'medium');
    
    if (highConfidenceSources.length > 0) {
      result.confidence = 'high';
    } else if (mediumConfidenceSources.length > 0) {
      result.confidence = 'medium';
    } else {
      result.confidence = 'low';
    }

    return result;
  }

  private selectBestSource(sources: TimestampSource[]): TimestampSource {
    // Priority: high confidence > medium confidence > low confidence
    // Within same confidence: json-ld > microdata > html-meta > opengraph > http-header > heuristic
    const typeOrder = ['json-ld', 'microdata', 'html-meta', 'opengraph', 'twitter', 'http-header', 'heuristic'];
    
    const sorted = sources.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      }
      
      return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
    });
    
    if (sorted.length === 0) {
      throw new Error('No sources provided to selectBestSource');
    }
    
    const best = sorted[0];
    if (!best) {
      throw new Error('No valid source found');
    }
    
    return best;
  }
}