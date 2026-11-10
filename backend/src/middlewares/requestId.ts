import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const UUID_REGEX = /^[0-9a-fA-F-]{8,64}$/;

export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const headerId = req.headers['x-request-id'];
  let validId: string;

  if (typeof headerId === 'string' && UUID_REGEX.test(headerId)) {
    validId = headerId;
  } else {
    validId = crypto.randomUUID();
  }

  req.id = validId;
  res.setHeader('X-Request-Id', validId);
  next();
};
