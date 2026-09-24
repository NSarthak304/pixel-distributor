/**
 * Pixel Distributor - APK Release Management Service
 *
 * Implements Specification Sections 17 & 18.
 */

import { AppRelease, CreateAppReleaseInput } from '@pixel/shared';

export class ReleaseService {
  /**
   * Publishes a new official Android APK release.
   */
  public static publishRelease(
    input: CreateAppReleaseInput,
    latestActiveRelease: AppRelease | null,
    actorId: string
  ): AppRelease {
    // Version code monotonicity check
    if (latestActiveRelease && input.versionCode <= latestActiveRelease.versionCode) {
      throw new Error(
        `Version code must be strictly greater than active release version code (${latestActiveRelease.versionCode})`
      );
    }

    const now = new Date().toISOString();
    const releaseId = `REL-v${input.version}`;

    return {
      releaseId,
      version: input.version,
      versionCode: input.versionCode,
      releaseDate: now,
      downloadUrl: input.downloadUrl,
      checksum: input.checksum.toLowerCase(),
      fileSize: input.fileSize,
      releaseNotes: input.releaseNotes,
      minimumSupportedVersion: input.minimumSupportedVersion,
      minimumVersionCode: input.minimumVersionCode,
      mandatory: input.mandatory,
      status: input.status,
      publishedBy: actorId,
      createdAt: now,
    };
  }

  /**
   * Evaluates version check for client APK.
   */
  public static evaluateClientVersion(
    clientVersionCode: number,
    activeRelease: AppRelease
  ): {
    updateRequired: boolean;
    isMandatory: boolean;
    release: AppRelease;
  } {
    const updateRequired = clientVersionCode < activeRelease.versionCode;
    const isMandatory =
      clientVersionCode < activeRelease.minimumVersionCode || activeRelease.mandatory === true;

    return {
      updateRequired,
      isMandatory,
      release: activeRelease,
    };
  }
}
