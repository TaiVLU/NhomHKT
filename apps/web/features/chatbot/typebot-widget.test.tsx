import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeTypebot, TypebotWidget } from './typebot-widget';
import type { TypebotWidgetConfig } from './typebot-config';

const enabled: TypebotWidgetConfig = {
  enabled: true,
  publicId: 'hktstore-assistant-2026',
  reason: 'enabled',
};
const disabled: TypebotWidgetConfig = {
  enabled: false,
  publicId: null,
  reason: 'missing_public_id',
};

const publishRuntimeState = (state: 'initialized' | 'open' | 'failed') => {
  window.__hktTypebotState = state;
  fireEvent(window, new CustomEvent('hkt:typebot-state', { detail: state }));
};

afterEach(() => {
  cleanup();
  document.getElementById('hkt-typebot-embed')?.remove();
  document.getElementById('hkt-typebot-bubble')?.remove();
  delete window.__hktTypebot;
  delete window.__hktTypebotInitialized;
  delete window.__hktTypebotState;
  vi.restoreAllMocks();
});

describe('TypebotWidget', () => {
  it('renders nothing and loads no script when configuration is absent', () => {
    render(<TypebotWidget config={disabled} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(document.getElementById('hkt-typebot-embed')).toBeNull();
  });

  it('uses correct UTF-8 text, accessible name and a non-submit button', () => {
    render(<TypebotWidget config={enabled} />);
    const launcher = screen.getByRole('button', { name: 'Mở Trợ lý HKT Store' });
    expect(launcher).toHaveTextContent('Trợ lý HKT Store');
    expect(launcher).toHaveAttribute('type', 'button');
    expect(launcher).toHaveClass('typebot-launcher');
  });

  it('keeps the launcher inert until the UI is initialized', () => {
    const toggle = vi.fn();
    window.__hktTypebot = { toggle };
    render(<TypebotWidget config={enabled} />);
    const launcher = screen.getByRole('button', { name: 'Mở Trợ lý HKT Store' });
    expect(launcher).toBeDisabled();
    fireEvent.click(launcher);
    expect(toggle).not.toHaveBeenCalled();

    publishRuntimeState('initialized');
    expect(launcher).toBeEnabled();
  });

  it('keeps client-only loading and mobile safe-area placement explicit', () => {
    const source = readFileSync(join(process.cwd(), 'features/chatbot/typebot-widget.tsx'), 'utf8');
    const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
    expect(source.startsWith("'use client';")).toBe(true);
    expect(source).toContain('requestIdleCallback');
    expect(css).toContain('.typebot-launcher {\n  position: fixed;');
    expect(css).toContain('env(safe-area-inset-bottom)');
    expect(css).toContain('min-height: 48px');
  });

  it('injects and initializes the official bubble module once', () => {
    initializeTypebot(enabled);
    initializeTypebot(enabled);
    const scripts = document.querySelectorAll('#hkt-typebot-embed');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toHaveAttribute('type', 'module');
    expect(scripts[0]?.textContent).toContain('@typebot.io/js@0/dist/web.js');
    expect(scripts[0]?.textContent).toContain('Typebot.initBubble');
    expect(scripts[0]?.textContent).toContain('button: { isHidden: true }');
    expect(scripts[0]?.textContent).toContain("maxWidth: '400px'");
    expect(scripts[0]?.textContent).toContain('hktstore-assistant-2026');
    expect(scripts[0]?.textContent).not.toMatch(/authorization|cookie|token|secret/iu);
  });

  it('opens the initialized singleton without reinitializing on repeated clicks', () => {
    const toggle = vi.fn();
    window.__hktTypebot = { toggle };
    window.__hktTypebotInitialized = true;
    window.__hktTypebotState = 'initialized';
    const { rerender } = render(<TypebotWidget config={enabled} />);
    const launcher = screen.getByRole('button', { name: 'Mở Trợ lý HKT Store' });

    fireEvent.click(launcher);
    fireEvent.click(launcher);
    rerender(<TypebotWidget config={enabled} />);

    expect(toggle).toHaveBeenCalledTimes(2);
    expect(toggle).toHaveBeenCalledWith({ id: 'hkt-typebot-bubble' });
    expect(document.querySelectorAll('#hkt-typebot-embed')).toHaveLength(0);
  });

  it('reflects open and close callbacks without inventing DOM state detection', () => {
    window.__hktTypebot = { toggle: vi.fn() };
    window.__hktTypebotInitialized = true;
    render(<TypebotWidget config={enabled} />);
    const launcher = screen.getByRole('button', { name: 'Mở Trợ lý HKT Store' });

    publishRuntimeState('open');
    expect(launcher).toHaveAttribute('aria-expanded', 'true');
    expect(launcher).toHaveAccessibleName('Đóng Trợ lý HKT Store');
    publishRuntimeState('initialized');
    expect(launcher).toHaveAttribute('aria-expanded', 'false');
    expect(launcher).toHaveAccessibleName('Mở Trợ lý HKT Store');
    expect(launcher).toBeEnabled();
  });

  it('fails closed without crashing the public shell', () => {
    render(<TypebotWidget config={enabled} />);
    publishRuntimeState('failed');
    const launcher = screen.getByRole('button', { name: 'Mở Trợ lý HKT Store' });
    expect(launcher).toBeDisabled();
    expect(launcher).toHaveAttribute('title', 'Trợ lý hiện chưa sẵn sàng');
  });

  it('maps a browser module load failure to the safe failed state', () => {
    initializeTypebot(enabled);
    render(<TypebotWidget config={enabled} />);
    const script = document.getElementById('hkt-typebot-embed');
    expect(script).not.toBeNull();

    fireEvent.error(script as HTMLScriptElement);

    const launcher = screen.getByRole('button', { name: 'Mở Trợ lý HKT Store' });
    expect(launcher).toBeDisabled();
    expect(launcher).toHaveAttribute('data-state', 'failed');
  });
});