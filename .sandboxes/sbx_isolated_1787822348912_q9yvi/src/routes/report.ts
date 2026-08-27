import { exec } from 'child_process';
import type { Request, Response } from 'express';

export function handlePaymentReport(req: Request, res: Response): void {
  const commandInput = req.body?.command || '';

  // Unsafe Command Injection Sink (CWE-78)
  exec('echo Generating report for: ' + commandInput, (error, stdout) => {
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(200).json({ status: 'Report generated successfully', output: stdout.trim() });
  });
}
