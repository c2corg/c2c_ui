// The API refuses a session when its token is no longer valid: unknown, expired or revoked (401 'Invalid token'), or
// when the account was blocked (403 'account blocked')

export type SessionRefusal = 'invalid' | 'blocked';

const REFUSALS: Record<number, [string, SessionRefusal]> = {
  401: ['Invalid token', 'invalid'],
  403: ['account blocked', 'blocked'],
};

/**
 * Why the API refused the session of a failed request, if it did. Only a request sent with the current token counts:
 * the answer to a request of a former session (e.g. sent before a new sign in) is not about this session.
 */
export function sessionRefusal(error: unknown, currentAuthorization: unknown): SessionRefusal | null {
  const { response, config } = (error ?? {}) as {
    response?: { status?: number; data?: unknown };
    config?: { headers?: Record<string, unknown> };
  };
  const refusal = REFUSALS[response?.status ?? 0];
  const sent = config?.headers?.Authorization;
  if (!refusal || !sent || sent !== currentAuthorization) {
    return null;
  }
  const { errors } = (response?.data ?? {}) as { errors?: Array<{ description?: unknown }> };
  const refused = Array.isArray(errors) && errors.some((e) => e?.description === refusal[0]);
  return refused ? refusal[1] : null;
}
