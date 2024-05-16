// pages/robots.txt.js

import { NextApiResponse, NextApiRequest } from 'next';

export default function Robots(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Content-Type', 'text/txt');
    res.write(`User-agent: *
Disallow: `);
    res.end();
}