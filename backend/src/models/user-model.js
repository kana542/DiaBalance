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

export {
    registerUser
};