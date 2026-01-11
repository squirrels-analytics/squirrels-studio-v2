export interface UserInfo {
  username: string;
  access_level: "admin" | "member";
  custom_fields: Record<string, unknown>;
}

export interface UserSessionResponse {
  user: UserInfo;
  session_expiry_timestamp: number;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ApiKeyRequestBody {
  title: string;
  expiry_minutes: number | null;
}

export interface ApiKeyResponse {
  api_key: string;
}

export interface RegisteredApiKey {
  id: string;
  last_four: string;
  title: string;
  created_at: string;
  expires_at: string | null;
}

interface AuthProviderItem {
  name: string;
  label: string;
  icon: string;
  login_url: string;
}

export type AuthProvidersResponse = AuthProviderItem[];
