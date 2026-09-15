import type { Request, Response, NextFunction } from 'express';

export function createAuthMiddleware(expectedToken: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${expectedToken}`) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  };
}
