import type {
  TransformationRequest,
  TransformationResult,
  ProviderCredential,
  CredentialSubmission,
} from '../types';

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export namespace TransformAPI {
  export type Request = TransformationRequest;
  export type Response = ApiResponse<TransformationResult>;
}

export namespace CredentialsAPI {
  export type CreateRequest = CredentialSubmission;
  export type CreateResponse = ApiResponse<ProviderCredential>;
  export type ListResponse = PaginatedResponse<ProviderCredential>;
}
