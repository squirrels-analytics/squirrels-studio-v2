import type { ProjectMetadataResponse } from '@/types/project-metadata-response';
import type { DataCatalogResponse, ParametersResponse } from '@/types/data-catalog-response';
import type { AuthProvidersResponse, ChangePasswordRequest, ApiKeyRequestBody, ApiKeyResponse, RegisteredApiKey } from '@/types/auth-responses';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import type { UserSessionResponse } from '@/types/auth-responses';
import type { DatasetResultResponse } from '@/types/dataset-result-response';
import type { ExploreEndpointsResponse } from '@/types/explore-endpoints-response';
import type { UserFieldsResponse, RegisteredUser, AddUserModel, UpdateUserModel } from '@/types/user-fields-response';
import type { ExplorerOptionType } from '@/types/core';
import type { CompiledQueryModel } from '@/types/compiled-query-model';

export type ConfigurableValues = Record<string, string>;

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function fetchWithCredentials(url: string, options: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.error_description || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return response;
}

async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchWithCredentials(url, options);
  return response.json();
}

function toKebabCaseHeaderSegment(name: string): string {
  return name.trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function buildConfigHeaders(configurables?: ConfigurableValues): Record<string, string> {
  if (!configurables) return {};
  const headers: Record<string, string> = {};
  Object.entries(configurables).forEach(([name, value]) => {
    const seg = toKebabCaseHeaderSegment(name);
    if (!seg) return;
    headers[`x-config-${seg}`] = String(value);
  });
  return headers;
}

export async function logout(logoutUrl: string): Promise<void> {
  await fetchWithCredentials(logoutUrl, { method: 'POST' });
}

export async function login(loginUrl: string, formData: URLSearchParams): Promise<UserSessionResponse> {
  return fetchJson(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });
}

export async function fetchAuthProviders(listProvidersUrl: string): Promise<AuthProvidersResponse> {
  return fetchJson<AuthProvidersResponse>(listProvidersUrl);
}

export async function fetchUserSession(userSessionUrl: string): Promise<UserSessionResponse> {
  return fetchJson<UserSessionResponse>(userSessionUrl);
}

export async function fetchExploreEndpoints(hostUrl: string): Promise<ExploreEndpointsResponse> {
  return fetchJson<ExploreEndpointsResponse>(hostUrl + "/");
}

export async function fetchProjectMetadata(
  hostUrl: string,
  setIsLoading: (loading: boolean) => void,
  setProjectMetadata: (metadata: ProjectMetadataResponse) => void,
  setExploreEndpoints: (endpoints: ExploreEndpointsResponse) => void
): Promise<ProjectMetadataResponse> {
  setIsLoading(true);
  try {
    const endpoints = await fetchExploreEndpoints(hostUrl);
    setExploreEndpoints(endpoints);
    const projectMetadataUrl = endpoints.api_versions["0"].project_metadata_url;
    const data = await fetchJson<ProjectMetadataResponse>(projectMetadataUrl);
    setProjectMetadata(data);
    return data;
  } finally {
    setIsLoading(false);
  }
}

export async function fetchDataCatalog(dataCatalogUrl: string): Promise<DataCatalogResponse> {
  return fetchJson<DataCatalogResponse>(dataCatalogUrl);
}

export type SelectionValue = string | number | string[] | [number, number] | Date | DateRange | null | undefined;

function normalizeSelectionValueForApi(value: SelectionValue): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.map(val => String(val));
  } else if (value instanceof Date) {
    return [format(value, 'yyyy-MM-dd')];
  } else if (typeof value === 'object' && ('from' in value || 'to' in value)) {
    const dr = value as { from?: Date; to?: Date };
    const result: string[] = [];
    if (dr.from) result.push(format(dr.from, 'yyyy-MM-dd'));
    if (dr.to) result.push(format(dr.to, 'yyyy-MM-dd'));
    return result;
  } else {
    return [String(value)];
  }
}

export async function fetchProjectParameters(
  projectMetadata: ProjectMetadataResponse,
  parentParam?: string,
  parentSelection?: SelectionValue
): Promise<ParametersResponse> {
  const url = projectMetadata.api_routes.get_parameters_url;
  const queryParams = new URLSearchParams();
  
  if (parentParam && parentSelection !== undefined && parentSelection !== null) {
    queryParams.append('x_parent_param', parentParam);
    const values = normalizeSelectionValueForApi(parentSelection);
    values.forEach(v => queryParams.append(parentParam, v));
  }
  
  const queryString = queryParams.toString();
  const fullUrl = url + (queryString ? '?' + queryString : '');
  return fetchJson<ParametersResponse>(fullUrl);
}

export async function fetchQueryResult(
  projectMetadata: ProjectMetadataResponse,
  sql: string,
  paramOverrides: Record<string, SelectionValue>,
  pagination?: { offset: number; limit: number },
  configurables?: ConfigurableValues
): Promise<DatasetResultResponse> {
  const url = projectMetadata.api_routes.get_query_result_url;
  
  const body: Record<string, unknown> = {
    x_sql_query: sql,
    x_orientation: 'rows',
    x_offset: pagination?.offset ?? 0,
    x_limit: pagination?.limit ?? 1000,
  };

  Object.entries(paramOverrides).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const values = normalizeSelectionValueForApi(value);
    if (values.length === 1) {
      body[key] = values[0];
    } else if (values.length > 1) {
      body[key] = values;
    }
  });

  return fetchJson<DatasetResultResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildConfigHeaders(configurables) },
    body: JSON.stringify(body),
  });
}

export async function fetchAssetParameters(
  projectMetadata: ProjectMetadataResponse,
  exploreType: ExplorerOptionType,
  assetName: string,
  parentParam?: string,
  parentSelection?: SelectionValue
): Promise<ParametersResponse> {
  const url = exploreType === 'Datasets'
    ? projectMetadata.api_routes.get_dataset_parameters_url.replace('{dataset_name}', assetName)
    : projectMetadata.api_routes.get_dashboard_parameters_url.replace('{dashboard_name}', assetName);
  
  const queryParams = new URLSearchParams();
  if (parentParam && parentSelection !== undefined && parentSelection !== null) {
    queryParams.append('x_parent_param', parentParam);
    const values = normalizeSelectionValueForApi(parentSelection);
    values.forEach(v => queryParams.append(parentParam, v));
  }
  
  const queryString = queryParams.toString();
  const fullUrl = url + (queryString ? '?' + queryString : '');
  return fetchJson<ParametersResponse>(fullUrl);
}

export async function fetchAssetResults(
  projectMetadata: ProjectMetadataResponse,
  exploreType: ExplorerOptionType,
  assetName: string,
  paramOverrides: Record<string, SelectionValue>,
  pagination?: { offset: number; limit: number },
  configurables?: ConfigurableValues
): Promise<DatasetResultResponse | Blob | string> {
  const url = exploreType === 'Datasets'
    ? projectMetadata.api_routes.get_dataset_results_url.replace('{dataset_name}', assetName)
    : projectMetadata.api_routes.get_dashboard_results_url.replace('{dashboard_name}', assetName);
  
  const queryParams = new URLSearchParams();
  
  if (exploreType === 'Datasets') {
    queryParams.append('x_orientation', 'rows');
    if (pagination) {
      queryParams.append('x_offset', String(pagination.offset));
      queryParams.append('x_limit', String(pagination.limit));
    }
  }
  
  Object.entries(paramOverrides).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const values = normalizeSelectionValueForApi(value);
    values.forEach(v => queryParams.append(key, v));
  });
  
  const queryString = queryParams.toString();
  const fullUrl = url + (queryString ? '?' + queryString : '');
  
  const response = await fetchWithCredentials(fullUrl, {
    headers: buildConfigHeaders(configurables),
  });
  const contentType = response.headers.get('content-type');
  
  if (contentType?.includes('application/json')) {
    return response.json();
  } else if (contentType?.includes('image/')) {
    return response.blob();
  } else {
    return response.text();
  }
}

export async function fetchCompiledModel(
  projectMetadata: ProjectMetadataResponse,
  modelName: string,
  paramOverrides: Record<string, SelectionValue>,
  configurables?: ConfigurableValues
): Promise<CompiledQueryModel> {
  const url = projectMetadata.api_routes.get_compiled_model_url.replace('{model_name}', modelName);
  
  const body: Record<string, unknown> = {};
  Object.entries(paramOverrides).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const values = normalizeSelectionValueForApi(value);
    if (values.length === 1) {
      body[key] = values[0];
    } else if (values.length > 1) {
      body[key] = values;
    }
  });

  return fetchJson<CompiledQueryModel>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...buildConfigHeaders(configurables) },
    body: JSON.stringify(body),
  });
}

export async function changePassword(url: string, data: ChangePasswordRequest): Promise<void> {
  await fetchWithCredentials(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function fetchApiKeys(url: string): Promise<RegisteredApiKey[]> {
  return fetchJson<RegisteredApiKey[]>(url);
}

export async function createApiKey(url: string, data: ApiKeyRequestBody): Promise<ApiKeyResponse> {
  return fetchJson<ApiKeyResponse>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function revokeApiKey(url: string): Promise<void> {
  await fetchWithCredentials(url, { method: 'DELETE' });
}

export async function fetchUserFields(url: string): Promise<UserFieldsResponse> {
  return fetchJson<UserFieldsResponse>(url);
}

export async function fetchUsers(url: string): Promise<RegisteredUser[]> {
  return fetchJson<RegisteredUser[]>(url);
}

export async function addUser(url: string, data: AddUserModel): Promise<RegisteredUser> {
  return fetchJson<RegisteredUser>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateUser(url: string, data: UpdateUserModel): Promise<RegisteredUser> {
  return fetchJson<RegisteredUser>(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deleteUser(url: string): Promise<void> {
  await fetchWithCredentials(url, { method: 'DELETE' });
}
