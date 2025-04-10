import promisePool from '../utils/database.js';
import { cacheToken, getTokenFromCache, removeTokenFromCache } from '../utils/token-cache.js';


/**
 * Rekisteröi uusi käyttäjä
 * @param {Object} user käyttäjätiedot (kayttajanimi, email, salasana, kayttajarooli)
 * @returns {number} lisätyn käyttäjän ID
 */
const registerUser = async (user) => {
  try {
    const [result] = await promisePool.query(
      'INSERT INTO kayttaja (kayttajanimi, email, salasana, kayttajarooli) VALUES (?, ?, ?, ?)',
      [user.kayttajanimi, user.email || null, user.salasana, user.kayttajarooli]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error registerUser:', error);
    throw new Error('Database error');
  }
};


/**
 * Hae käyttäjä kirjautumista varten käyttäjänimen perusteella
 * @param {string} kayttajanimi
 * @returns {Object|null} käyttäjän tiedot salasanoineen tai null
 */
const loginUser = async (kayttajanimi) => {
    try {
      const [rows] = await promisePool.query(
        'SELECT kayttaja_id, kayttajanimi, email, salasana, kayttajarooli FROM kayttaja WHERE kayttajanimi = ?',
        [kayttajanimi]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error loginUser:', error);
      throw new Error('Database error');
    }
  };


/**
 * Hae käyttäjän omat tiedot ID:n perusteella
 * @param {number} kayttajaId
 * @returns {Object|null} käyttäjätiedot ilman salasanaa
 */
const getMyProfile = async (kayttajaId) => {
    try {
      const [rows] = await promisePool.query(
        'SELECT kayttaja_id, kayttajanimi, email, kayttajarooli FROM kayttaja WHERE kayttaja_id = ?',
        [kayttajaId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error getMyProfile:', error);
      throw new Error('Database error');
    }
  };


/**
 * Päivitä käyttäjän omat tiedot
 * @param {number} kayttajaId
 * @param {Object} data - päivitettävät tiedot (kayttajanimi, email, salasana)
 * @returns {Object} tulosviesti
 */
const updateMyProfile = async (kayttajaId, data) => {
    try {
      const updateFields = [];
      const values = [];

      if (data.kayttajanimi) {
        updateFields.push('kayttajanimi = ?');
        values.push(data.kayttajanimi);
      }

      if (data.email) {
        updateFields.push('email = ?');
        values.push(data.email);
      }

      if (data.salasana) {
        updateFields.push('salasana = ?');
        values.push(data.salasana);
      }

      if (updateFields.length === 0) {
        return { error: 'Ei päivitettäviä kenttiä' };
      }

      values.push(kayttajaId);

      const [result] = await promisePool.query(
        `UPDATE kayttaja SET ${updateFields.join(', ')} WHERE kayttaja_id = ?`,
        values
      );

      return {
        message: 'Tiedot päivitetty onnistuneesti',
        affectedRows: result.affectedRows
      };
    } catch (error) {
      console.error('Error updateMyProfile:', error);
      throw new Error('Database error');
    }
  };

/**
 * Päivitä Kubios token ja vanhentumisaika käyttäjälle
 * @param {number} userId - Käyttäjän ID
 * @param {string} token - Kubios token
 * @param {number} expiresIn - Vanhentumisaika sekunneissa
 * @returns {boolean} Onnistuiko päivitys
 */
const updateKubiosToken = async (userId, token, expiresIn) => {
  try {
    console.log(`Updating Kubios token for user ${userId}`);
    const expirationDate = new Date();
    expirationDate.setSeconds(expirationDate.getSeconds() + parseInt(expiresIn));

    const [result] = await promisePool.query(
      'UPDATE kayttaja SET kubios_token = ?, kubios_expiration = ? WHERE kayttaja_id = ?',
      [token, expirationDate, userId]
    );

    // Tallenna token myös välimuistiin
    cacheToken(userId, token, expirationDate);

    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating Kubios token:', error);
    throw new Error('Database error updating Kubios token');
  }
};

/**
 * Hae Kubios token käyttäjälle
 * @param {number} userId - Käyttäjän ID
 * @returns {string|null} Kubios token tai null jos vanhentunut/ei löydy
 */
const getKubiosToken = async (userId) => {
  try {
    // Tarkista ensin välimuistista
    const cachedToken = getTokenFromCache(userId);
    if (cachedToken) return cachedToken;

    // Jos ei löydy välimuistista, hae tietokannasta
    const [rows] = await promisePool.query(
      'SELECT kubios_token, kubios_expiration FROM kayttaja WHERE kayttaja_id = ?',
      [userId]
    );

    if (rows.length === 0) return null;

    const token = rows[0].kubios_token;
    const expiration = rows[0].kubios_expiration;

    if (!token || !expiration) return null;

    const now = new Date();
    const expirationDate = new Date(expiration);

    // Jos token on vanhentunut tai vanhenee seuraavan 5 minuutin aikana
    if (expirationDate <= now || (expirationDate - now) < 5 * 60 * 1000) {
      console.log(`Kubios token for user ${userId} has expired or will expire soon`);
      return null;
    }

    // Tallenna token välimuistiin jos se on voimassa
    cacheToken(userId, token, expirationDate);

    return token;
  } catch (error) {
    console.error('Error getting Kubios token:', error);
    throw new Error('Database error getting Kubios token');
  }
};

/**
 * Poista Kubios token käyttäjältä
 * @param {number} userId - Käyttäjän ID
 * @returns {boolean} Onnistuiko poisto
 */
/**
 * Poista Kubios token käyttäjältä
 * @param {number} userId - Käyttäjän ID
 * @returns {boolean} Onnistuiko poisto
 */
const removeKubiosToken = async (userId) => {
  try {
    console.log(`Removing Kubios token for user ${userId}`);

    // Tarkistetaan käyttäjän olemassaolo ja tokenin tila
    const [checkRows] = await promisePool.query(
      'SELECT kayttaja_id, kubios_token FROM kayttaja WHERE kayttaja_id = ?',
      [userId]
    );

    if (checkRows.length === 0) {
      console.log(`User ${userId} not found`);
      return false;
    }

    // Debug-tulostus
    console.log('Current token status:', checkRows[0].kubios_token ? 'Has token' : 'No token');

    // Korjattu kysely - varmista että NULL arvo syötetään oikein
    const [result] = await promisePool.query(
      'UPDATE kayttaja SET kubios_token = NULL, kubios_expiration = NULL WHERE kayttaja_id = ?',
      [userId]
    );

    // Debug-tulostus
    console.log(`Database update result: affectedRows=${result.affectedRows}, changedRows=${result.changedRows}`);

    // Poista token myös välimuistista
    removeTokenFromCache(userId);

    return true; // Palauta aina true jos käyttäjä löytyy
  } catch (error) {
    console.error('Error removing Kubios token:', error);
    throw new Error(`Database error removing Kubios token: ${error.message}`);
  }
};

export {
    registerUser,
    loginUser,
    getMyProfile,
    updateMyProfile,
    updateKubiosToken,
    getKubiosToken,
    removeKubiosToken
};
