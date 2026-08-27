import type { Request, Response } from 'express';

export function mergeConfig(target: any, source: any): any {
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = mergeConfig(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

let appConfig: Record<string, any> = {
  theme: 'light',
  notifications: false,
};

export function handleConfigUpdate(req: Request, res: Response): void {
  const updates = req.body || {};
  mergeConfig(appConfig, updates);

  const isPolluted = Boolean((Object.prototype as any).admin || ({} as any).admin);
  const proofSignature = isPolluted ? 'POLLUTED_ADMIN_FLAG' : undefined;

  res.status(200).json({
    status: 'Config updated',
    config: appConfig,
    proofSignature,
  });
}

export function getConfigState(): Record<string, any> {
  return { ...appConfig };
}

export function resetConfigState(): void {
  appConfig = {
    theme: 'light',
    notifications: false,
  };
  delete (Object.prototype as any).admin;
}
