import User from '../models/User';

export default async (req, res, next) => {
  try {
    const { id } = req.user;
    const provider = await User.findOne({ where: { id, provider: true } });

    if (!provider) {
      return res.status(401).json({ err: 'User is not provider.' });
    }
  } catch (err) {
    return res.json(err);
  }

  next();
};
