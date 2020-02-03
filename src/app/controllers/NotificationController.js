import Notification from '../schemas/Notification';

class NotificationController {
  async index(req, res) {
    try {
      const { id: user } = req.user;
      const notifications = await Notification.find({ user })
        .sort({ createdAt: -1 })
        .limit(20);

      return res.json(notifications);
    } catch (err) {
      return res.json(err);
    }
  }

  async update(req, res) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { read: true },
        // retorna a nova autenticacao alterada
        { new: true }
      );
      return res.json(notification);
    } catch (err) {
      return res.json(err);
    }
  }
}

export default new NotificationController();
