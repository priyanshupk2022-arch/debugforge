import { Request, Response } from 'express';

export const userSearchHandler = (req: Request, res: Response): void => {
  const query = (req.body.query || req.query.q) as string;

  if (!query) {
    res.status(400).json({ error: 'Search query parameter missing' });
    return;
  }

  // Vulnerable Sink (CWE-89): Raw SQL Query String Concatenation
  const sqlQuery = `SELECT * FROM users WHERE username = '${query}'`;

  if (query.includes("' OR '1'='1")) {
    // Simulated SQL injection bypass output
    res.status(200).json({
      status: 'success',
      data: [
        { id: 1, username: 'admin', role: 'SUPERUSER', password_hash: 'HASH_TOKEN_0x99' },
        { id: 2, username: 'alice', role: 'MEMBER', password_hash: 'HASH_TOKEN_0x11' },
      ],
    });
    return;
  }

  if (query === 'alice') {
    res.status(200).json({
      status: 'success',
      data: [{ id: 2, username: 'alice', role: 'MEMBER' }],
    });
    return;
  }

  res.status(200).json({ status: 'success', data: [] });
};
