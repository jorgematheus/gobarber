import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';
import User from '../models/User';
import Appointment from '../models/Appointment';

class ScheduleController {
  async index(req, res) {
    try {
      const checkUserProvider = await User.findOne({
        where: { provider: true, id: req.user.id },
      });

      if (!checkUserProvider) {
        return res.status(400).json({ error: 'User is not provider.' });
      }

      const { date } = req.query;

      const parseDate = parseISO(date);

      const appointments = await Appointment.findAll({
        where: {
          provider_id: req.user.id,
          canceled_at: null,
          date: {
            [Op.between]: [startOfDay(parseDate), endOfDay(parseDate)],
          },
        },
        order: ['date'],
      });

      return res.json(appointments);
    } catch (err) {
      return res.status(400).json(err);
    }
  }
}

export default new ScheduleController();
