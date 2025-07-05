export interface TimestampResult {
  url: string;
  createdAt?: Date;
  modifiedAt?: Date;
  publishedAt?: Date;
  sources: TimestampSource[];
  confidence: 'high' | 'medium' | 'low';
  errors?: string[];
}

export interface TimestampSource {
  type: 'html-meta' | 'http-header' | 'json-ld' | 'microdata' | 'opengraph' | 'twitter' | 'heuristic';
  field: string;
  value: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractorConfig {
  timeout?: number;
  userAgent?: string;
  followRedirects?: boolean;
  maxRedirects?: number;
  enableHeuristics?: boolean;
}

export interface FetchResult {
  html: string;
  headers: Record<string, string>;
  finalUrl: string;
  statusCode: number;
}