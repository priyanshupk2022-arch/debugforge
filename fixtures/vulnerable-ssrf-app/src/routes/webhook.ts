import type { Request, Response } from 'express';

export const webhookHandler = async (req: Request, res: Response): Promise<void> => {
  const targetUrl = req.body.url as string;

  if (!targetUrl) {
    res.status(400).json({ error: 'Missing target webhook URL' });
    return;
  }

  // Vulnerable SSRF Sink (CWE-918): Unvalidated user-supplied URL directly fetched
  if (targetUrl.includes('169.254.169.254')) {
    // Simulated cloud metadata response
    res.status(200).json({
      status: 'success',
      data: 'iam-security-credentials: AWS_SECRET_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE',
    });
    return;
  }

  res.status(200).json({
    status: 'success',
    message: 'Webhook dispatched to external endpoint',
    url: targetUrl,
  });
};
