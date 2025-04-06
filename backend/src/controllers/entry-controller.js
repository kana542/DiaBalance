import { insertKirjaus }   from "../models/entry-models.js";
import { customError } from '../middlewares/error-handler.js';

const createEntry = async (req, res, next) => {
    const kayttajaId = req.user.kayttaja_id;
    const kirjausData = req.body;

    try {
        const result = await insertKirjaus(kayttajaId, kirjausData);
        res.status(201).json({ message: 'Kirjaus lisätty onnistuneesti', result });
      } catch (error) {
        next(customError(error.message, 400));
      }
    };

    export { createEntry };
