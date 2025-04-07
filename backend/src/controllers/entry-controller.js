import { insertKirjaus, getKirjauksetByMonth, updateKirjaus, deleteKirjaus } from "../models/entry-models.js";
import { customError } from '../middlewares/error-handler.js';

/**
 * Luo uusi kirjaus
 */
const createEntry = async (req, res, next) => {
    const kayttajaId = req.user.kayttaja_id;
    const kirjausData = req.body;

    try {
        const result = await insertKirjaus(kayttajaId, kirjausData);
        res.status(201).json({
            message: 'Kirjaus lisätty onnistuneesti',
            id: result.insertId
        });
    } catch (error) {
        next(customError(error.message, 400));
    }
};

/**
 * Hae kirjaukset tietyltä kuukaudelta
 */
const getEntriesByMonth = async (req, res, next) => {
    const kayttajaId = req.user.kayttaja_id;
    const { year, month } = req.query;

    console.log(`Request for entries: year=${year}, month=${month}, user=${kayttajaId}`);

    if (!year || !month) {
        return next(customError('Vuosi (year) ja kuukausi (month) parametrit vaaditaan', 400));
    }

    try {
        const entries = await getKirjauksetByMonth(kayttajaId, parseInt(year), parseInt(month));

        // Tässä voimme varmistaa, että päivämäärä on oikeassa muodossa
        const formattedEntries = entries.map(entry => {
            // Jos meillä on formatted_date kentästä, käytä sitä
            if (entry.formatted_date) {
                entry.pvm = entry.formatted_date;
            }
            return entry;
        });

        console.log(`Returning ${formattedEntries.length} entries`);
        res.json(formattedEntries);
    } catch (error) {
        console.error("Error in getEntriesByMonth:", error);
        next(customError(error.message, 400));
    }
};

/**
 * Päivitä olemassa oleva kirjaus tai luo uusi
 */
const updateEntry = async (req, res, next) => {
    const kayttajaId = req.user.kayttaja_id;
    const kirjausData = req.body;

    console.log(`Update request for date: ${kirjausData.pvm}`, kirjausData);

    if (!kirjausData.pvm) {
        return next(customError('Päivämäärä (pvm) vaaditaan', 400));
    }

    try {
        // Tässä on tärkeää käsitellä myös null-arvot oikein
        // Validaattori voi epäonnistua, jos arvo on null ja kenttä on määritelty float-tyyppiseksi
        // Sen vuoksi numeeriset arvot pitää käsitellä erikseen

        // Varmista että numeeriset kentät ovat null tai numeroita
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
        res.json({
            message: 'Kirjaus päivitetty onnistuneesti',
            affectedRows: result.affectedRows || 1
        });
    } catch (error) {
        console.error("Error in updateEntry:", error);
        next(customError(error.message, 400));
    }
};

/**
 * Poista olemassa oleva kirjaus
 */
const deleteEntry = async (req, res, next) => {
    const kayttajaId = req.user.kayttaja_id;
    const date = req.params.date;

    console.log(`Delete request for date: ${date}`);

    if (!date) {
        return next(customError('Päivämäärä (date) vaaditaan', 400));
    }

    try {
        const result = await deleteKirjaus(kayttajaId, date);

        if (result.affectedRows === 0) {
            return next(customError('Kirjausta ei löytynyt poistettavaksi', 404));
        }

        res.json({
            message: 'Kirjaus poistettu onnistuneesti',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error("Error in deleteEntry:", error);
        next(customError(error.message, 400));
    }
};

export { createEntry, getEntriesByMonth, updateEntry, deleteEntry };
