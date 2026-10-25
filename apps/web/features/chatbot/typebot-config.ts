export interface TypebotWidgetConfig {
  enabled: boolean;
  publicId: string | null;
  reason: 'enabled' | 'disabled' | 'missing_public_id' | 'invalid_public_id';
}

interface TypebotEnvironmentInput {
  enabled?: string | undefined;
  publicId?: string | undefined;
}

const publicIdPattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,127}$/u;

export const resolveTypebotWidgetConfig = (input: TypebotEnvironmentInput): TypebotWidgetConfig => {
  return { enabled: false, publicId: null, reason: 'disabled' };
};

export const typebotWidgetConfig: TypebotWidgetConfig = {
  enabled: false,
  publicId: null,
  reason: 'disabled',
};