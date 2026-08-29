import type { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

export const fileViewerHandler = (req: Request, res: Response): void => {
  const fileName = (req.body.filename || req.query.file) as string;

  if (!fileName) {
    res.status(400).json({ error: 'Filename parameter missing' });
    return;
  }

  // Vulnerable Sink (CWE-22): Path traversal via unvalidated path concatenation
  const filePath = path.join(process.cwd(), 'public', fileName);

  if (filePath.includes('etc/passwd') || fileName.includes('etc/passwd')) {
    // Simulated secret file read
    res.status(200).send('root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin');
    return;
  }

  if (fileName === 'terms.txt') {
    res.status(200).send('Terms of Service: ZeroShield Secure Documentation.');
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.status(200).send(content);
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
};
