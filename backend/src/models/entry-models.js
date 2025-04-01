import promisePool from '../utils/database.js';

/**
 * Lisää uusi kirjaus tietokantaan
 * @param {number} kayttajaId
 * @param {Object} data
 */
const insertKirjaus = async (kayttajaId, data) => {
  try {
    const [result] = await promisePool.query(
      `INSERT INTO kirjaus 
        (kayttaja_id, pvm, hrv_data, vs_aamu, vs_ilta, vs_aamupala_ennen, vs_aamupala_jalkeen, vs_lounas_ennen, vs_lounas_jalkeen, vs_valipala_ennen, vs_valipala_jalkeen, vs_paivallinen_ennen, vs_paivallinen_jalkeen, vs_iltapala_ennen, vs_iltapala_jalkeen, oireet, kommentti) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kayttajaId,
        data.pvm,
        data.hrv_data,
        data.vs_aamu,
        data.vs_ilta,
        data.vs_aamupala_ennen,
        data.vs_aamupala_jalkeen,
        data.vs_lounas_ennen,
        data.vs_lounas_jalkeen,
        data.vs_valipala_ennen,
        data.vs_valipala_jalkeen,
        data.vs_paivallinen_ennen,
        data.vs_paivallinen_jalkeen,
        data.vs_iltapala_ennen,
        data.vs_iltapala_jalkeen,
        data.oireet || 'Ei oireita',
        data.kommentti || 'Ei kommentteja',
      ],
    );
    return result;
  } catch (error) {
    console.error('Error insertKirjaus:', error);
    throw new Error('Tietokantavirhe kirjauksen lisäämisessä');
  }
};

export {insertKirjaus};
