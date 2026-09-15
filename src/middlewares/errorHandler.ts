import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error('💥 Unhandled Error:', err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'เกิดข้อผิดพลาดขึ้นในระบบ กรุณาลองใหม่อีกครั้ง';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
