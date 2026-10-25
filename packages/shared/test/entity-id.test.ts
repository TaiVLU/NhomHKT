import { describe, expect, it } from 'vitest';
import { isEntityId } from '../src/index.js';

describe('isEntityId', () => {
  it('accepts positive decimal string IDs without converting to number', () => {
    expect(isEntityId('9223372036854775807')).toBe(true);
    expect(isEntityId('0')).toBe(false);
  });
});
