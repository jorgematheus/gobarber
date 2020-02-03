import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import authConfig from '../../config/auth';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token is not provided.' });
  }

  const [, token] = authHeader.split(' ');

  try {
    // promisify --> pega função de callback
    // e retorna a mesma para poder  usar async await
    const decoded = await promisify(jwt.verify)(token, authConfig.secret);

    req.user = decoded;

    return next();
  } catch (err) {
    return res.status(401).json({ error: 'token invalid.' });
  }
};
