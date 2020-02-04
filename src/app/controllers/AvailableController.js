import {
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  setSeconds,
  format,
  isAfter,
} from 'date-fns';
import { Op } from 'sequelize';
import Appointments from '../models/Appointment';

class AvailableController {
  /**
   * vai retornar todos os agendamentos de acordo com a data
   * filtrada em formato de timestaps
   */
  async index(req, res) {
    const { date } = req.query;

    if (!date) {
      return res.json({ err: 'Invalid date.' });
    }

    // garantindo que a data é um número
    const searchDate = Number(date);
    const appointments = await Appointments.finkdAll({
      where: {
        provider_id: req.params.providerId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
    });

    // guardar no banco
    const schedule = [
      '08:00',
      '09:00',
      '10:00',
      '11:00',
      '12:00',
      '13:00',
      '14:00',
      '15:00',
      '16:00',
      '17:00',
      '18:00',
      '19:00',
      '20:00',
      '21:00',
      '22:00',
      '23:00',
      '24:00',
    ];

    const available = schedule.map(time => {
      const [hour, minutes] = time.split(':');
      const value = setSeconds(
        setMinutes(setHours(searchDate, hour), minutes),
        0
      );

      return {
        time,
        value: format(value, "yyyy-MM-dd'T'HH:mm:ssxxx"),
        available:
          isAfter(value, new Date()) &&
          !appointments.find(a => format(a.date, 'HH:mm') === time),
      };
    });

    return res.json(available);
  }
}

export default new AvailableController();
