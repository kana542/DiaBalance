import promisePool from '../utils/database.js';

const insertKirjaus = async (kayttajaId, data) => {
  try {
    const [result] = await promisePool.query(
      `INSERT INTO kirjaus
        (kayttaja_id, pvm, vs_aamu, vs_ilta, vs_aamupala_ennen, vs_aamupala_jalkeen, vs_lounas_ennen, vs_lounas_jalkeen, vs_valipala_ennen, vs_valipala_jalkeen, vs_paivallinen_ennen, vs_paivallinen_jalkeen, vs_iltapala_ennen, vs_iltapala_jalkeen, oireet, kommentti)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        kayttajaId,
        data.pvm,
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

const getKirjauksetByMonth = async (kayttajaId, year, month) => {
  try {
    console.log(`Running query for user ${kayttajaId}, year ${year}, month ${month}`);

    // Käytä DATE_FORMAT varmistamaan että päivämäärä on samassa muodossa
    const [rows] = await promisePool.query(
      `SELECT
         *,
         DATE_FORMAT(pvm, '%Y-%m-%d') AS formatted_date
       FROM kirjaus
       WHERE kayttaja_id = ?
       AND YEAR(pvm) = ?
       AND MONTH(pvm) = ?
       ORDER BY pvm`,
      [kayttajaId, year, month]
    );

    console.log(`Query returned ${rows.length} rows`);

    // Näytä ensimmäinen rivi esimerkkinä
    if (rows.length > 0) {
      console.log("Sample row:", rows[0]);
    }

    return rows;
  } catch (error) {
    console.error('Error getKirjauksetByMonth:', error);
    throw new Error('Tietokantavirhe kirjausten hakemisessa');
  }
};

const updateKirjaus = async (kayttajaId, data) => {
  try {
    console.log(`Updating entry for date ${data.pvm}`);

    // Tarkista onko kirjaus jo olemassa
    const [checkResult] = await promisePool.query(
      'SELECT 1 FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?',
      [kayttajaId, data.pvm]
    );

    if (checkResult.length === 0) {
      // Kirjausta ei ole olemassa, luodaan uusi
      console.log("Entry doesn't exist, creating new one");
      return await insertKirjaus(kayttajaId, data);
    }

    // Kirjaus on olemassa, päivitetään
    console.log("Entry exists, updating");
    const [result] = await promisePool.query(
      `UPDATE kirjaus
       SET vs_aamu = ?,
           vs_ilta = ?,
           vs_aamupala_ennen = ?,
           vs_aamupala_jalkeen = ?,
           vs_lounas_ennen = ?,
           vs_lounas_jalkeen = ?,
           vs_valipala_ennen = ?,
           vs_valipala_jalkeen = ?,
           vs_paivallinen_ennen = ?,
           vs_paivallinen_jalkeen = ?,
           vs_iltapala_ennen = ?,
           vs_iltapala_jalkeen = ?,
           oireet = ?,
           kommentti = ?
       WHERE kayttaja_id = ? AND pvm = ?`,
      [
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
        kayttajaId,
        data.pvm
      ]
    );
    return result;
  } catch (error) {
    console.error('Error updateKirjaus:', error);
    throw new Error('Tietokantavirhe kirjauksen päivittämisessä');
  }
};

const deleteKirjaus = async (kayttajaId, pvm) => {
  try {
    console.log(`Deleting entry for date ${pvm}`);

    const [result] = await promisePool.query(
      'DELETE FROM kirjaus WHERE kayttaja_id = ? AND pvm = ?',
      [kayttajaId, pvm]
    );

    console.log(`Delete result: ${result.affectedRows} rows affected`);
    return result;
  } catch (error) {
    console.error('Error deleteKirjaus:', error);
    throw new Error('Tietokantavirhe kirjauksen poistamisessa');
  }
};

export {insertKirjaus, getKirjauksetByMonth, updateKirjaus, deleteKirjaus};
