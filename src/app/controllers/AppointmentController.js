import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';
import Queue from '../../lib/Queue';
import CancellationMail from '../jobs/CancellationMail';

class AppointmentController {
  async index(req, res) {
    try {
      const { page = 1 } = req.query;
      const { id } = req.user;

      const userappointments = await Appointment.findAll({
        where: { user_id: id, canceled_at: null },
        order: ['date'],
        attributes: ['id', 'date', 'past', 'cancelable'],
        limit: 20,
        offset: (page - 1) * 20,
        include: [
          {
            model: User,
            as: 'provider',
            attributes: ['id', 'name'],
            include: [
              {
                model: File,
                as: 'avatar',
                attributes: ['id', 'path', 'url'],
              },
            ],
          },
        ],
      });

      return res.json(userappointments);
    } catch (err) {
      return res.json(err);
    }
  }

  async store(req, res) {
    try {
      const schema = Yup.object().shape({
        provider_id: Yup.number().required(),
        date: Yup.date().required(),
      });

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Validation fails.' });
      }

      const { provider_id, date } = req.body;

      /**
       *  Checa se o provider_id é realmente um provider
       */

      const isProvider = await User.findOne({
        where: { id: provider_id, provider: true },
      });

      if (!isProvider) {
        return res.status(401).json({ error: 'Provider not found.' });
      }

      if (provider_id === req.user.id) {
        return res.json({
          error: 'Você não pode marcar um agendamento para si próprio!',
        });
      }

      /**
       * startOfHour ignroa os minutos e pega apenas as horas
       * exemplo: 19:30:00 vira 19:00
       */

      const hourStart = startOfHour(parseISO(date));

      // verificando se hourStart é menor do que a data atual
      if (isBefore(hourStart, new Date())) {
        return res.status(400).json({ error: 'Date is not permitted' });
      }

      /**
       *  checa se existe um horário disponivelv para aquele provider
       *  se retornar null, existe horario disponivel
       */
      const dateIsNotAvailable = await Appointment.findOne({
        where: {
          provider_id,
          canceled_at: null,
          date: hourStart,
        },
      });

      if (dateIsNotAvailable) {
        return res
          .status(400)
          .json({ error: 'Scheduling date not available.' });
      }

      const appointment = await Appointment.create({
        user_id: req.user.id,
        provider_id,
        date: hourStart,
      });

      /**
       * Notify appointment provider
       */

      const formattedDate = format(
        hourStart,
        "'dia' dd 'de' MMMM', ás' H:mm'h'",
        { locale: pt }
      );
      await Notification.create({
        content: `Novo agendamento de ${req.user.name} para ${formattedDate}`,
        user: provider_id,
      });

      return res.json(appointment);
    } catch (err) {
      return res.json(err);
    }
  }

  async delete(req, res) {
    try {
      const appointment = await Appointment.findByPk(req.params.id, {
        include: [
          { model: User, as: 'provider', attributes: ['name', 'email'] },
          { model: User, as: 'user', attributes: ['name'] },
        ],
      });

      if (appointment.user_id !== req.user.id) {
        res.json({
          error: "You don't have permission to cancel this appointment",
        });
      }

      // cancelamento só pode ser feito 2 horas antes do horário marcado
      const dateWithSub = subHours(appointment.date, 2);

      // verifica se a data de cancelamento é antes da data atual
      if (isBefore(dateWithSub, new Date())) {
        return res.json({
          error: 'You can only cancel appointments 2 hours in advance.',
        });
      }

      appointment.canceled_at = new Date();
      await appointment.save();

      await Queue.add(CancellationMail.key, { appointment });

      return res.json(appointment);
    } catch (err) {
      return res.json(err);
    }
  }
}

export default new AppointmentController();
