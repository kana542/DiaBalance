import 'dotenv/config';
import fetch from 'node-fetch';
// import {customError} from '../middlewares/error-handler.js';

// Kubios API base URL should be set in .env
const baseUrl = process.env.KUBIOS_API_URI;

/**
* Get user data from Kubios API example
* TODO: Implement error handling
* @async
* @param {Request} req Request object including Kubios id token
* @param {Response} res
* @param {NextFunction} next
*/
const getUserData = async (req, res, next) => {
  const {kubiosIdToken} = req.user;
  const headers = new Headers();
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  headers.append('Authorization', kubiosIdToken);

  const response = await fetch(
    // TODO: set the from date in request parameters
    baseUrl + '/result/self?from=2022-01-01T00%3A00%3A00%2B00%3A00',
    {
      method: 'GET',
      headers: headers,
    },
  );
  const results = await response.json();
  return res.json(results);
 

};




/**
* Get user info from Kubios API example
* TODO: Implement error handling
* @async
* @param {Request} req Request object including Kubios id token
* @param {Response} res
* @param {NextFunction} next
*/
const getUserInfo = async (req, res, next) => {
  const {kubiosIdToken} = req.user;
  const headers = new Headers();
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  headers.append('Authorization', kubiosIdToken);

  const response = await fetch(baseUrl + '/user/self', {
    method: 'GET',
    headers: headers,
  });
  const userInfo = await response.json();
  return res.json(userInfo);
};


const getUserDataByDate = async (req, res, next) => {
  const { kubiosIdToken } = req.user;
  const { date } = req.params;

  const headers = new Headers();
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  headers.append('Authorization', kubiosIdToken);

  try {
    const response = await fetch(
      baseUrl + '/result/self?from=2022-01-01T00%3A00%3A00%2B00%3A00',
      {
        method: 'GET',
        headers: headers,
      }
    );

    const results = await response.json();

    // Filtteröidään tulokset annetun päivämäärän perusteella
    const filtered = results.results?.filter((result) => {
      const resultDate = result.daily_result || result.measured_timestamp?.split('T')[0];
      return resultDate === date;
    });

    // Muunnetaan vain halutut arvot
    const simplifiedResults = filtered.map((result) => {
      const data = result.result || {};

    // alla olevaan listaan voi valita ne arvot, jotka halutaan palauttaa
      return {
        date: result.daily_result || result.measured_timestamp?.split('T')[0],
        stress_index: data.stress_index,
        readiness: data.readiness,
        physiological_age: data.physiological_age,
        mean_hr_bpm: data.mean_hr_bpm,
        sdnn_ms: data.sdnn_ms,
      };
    });

    res.json(simplifiedResults);
  } catch (error) {
    console.error('Virhe Kubios-datan hakemisessa:', error);
    next(error);
  }
};



export {getUserData, getUserInfo, getUserDataByDate};