import { describe, expect, it } from 'vitest';
import { resolveTypebotWidgetConfig } from './typebot-config';

describe('resolveTypebotWidgetConfig', () => {
  it('enables a valid public bot ID without secrets', () => {
    expect(
      resolveTypebotWidgetConfig({ enabled: 'true', publicId: 'hktstore-assistant-2026' }),
    ).toEqual({ enabled: true, publicId: 'hktstore-assistant-2026', reason: 'enabled' });
  });

  it('fails safely when disabled or missing configuration', () => {
    expect(resolveTypebotWidgetConfig({})).toEqual({
      enabled: false,
      publicId: null,
      reason: 'disabled',
    });
    expect(resolveTypebotWidgetConfig({ enabled: 'true' }).reason).toBe('missing_public_id');
  });

  it.each(['https://typebot.co/hktstore', 'a', 'bot id', '<script>'])(
    'rejects malformed public ID %s',
    (publicId) =>
      expect(resolveTypebotWidgetConfig({ enabled: 'true', publicId }).reason).toBe(
        'invalid_public_id',
      ),
  );
});