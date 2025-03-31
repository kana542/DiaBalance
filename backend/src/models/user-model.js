import promisePool from '../utils/database.js';

/**
 * Rekisteröi uusi käyttäjä
 * @param {Object} user käyttäjätiedot (kayttajanimi, salasana, kayttajarooli)
 * @returns {number} lisätyn käyttäjän ID
 */
const registerUser = async (user) => {
  try {
    const [result] = await promisePool.query(
      'INSERT INTO kayttaja (kayttajanimi, salasana, kayttajarooli) VALUES (?, ?, ?)',
      [user.kayttajanimi, user.salasana, user.kayttajarooli]
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
        'SELECT kayttaja_id, kayttajanimi, salasana, kayttajarooli FROM kayttaja WHERE kayttajanimi = ?',
        [kayttajanimi]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error loginUser:', error);
      throw new Error('Database error');
    }
  };
  

export {
    registerUser,
    loginUser
};