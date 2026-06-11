import { describe, expect, it } from 'vitest';
import {
  buildEvolutionInstanceUrl,
  parseEvolutionConnectionConfig,
} from './evolution-config.util';

describe('parseEvolutionConnectionConfig', () => {
  it('extracts base URL and instance from path', () => {
    const result = parseEvolutionConnectionConfig('http://localhost:8080/toro-tv');
    expect(result.baseUrl).toBe('http://localhost:8080');
    expect(result.instanceName).toBe('toro-tv');
  });

  it('builds stored instance URL', () => {
    expect(buildEvolutionInstanceUrl('http://localhost:8080', 'toro-tv')).toBe(
      'http://localhost:8080/toro-tv',
    );
  });

  it('decodes percent-encoded instance name from stored URL', () => {
    const result = parseEvolutionConnectionConfig(
      'https://evolution.example.app/Toro%20TV',
    );
    expect(result.baseUrl).toBe('https://evolution.example.app');
    expect(result.instanceName).toBe('Toro TV');
  });
});
