import 'express';

declare global {
  namespace Express {
    interface Request {
      adminEmail?: string;
      adminRole?: string;
    }
  }
}

export {};
