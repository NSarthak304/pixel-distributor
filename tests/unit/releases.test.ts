import { describe, it, expect } from 'vitest';
import { AppRelease } from '../../shared/types/index.js';

export function evaluateUpdateRequirement(
  currentVersionCode: number,
  latestRelease: AppRelease
): { updateRequired: boolean; isMandatory: boolean } {
  if (currentVersionCode >= latestRelease.versionCode) {
    return { updateRequired: false, isMandatory: false };
  }

  const isMandatory =
    currentVersionCode < latestRelease.minimumVersionCode || latestRelease.mandatory === true;

  return {
    updateRequired: true,
    isMandatory,
  };
}

describe('APK Release & Update Policy Evaluator Unit Tests', () => {
  const sampleRelease: AppRelease = {
    releaseId: 'REL-120',
    version: '1.2.0',
    versionCode: 120,
    releaseDate: '2026-09-24T12:00:00Z',
    downloadUrl: 'https://storage.googleapis.com/releases/pixel-app-v1.2.0.apk',
    checksum: 'a'.repeat(64),
    fileSize: 15420100,
    releaseNotes: 'Performance updates',
    minimumSupportedVersion: '1.1.0',
    minimumVersionCode: 110,
    mandatory: false,
    status: 'ACTIVE',
    publishedBy: 'usr_admin',
    createdAt: '2026-09-24T12:00:00Z',
  };

  it('reports no update required when running current latest version', () => {
    const status = evaluateUpdateRequirement(120, sampleRelease);
    expect(status.updateRequired).toBe(false);
    expect(status.isMandatory).toBe(false);
  });

  it('triggers optional update when on supported prior version', () => {
    // Current is 115 (above minimum 110, below latest 120, release is not mandatory)
    const status = evaluateUpdateRequirement(115, sampleRelease);
    expect(status.updateRequired).toBe(true);
    expect(status.isMandatory).toBe(false);
  });

  it('enforces mandatory update when current versionCode falls below minimumVersionCode', () => {
    // Current is 105 (below minimum 110)
    const status = evaluateUpdateRequirement(105, sampleRelease);
    expect(status.updateRequired).toBe(true);
    expect(status.isMandatory).toBe(true);
  });

  it('enforces mandatory update if release is globally marked mandatory', () => {
    const forcedRelease: AppRelease = {
      ...sampleRelease,
      mandatory: true,
    };

    const status = evaluateUpdateRequirement(115, forcedRelease);
    expect(status.updateRequired).toBe(true);
    expect(status.isMandatory).toBe(true);
  });
});
