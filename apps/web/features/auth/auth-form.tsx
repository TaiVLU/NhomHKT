'use client';

import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

export const formText = (form: FormData, name: string): string => {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
};

interface Props {
  title: string;
  children: ReactNode;
  submitLabel: string;
  handleSubmit: (form: FormData) => Promise<void>;
  getErrorMessage?: (error: unknown) => string;
}
export class AuthFormError extends Error {}

export function AuthForm({ title, children, submitLabel, handleSubmit, getErrorMessage }: Props) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      await handleSubmit(new FormData(event.currentTarget));
    } catch (caught) {
      setError(
        caught instanceof AuthFormError
          ? caught.message
          : (getErrorMessage?.(caught) ??
              'Không thể hoàn tất yêu cầu. Vui lòng kiểm tra thông tin.'),
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <main className="auth-page">
      <a className="auth-brand" href="/">
        HKTStore
      </a>
      <h1 className="mb-6 text-3xl font-bold">{title}</h1>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        {children}
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <button
          disabled={pending}
          className="w-full rounded-lg bg-[#7a263a] px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {pending ? 'Đang xử lý…' : submitLabel}
        </button>
      </form>
    </main>
  );
}
export const Field = ({
  label,
  name,
  type = 'text',
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) => (
  <label className="block">
    <span className="mb-1 block font-medium">{label}</span>
    <input
      required
      name={name}
      type={type}
      autoComplete={autoComplete}
      className="w-full rounded-lg border border-[#e7ded5] bg-white px-3 py-2"
    />
  </label>
);
