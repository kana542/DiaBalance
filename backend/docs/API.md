# DiaBaLance API-dokumentaatio (backend)

## Sisällysluettelo
1. [Johdanto](#johdanto)
2. [Autentikaatio](#autentikaatio)
3. [API-endpointit](#api-endpointit)
   - [Autentikaatio API](#autentikaatio-api)
   - [Kirjaukset API](#kirjaukset-api)
   - [Kubios API](#kubios-api)
   - [Käyttäjähallinta API](#käyttäjähallinta-api)
4. [Vastausformaatti](#vastausformaatti)
5. [Virheidenkäsittely](#virheidenkäsittely)
6. [Kubios-integraatio](#kubios-integraatio)

## Johdanto

Backend API tarjoaa endpointit diabeteksen seurantatietojen hallintaan, mukaan lukien verensokerilukemat, HRV-mittaukset (Heart Rate Variability) Kubios-integraation kautta, sekä käyttäjähallinta. Tämä dokumentti kuvaa kaikki saatavilla olevat endpointit, niiden parametrit, pyyntö- ja vastausformaatit.

### Perus-URL

Kaikki API-endpointit ovat suhteessa osoitteeseen:  
`http://localhost:3000/api/`

## Autentikaatio

DiaBaLance käyttää JWT-tokeneita (JSON Web Token) autentikaatioon. Useimmat endpointit vaativat voimassaolevan tokenin Authorization-headerissa.

### Token-formaatti

```
Authorization: Bearer {token}
```

Token saadaan onnistuneen kirjautumisen jälkeen, ja se tulee sisällyttää kaikkiin seuraaviin pyyntöihin, jotka vaativat autentikaatiota.

## API-endpointit

### Autentikaatio API

#### Kirjautuminen
- **URL**: `/auth/login`
- **Metodi**: `POST`
- **Autentikaatio**: Ei vaadittu
- **Pyynnön runko**:
```json
{
  "kayttajanimi": "käyttäjätunnus",
  "salasana": "salasana"
}
```
- **Vastaus**:
```json
{
  "success": true,
  "message": "Kirjautuminen onnistui",
  "severity": "success",
  "data": {
    "token": "jwt_token_tähän",
    "user": {
      "kayttaja_id": 1,
      "kayttajanimi": "käyttäjätunnus",
      "email": "käyttäjä@esimerkki.com",
      "kayttajarooli": 0
    },
    "kubios": {
      "success": true,
      "message": "Kubios-kirjautuminen onnistui"
    }
  },
  "timestamp": "2025-04-13T12:30:45.123Z"
}
```
- **Huomiot**: Myös Kubios-kirjautuminen tehdään automaattisesti.

#### Uloskirjautuminen
- **URL**: `/auth/logout`
- **Metodi**: `POST`
- **Autentikaatio**: Vaadittu
- **Vastaus**:
```json
{
  "success": true,
  "message": "Uloskirjautuminen onnistui",
  "severity": "success",
  "data": {
    "tokenRemoved": true
  },
  "timestamp": "2025-04-13T12:35:22.456Z"
}
```

#### Kubios-kirjautuminen
- **URL**: `/auth/kubios-login`
- **Metodi**: `POST`
- **Autentikaatio**: Ei vaadittu
- **Pyynnön runko**:
```json
{
  "kayttajanimi": "sähköposti@esimerkki.com",
  "salasana": "salasana"
}
```

#### Hae nykyinen käyttäjä
- **URL**: `/auth/me`
- **Metodi**: `GET`
- **Autentikaatio**: Vaadittu
- **Vastaus**:
```json
{
  "success": true,
  "message": "Käyttäjätiedot haettu",
  "severity": "success",
  "data": {
    "kayttaja_id": 1,
    "kayttajanimi": "käyttäjätunnus",
    "email": "käyttäjä@esimerkki.com",
    "kayttajarooli": 0
  },
  "timestamp": "2025-04-13T12:40:15.789Z"
}
```

#### Hae Kubios-käyttäjän tiedot
- **URL**: `/auth/kubios-me`
- **Metodi**: `GET`
- **Autentikaatio**: Vaadittu

#### Validoi token
- **URL**: `/auth/validate`
- **Metodi**: `GET`
- **Autentikaatio**: Vaadittu

#### Rekisteröityminen
- **URL**: `/auth/register`
- **Metodi**: `POST`
- **Autentikaatio**: Ei vaadittu
- **Pyynnön runko**:
```json
{
  "kayttajanimi": "uusikäyttäjä",
  "email": "uusikäyttäjä@esimerkki.com",
  "salasana": "salasana123",
  "kayttajarooli": 0
}
```

### Kirjaukset API

#### Hae kirjaukset kuukauden mukaan
- **URL**: `/entries?year=2025&month=4`
- **Metodi**: `GET`

#### Luo kirjaus
- **URL**: `/entries`
- **Metodi**: `POST`

#### Päivitä kirjaus
- **URL**: `/entries`
- **Metodi**: `PUT`

#### Poista kirjaus
- **URL**: `/entries/2025-04-14`
- **Metodi**: `DELETE`

### Kubios API

#### Hae käyttäjätiedot
- **URL**: `/kubios/user-data`
- **Metodi**: `GET`

#### Hae käyttäjäinfo
- **URL**: `/kubios/user-info`
- **Metodi**: `GET`

#### Hae HRV-tiedot päivämäärän mukaan
- **URL**: `/kubios/user-data/2025-04-14`
- **Metodi**: `GET`

#### Tallenna HRV-tiedot
- **URL**: `/kubios/user-data/2025-04-14`
- **Metodi**: `POST`

### Käyttäjähallinta API

#### Päivitä käyttäjäprofiili
- **URL**: `/users/me`
- **Metodi**: `PUT`

## Vastausformaatti

### Onnistunut vastaus
```json
{
  "success": true,
  "message": "Ihmisluettava onnistumisviesti",
  "severity": "success|info|warning",
  "data": {},
  "timestamp": "ISO-aikaleima"
}
```

### Virhe vastaus
```json
{
  "success": false,
  "message": "Ihmisluettava virheviesti",
  "status": 400,
  "severity": "error|warning",
  "category": "VALIDATION|AUTH|ACCESS|DB|NOT_FOUND|EXTERNAL|GENERAL|INTERNAL",
  "errorCode": "CATEGORY_STATUS",
  "errors": null,
  "timestamp": "ISO-aikaleima"
}
```

## Virheidenkäsittely

| Tilakoodi | Kategoria    | Kuvaus                                   |
|-----------|--------------|-------------------------------------------|
| 400       | VALIDATION   | Virheelliset syöttöparametrit            |
| 401       | AUTH         | Autentikaation epäonnistuminen           |
| 403       | ACCESS       | Riittämättömät käyttöoikeudet            |
| 404       | NOT_FOUND    | Resurssia ei löydy                       |
| 500       | DB           | Tietokantavirhe                          |
| 502       | EXTERNAL     | Virhe ulkoisen API:n kanssa (Kubios)     |
| 500       | INTERNAL     | Palvelinvirhe                            |

## Kubios-integraatio

DiaBaLance integroituu Kubios Cloud API:n kanssa HRV-datan hakemiseksi:

1. Käyttäjät autentikoituvat Kubios-palveluun kirjautumisen yhteydessä
2. Kubios-tokenit tallennetaan turvallisesti tietokantaan
3. HRV-tiedot haetaan Kubioksesta ja tallennetaan verensokirjausten rinnalle
4. Järjestelmä tarjoaa endpointit manuaaliseen ja automaattiseen HRV-datan hallintaan

### Autentikaation kulku:

1. Käyttäjä kirjautuu sisään käyttäjätunnuksella/salasanalla  
2. Järjestelmä yrittää kirjautua Kubiokseen samoilla tunnuksilla  
3. Jos kirjautuminen onnistuu, Kubios-token tallennetaan  
4. Käyttäjä voi käyttää HRV-dataa Kubios-endpointtien kautta  
