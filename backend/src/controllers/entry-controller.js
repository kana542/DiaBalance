import promisePool from '../utils/database.js';
import { insertKirjaus, getKirjauksetByMonth, updateKirjaus, deleteKirjaus } from "../models/entry-models.js";
import { getHrvData } from '../models/hrv-model.js';

import {
  createValidationError,
  createDatabaseError,
  createNotFoundError,
  createResponse,
  Severity
} from '../middlewares/error-handler.js';

const createEntry = async (req, res, next) => {
  const kayttajaId = req.user.kayttaja_id;
  const kirjausData = req.body;

  try {
      const result = await insertKirjaus(kayttajaId, kirjausData);
      res.status(201).json(createResponse({
          id: result.insertId
      }, 'Kirjaus lisätty onnistuneesti', Severity.SUCCESS));
  } catch (error) {
      next(createDatabaseError("Kirjauksen lisääminen epäonnistui", error));
  }
};

const getEntriesByMonth = async (req, res, next) => {
  const kayttajaId = req.user.kayttaja_id;
  const { year, month } = req.query;

  console.log(`Request for entries: year=${year}, month=${month}, user=${kayttajaId}`);

  if (!year || !month) {
    return next(createValidationError('Vuosi (year) ja kuukausi (month) parametrit vaaditaan'));
  }

  try {
    // Hae kirjaukset
    const entries = await getKirjauksetByMonth(kayttajaId, parseInt(year), parseInt(month));

    // Hae myös HRV-tiedot ja liitä ne kirjauksiin
    const formattedEntries = await Promise.all(entries.map(async entry => {
      try {
        if (entry.formatted_date) {
          entry.pvm = entry.formatted_date;
        }

        const [hrvRows] = await promisePool.query(
          'SELECT * FROM hrv_kirjaus WHERE kayttaja_id = ? AND pvm = ?',
          [kayttajaId, entry.pvm]
        );

        if (hrvRows && hrvRows.length > 0) {
          entry.hrv_data = hrvRows[0];
        }

        return entry;
      } catch (e) {
        console.error(`Error processing entry for ${entry.pvm}:`, e);
        return entry;
      }
    }));

    console.log(`Returning ${formattedEntries.length} entries`);
    res.json(createResponse(formattedEntries, `Haettu ${formattedEntries.length} merkintää`, Severity.SUCCESS));
  } catch (error) {
    console.error("Error in getEntriesByMonth:", error);
    next(createDatabaseError("Merkintöjen hakeminen epäonnistui", error));
  }
};

const updateEntry = async (req, res, next) => {
  const kayttajaId = req.user.kayttaja_id;
  const kirjausData = req.body;

  console.log(`Update request for date: ${kirjausData.pvm}`, kirjausData);

  if (!kirjausData.pvm) {
      return next(createValidationError('Päivämäärä (pvm) vaaditaan'));
  }

  try {
      const numericFields = [
          'vs_aamu', 'vs_ilta',
          'vs_aamupala_ennen', 'vs_aamupala_jalkeen',
          'vs_lounas_ennen', 'vs_lounas_jalkeen',
          'vs_valipala_ennen', 'vs_valipala_jalkeen',
          'vs_paivallinen_ennen', 'vs_paivallinen_jalkeen',
          'vs_iltapala_ennen', 'vs_iltapala_jalkeen'
      ];

      // Käsittele tyhjät arvot oikein (null)
      numericFields.forEach(field => {
          if (kirjausData[field] === '' || kirjausData[field] === undefined) {
              kirjausData[field] = null;
          }
      });

      console.log("Processed data for update:", kirjausData);

      const result = await updateKirjaus(kayttajaId, kirjausData);
      res.json(createResponse({
          affectedRows: result.affectedRows || 1
      }, 'Kirjaus päivitetty onnistuneesti', Severity.SUCCESS));
  } catch (error) {
      console.error("Error in updateEntry:", error);
      next(createDatabaseError("Kirjauksen päivittäminen epäonnistui", error));
  }
};

const deleteEntry = async (req, res, next) => {
  const kayttajaId = req.user.kayttaja_id;
  const date = req.params.date;

  console.log(`Delete request for date: ${date}`);

  if (!date) {
      return next(createValidationError('Päivämäärä (date) vaaditaan'));
  }

  try {
      const result = await deleteKirjaus(kayttajaId, date);

      if (result.affectedRows === 0) {
          return next(createNotFoundError('Kirjausta ei löytynyt poistettavaksi'));
      }

      res.json(createResponse({
          affectedRows: result.affectedRows
      }, 'Kirjaus poistettu onnistuneesti', Severity.SUCCESS));
  } catch (error) {
      console.error("Error in deleteEntry:", error);
      next(createDatabaseError("Kirjauksen poistaminen epäonnistui", error));
  }
};

export { createEntry, getEntriesByMonth, updateEntry, deleteEntry };
