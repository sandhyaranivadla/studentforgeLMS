/**
 * Zoom Configuration
 *
 * This file contains configuration for Zoom integration.
 * Phase 4: Modular setup (no actual API calls)
 * Phase 5+: Implement OAuth2 and meeting creation
 *
 * Required env vars (for Phase 5+):
 * - ZOOM_CLIENT_ID
 * - ZOOM_CLIENT_SECRET
 * - ZOOM_ACCOUNT_ID
 * - ZOOM_API_BASE_URL
 */

export const ZOOM_CONFIG = {
  clientId: process.env.ZOOM_CLIENT_ID || '',
  clientSecret: process.env.ZOOM_CLIENT_SECRET || '',
  accountId: process.env.ZOOM_ACCOUNT_ID || '',
  apiBaseUrl: process.env.ZOOM_API_BASE_URL || 'https://zoom.us/oauth/token',
  redirectUri:
    process.env.ZOOM_REDIRECT_URI ||
    'http://localhost:3000/oauth/zoom/callback',
};

export const ZOOM_OAUTH_SCOPES = ['meeting:write', 'meeting:read', 'user:read'];
