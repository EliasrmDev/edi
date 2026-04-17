import type { TransformationRequest } from '@edi/shared';

export type ExtensionMessageType =
  | 'OPEN_MODAL'
  | 'GET_AUTH_TOKEN'
  | 'STORE_AUTH_TOKEN'
  | 'CLEAR_AUTH_TOKEN'
  | 'PROXY_API_CALL';

export interface OpenModalMessage {
  type: 'OPEN_MODAL';
  payload: { selectedText: string };
}

export interface ProxyAPIMessage {
  type: 'PROXY_API_CALL';
  payload: {
    endpoint: string;
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: TransformationRequest | Record<string, unknown>;
  };
}

export interface StoreAuthTokenMessage {
  type: 'STORE_AUTH_TOKEN';
  payload: { token: string; expiresAt: number };
}

export type ExtensionMessage =
  | OpenModalMessage
  | ProxyAPIMessage
  | StoreAuthTokenMessage
  | { type: 'GET_AUTH_TOKEN' }
  | { type: 'CLEAR_AUTH_TOKEN' };
