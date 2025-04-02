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

const updateEntry = async (kayttajaId, pvm, entryData) => {
  try {
    // Luodaan tyhjät taulukot SQL-lauseen rakentamista varten
    const updateFields = [];  
    const values = [];       

    // Käydään läpi entryData-objekti ja lisätään kentät ja arvot SQL-lauseeseen
    // sekä values-taulukkoon
    for (const [key, value] of Object.entries(entryData)) {
      updateFields.push(`${key} = ?`); // Lisätään SQL-lauseeseen kenttä = ?
      values.push(value);              // Lisätään vastaava arvo values-taulukkoon
    }

    // Lisätään käyttäjän ID ja päivämäärä WHERE-ehtoa varten
    values.push(kayttajaId, pvm);

    // Rakennetaan SQL-lause
    const sql = `
      UPDATE kirjaus
      SET ${updateFields.join(', ')}
      WHERE kayttaja_id = ? AND pvm = ?`;

    // Suoritetaan päivitys tietokannassa
    const [result] = await promisePool.query(sql, values);

    return {
      message: 'Kirjaus päivitetty onnistuneesti',
      //affected rows kertoo kuinka monta riviä on päivitetty
      affectedRows: result.affectedRows,
    };
  } catch (error) {
    console.error('Virhe päivitettäessä kirjausta:', error);
    return { error: 'Tietokantavirhe päivityksessä' };
  }
};


const deleteEntry = async (kayttajaId, pvm) => {
  try {
    //Tarkistetaan, löytyykö merkintä ja kuuluuko se käyttäjälle
    const [rows] = await promisePool.query(
      'SELECT * FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?',
      [kayttajaId, pvm]
    );

    if (rows.length === 0) {
      return { error: 'Kirjausta ei löytynyt tai ei ole oikeutta poistaa sitä' };
    }

    // tarkirstuksen jälkeen Suoritetaan poisto
    await promisePool.query(
      'DELETE FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?',
      [kayttajaId, pvm]
    );

    return { message: 'Kirjaus poistettu onnistuneesti' };
  } catch (error) {
    console.error('Virhe kirjauksen poistossa:', error);
    return { error: 'Tietokantavirhe poistossa' };
  }
};

export {insertKirjaus, updateEntry, deleteEntry};
