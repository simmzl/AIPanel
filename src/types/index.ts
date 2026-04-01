export interface Bookmark {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  favicon: string;
  category: string;
  order: number;
  categoryOrder?: number;
}

export interface BookmarkPayload {
  url: string;
  title: string;
  subtitle: string;
  favicon: string;
  category: string;
  order?: number;
}

export interface MetaResponse {
  title: string;
  description: string;
  favicon: string;
}

export interface AuthResponse {
  token: string;
}


export interface ApiErrorPayload {
  message: string;
  code?: string;
  details?: {
    authorizationUrl?: string;
    permissionViolations?: Array<{ type?: string; subject?: string }>;
    requestId?: string;
    rawMessage?: string;
    [key: string]: unknown;
  };
}
