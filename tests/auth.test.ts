import { describe, it, expect, vi } from 'vitest';
import { createAuthMiddleware } from '../src/auth.js';

describe('createAuthMiddleware', () => {
  it('permite request con token correcto', () => {
    const middleware = createAuthMiddleware('secret');
    let nextCalled = false;
    const req = { headers: { authorization: 'Bearer secret' } } as any;
    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();
    const res = { status: statusMock, json: jsonMock } as any;
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    expect(nextCalled).toBe(true);
    expect(statusMock).not.toHaveBeenCalled();
  });

  it('rechaza sin header Authorization', () => {
    const middleware = createAuthMiddleware('secret');
    const req = { headers: {} } as any;
    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();
    const res = { status: statusMock, json: jsonMock } as any;
    const next = vi.fn();

    middleware(req, res, next);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rechaza con token incorrecto', () => {
    const middleware = createAuthMiddleware('secret');
    const req = { headers: { authorization: 'Bearer wrong' } } as any;
    const statusMock = vi.fn().mockReturnThis();
    const jsonMock = vi.fn();
    const res = { status: statusMock, json: jsonMock } as any;
    const next = vi.fn();

    middleware(req, res, next);
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
