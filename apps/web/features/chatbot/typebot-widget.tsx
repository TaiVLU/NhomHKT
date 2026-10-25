'use client';

import { useEffect, useState } from 'react';
import { typebotWidgetConfig, type TypebotWidgetConfig } from './typebot-config';

const SCRIPT_ID = 'hkt-typebot-embed';
const INSTANCE_ID = 'hkt-typebot-bubble';
const STATE_EVENT = 'hkt:typebot-state';
const EMBED_MODULE_URL = 'https://cdn.jsdelivr.net/npm/@typebot.io/js@0/dist/web.js';

export type TypebotRuntimeState = 'disabled' | 'loading-script' | 'initialized' | 'open' | 'failed';

interface TypebotBrowserApi {
  toggle: (options?: { id?: string }) => void;
}

declare global {
  interface Window {
    __hktTypebot?: TypebotBrowserApi;
    __hktTypebotInitialized?: boolean;
    __hktTypebotState?: TypebotRuntimeState;
  }
}

const currentRuntimeState = (): TypebotRuntimeState => {
  if (window.__hktTypebotState) return window.__hktTypebotState;
  return window.__hktTypebotInitialized && window.__hktTypebot
    ? 'initialized'
    : 'loading-script';
};

export const initializeTypebot = (config: TypebotWidgetConfig): void => {
  if (!config.enabled || !config.publicId) return;
  if (window.__hktTypebotInitialized && window.__hktTypebot) return;
  if (document.getElementById(SCRIPT_ID)) return;

  window.__hktTypebotState = 'loading-script';
  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.type = 'module';
  script.dataset.typebotPublicId = config.publicId;
  script.addEventListener(
    'error',
    () => {
      window.__hktTypebotState = 'failed';
      window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: 'failed' }));
    },
    { once: true },
  );
  script.textContent = `
    import Typebot from ${JSON.stringify(EMBED_MODULE_URL)};
    const publishState = (state) => {
      window.__hktTypebotState = state;
      window.dispatchEvent(new CustomEvent(${JSON.stringify(STATE_EVENT)}, { detail: state }));
    };
    try {
      if (!window.__hktTypebotInitialized) {
        Typebot.initBubble({
          id: ${JSON.stringify(INSTANCE_ID)},
          typebot: ${JSON.stringify(config.publicId)},
          onOpen: () => publishState('open'),
          onClose: () => publishState('initialized'),
          inlineStyle: { 'z-index': '55' },
          theme: {
            button: { isHidden: true },
            chatWindow: {
              backgroundColor: '#ffffff',
              maxWidth: '400px',
              maxHeight: '704px'
            }
          }
        });
        window.__hktTypebot = Typebot;
        window.__hktTypebotInitialized = true;
      }
      await customElements.whenDefined('typebot-bubble');
      await new Promise((resolve) => requestAnimationFrame(resolve));
      publishState('initialized');
    } catch {
      publishState('failed');
    }
  `;
  document.body.append(script);
};

const toggleTypebot = (): void => {
  window.__hktTypebot?.toggle({ id: INSTANCE_ID });
};

export function TypebotWidget({ config = typebotWidgetConfig }: { config?: TypebotWidgetConfig }) {
  const [runtimeState, setRuntimeState] = useState<TypebotRuntimeState>(
    config.enabled ? 'loading-script' : 'disabled',
  );

  useEffect(() => {
    if (!config.enabled) {
      setRuntimeState('disabled');
      return undefined;
    }

    const handleState = (event: Event) => {
      const state = (event as CustomEvent<TypebotRuntimeState>).detail;
      if (state) setRuntimeState(state);
    };
    window.addEventListener(STATE_EVENT, handleState);
    setRuntimeState(currentRuntimeState());

    const load = () => initializeTypebot(config);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(load, { timeout: 2500 });
      return () => {
        window.cancelIdleCallback(id);
        window.removeEventListener(STATE_EVENT, handleState);
      };
    }
    const id = setTimeout(load, 1200);
    return () => {
      clearTimeout(id);
      window.removeEventListener(STATE_EVENT, handleState);
    };
  }, [config]);

  if (!config.enabled) return null;
  const isInteractive = runtimeState === 'initialized' || runtimeState === 'open';
  const isOpen = runtimeState === 'open';

  return (
    <button
      className="typebot-launcher"
      type="button"
      aria-label={isOpen ? 'Đóng hỗ trợ khách hàng' : 'Mở hỗ trợ khách hàng'}
      aria-expanded={isOpen}
      data-state={runtimeState}
      disabled={!isInteractive}
      title={runtimeState === 'failed' ? 'Dịch vụ hỗ trợ hiện chưa sẵn sàng' : undefined}
      onClick={toggleTypebot}
    >
      <span aria-hidden="true">?</span>
      <span>Hỗ trợ khách hàng</span>
    </button>
  );
}