export type EntityId = string;

export interface ApiSuccess<T> {
  success: true;
  data: T;
  requestId: string;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
  requestId: string;
}

export const isEntityId = (value: string): boolean => /^[1-9]\d*$/.test(value);
