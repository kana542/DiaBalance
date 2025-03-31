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


/**
 * Hae käyttäjän omat tiedot ID:n perusteella
 * @param {number} kayttajaId
 * @returns {Object|null} käyttäjätiedot ilman salasanaa
 */
const getMyProfile = async (kayttajaId) => {
    try {
      const [rows] = await promisePool.query(
        'SELECT kayttaja_id, kayttajanimi, kayttajarooli FROM kayttaja WHERE kayttaja_id = ?',
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
 * @param {Object} data - päivitettävät tiedot (kayttajanimi, salasana)
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

export {
    registerUser,
    loginUser,
    getMyProfile,
    updateMyProfile
};