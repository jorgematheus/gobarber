import User from '../models/User';
import File from '../models/File';

class ProviderController {
  async index(req, res) {
    try {
      const providers = await User.findAll({
        where: { provider: true },
        attributes: ['id', 'name', 'email'],
        include: [
          {
            model: File,
            as: 'avatar',
            attributes: ['name', 'path', 'url'],
          },
        ],
      });

      res.json(providers);
    } catch (err) {
      res.status(400).json(err);
    }
  }
}

export default new ProviderController();
