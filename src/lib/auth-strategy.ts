import type { ProjectMetadataResponse } from '@/types/project-metadata-response';

export type ExternalAuthProjectMetadata = Extract<ProjectMetadataResponse, { auth_strategy: 'external' }>;
export type ManagedAuthProjectMetadata = Exclude<ProjectMetadataResponse, ExternalAuthProjectMetadata>;

/**
 * External auth projects do not expose managed-auth endpoints (login/logout/user-management/etc).
 */
export function isExternalAuthProject(
  projectMetadata: ProjectMetadataResponse | null | undefined
): projectMetadata is ExternalAuthProjectMetadata {
  return !!projectMetadata && projectMetadata.auth_strategy === 'external';
}

/**
 * Managed auth includes the legacy case where `auth_strategy` is omitted.
 */
export function isManagedAuthProject(
  projectMetadata: ProjectMetadataResponse | null | undefined
): projectMetadata is ManagedAuthProjectMetadata {
  return !!projectMetadata && projectMetadata.auth_strategy !== 'external';
}

export function supportsPasswordLogin(projectMetadata: ProjectMetadataResponse | null | undefined): boolean {
  return isManagedAuthProject(projectMetadata);
}

export function supportsLogout(projectMetadata: ProjectMetadataResponse | null | undefined): boolean {
  return isManagedAuthProject(projectMetadata);
}
