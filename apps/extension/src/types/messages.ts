import type { TransformationRequest } from '@edi/shared';
import type { ImageInfo } from '../image-converter/types';

export type ExtensionMessageType =
  | 'OPEN_MODAL'
  | 'GET_AUTH_TOKEN'
  | 'STORE_AUTH_TOKEN'
  | 'CLEAR_AUTH_TOKEN'
  | 'PROXY_API_CALL'
  | 'TRANSFORM_TEXT'
  | 'PING'
  | 'SCAN_IMAGES'
  | 'FETCH_CONVERT';

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

export interface TransformTextMessage {
  type: 'TRANSFORM_TEXT';
  payload: { text: string; transformation: string };
}

export interface PingMessage {
  type: 'PING';
}

export interface ScanImagesMessage {
  type: 'SCAN_IMAGES';
}

export interface ScanImagesResponse {
  images: ImageInfo[];
}

export interface FetchConvertMessage {
  type: 'FETCH_CONVERT';
  payload: { url: string };
}

export interface FloatingBtnToggleMessage {
  type: 'FLOATING_BTN_TOGGLE';
  payload: { enabled: boolean };
}

export type ExtensionMessage =
  | OpenModalMessage
  | ProxyAPIMessage
  | StoreAuthTokenMessage
  | TransformTextMessage
  | PingMessage
  | ScanImagesMessage
  | FetchConvertMessage
  | FloatingBtnToggleMessage
  | { type: 'GET_AUTH_TOKEN' }
  | { type: 'CLEAR_AUTH_TOKEN' };
