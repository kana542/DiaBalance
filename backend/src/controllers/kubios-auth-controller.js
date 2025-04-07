import 'dotenv/config';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { v4 } from 'uuid';
import { customError } from '../middlewares/error-handler.js';
import {
  registerUser,
  selectUserByEmail,
  getMyProfile
} from '../models/user-model.js';

const baseUrl = process.env.KUBIOS_API_URI;

const kubiosLogin = async (username, password) => {
  const csrf = v4();
  const headers = new Headers();
  headers.append('Cookie', `XSRF-TOKEN=${csrf}`);
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  const searchParams = new URLSearchParams();
  searchParams.set('username', username);
  searchParams.set('password', password);
  searchParams.set('client_id', process.env.KUBIOS_CLIENT_ID);
  searchParams.set('redirect_uri', process.env.KUBIOS_REDIRECT_URI);
  searchParams.set('response_type', 'token');
  searchParams.set('scope', 'openid');
  searchParams.set('_csrf', csrf);

  const options = {
    method: 'POST',
    headers: headers,
    redirect: 'manual',
    body: searchParams,
  };

  const response = await fetch(process.env.KUBIOS_LOGIN_URL, options);
  const location = response.headers.raw().location[0];

  if (location.includes('login?null')) {
    throw customError('Virheellinen käyttäjänimi tai salasana (Kubios)', 401);
  }

  const regex = /id_token=(.*)&access_token=(.*)&expires_in=(.*)/;
  const match = location.match(regex);
  const idToken = match[1];
  return idToken;
};

const kubiosUserInfo = async (idToken) => {
  const headers = new Headers();
  headers.append('User-Agent', process.env.KUBIOS_USER_AGENT);
  headers.append('Authorization', idToken);

  const response = await fetch(baseUrl + '/user/self', {
    method: 'GET',
    headers: headers,
  });

  const responseJson = await response.json();

  if (responseJson.status === 'ok') {
    return responseJson.user;
  } else {
    throw customError('Kubios-käyttäjätietojen haku epäonnistui', 500);
  }
};

const syncWithLocalUser = async (kubiosUser) => {
  let user;
  const existing = await selectUserByEmail(kubiosUser.email);

  //if (!existing) {
  if (existing.error) {
    // Tarkistetaan meneekö uusi käyttäjä tietokantaan
    console.log('Rekisteröidään uusi Kubios-käyttäjä:', kubiosUser.email);
    const newUser = {
      kayttajanimi: kubiosUser.email,
      salasana: v4(), // Dummy-password, ei käytetä
      kayttajarooli: 0
    };
    const userId = await registerUser(newUser);
    user = { ...newUser, kayttaja_id: userId };
  } else {
    user = existing;
  }

  return user.kayttaja_id;
};

const postLogin = async (req, res, next) => {
  const { kayttajanimi, salasana } = req.body;

  try {
    const kubiosIdToken = await kubiosLogin(kayttajanimi, salasana);
    const kubiosUser = await kubiosUserInfo(kubiosIdToken);
    const kayttajaId = await syncWithLocalUser(kubiosUser);

    const token = jwt.sign(
      {
        kayttaja_id: kayttajaId,
        kubiosIdToken,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: 'Kirjautuminen onnistui (Kubios)',
      token,
      user: {
        id: kayttajaId,
        kayttajanimi: kubiosUser.email
      }
    });
  } catch (err) {
    next(err);
  }
};

const getKubiosMe = async (req, res, next) => {
  try {
    const user = await getMyProfile(req.user.kayttaja_id);
    res.json({ user, kubios_token: req.user.kubiosIdToken });
  } catch (err) {
    next(err);
  }
};

export { postLogin, getKubiosMe };
