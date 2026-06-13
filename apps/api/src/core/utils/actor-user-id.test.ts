import { describe, expect, it } from 'vitest';
import type { FastifyRequest } from 'fastify';
import { resolveActorUserId } from './actor-user-id';

function mockRequest(user?: { sub?: string; type?: string }): FastifyRequest {
  return { user } as FastifyRequest;
}

describe('resolveActorUserId', () => {
  it('testResolveActorUserId_whenTenantUser_shouldReturnSub', () => {
    expect(
      resolveActorUserId(
        mockRequest({ sub: 'user-uuid-1', type: 'tenant_user' }),
      ),
    ).toBe('user-uuid-1');
  });

  it('testResolveActorUserId_whenPlatformAdmin_shouldReturnUndefined', () => {
    expect(
      resolveActorUserId(
        mockRequest({ sub: 'admin-uuid-1', type: 'platform_admin' }),
      ),
    ).toBeUndefined();
  });

  it('testResolveActorUserId_whenUserMissing_shouldReturnUndefined', () => {
    expect(resolveActorUserId(mockRequest(undefined))).toBeUndefined();
  });
});
