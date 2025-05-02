# DiaBalance (dev build)

## Projektin yleiskuvaus

1. **Frontend**: Selaimessa toimiva käyttöliittymä (HTML, CSS, JavaScript ES-moduulit)
2. **Backend**: Node.js-palvelin, joka tarjoaa REST API:n ja yhteyden tietokantaan

## Frontend-rakenne

```
frontend/
├── index.html                  # Etusivu/landing page
├── package.json                # Projektin riippuvuudet
├── vite.config.js              # Vite-konfiguraatio (dev-palvelin)
├── dog.webp                    # Sovelluksen logo
├── src/
│   ├── main.js                 # Etusivun JavaScript-logiikka
│   ├── pages/
│   │   ├── login.html          # Kirjautumissivu
│   │   ├── register.html       # Rekisteröitymissivu
│   │   └── dashboard.html      # Päänäkymä kirjautuneille käyttäjille
│   ├── js/
│   │   ├── auth/
│   │   │   ├── auth.js         # Kirjautumislogiikka
│   │   │   ├── auth-check.js   # Autentikaation tarkistus
│   │   │   └── register.js     # Rekisteröitymislogiikka
│   │   ├── dashboard/
│   │   │   ├── dashboard-main.js   # Dashboard-sovelluksen päämoduuli
│   │   │   ├── calendar-module.js  # Kalenterin toiminnallisuus
│   │   │   ├── entry-module.js     # Merkintöjen CRUD-toiminnot
│   │   │   ├── chart-module.js     # Kaavionäkymät
│   │   │   ├── hrv-module.js       # HRV-datan placeholder
│   │   │   ├── modal-module.js     # Merkintämodaalin hallinta
│   │   │   └── info-module.js      # Info-nappien toiminnallisuus
│   │   └── utils/
│   │       ├── api-client.js       # API-kutsujen käsittely
│   │       ├── date-utils.js       # Päivämäärien käsittely
│   │       └── ui-utils.js         # UI-komponenttien apufunktiot
│   └── css/
│       ├── main.css                # Yhteiset/globaalit tyylit
│       ├── login.css               # Kirjautumissivun tyylit
│       ├── register.css            # Rekisteröitymissivun tyylit
│       └── dashboard.css           # Dashboard-näkymän tyylit
```

### Tärkeimmät frontend-tiedostot ja niiden toiminnot

#### HTML-tiedostot
- **index.html** - Sovelluksen aloitussivu, sisältää kirjautumisnapin
- **login.html** - Kirjautumislomake käyttäjätunnukselle ja salasanalle
- **register.html** - Rekisteröitymislomake uusille käyttäjille
- **dashboard.html** - Päänäkymä, joka sisältää kalenterin, verensokeriseurannan ja HRV-metriikat

#### JavaScript-moduulit
- **main.js** - Etusivun logiikka, tarkistaa kirjautumistilan ja päivittää napit
- **auth.js** - Hoitaa kirjautumisprosessin ja tokenin tallennuksen
- **auth-check.js** - Suojaa kirjautumista vaativat sivut, ohjaa kirjautumissivulle jos tokenia ei löydy
- **register.js** - Käsittelee rekisteröitymislomakkeen lähetyksen ja validoinnin

##### Dashboard-moduulit
- **dashboard-main.js** - Päämoduuli, joka alustaa kaikki muut moduulit ja hallinnoi nimiavaruutta
- **calendar-module.js** - Kalenterin logiikka, näyttää päivät, merkinnät ja käsittelee klikkaukset
- **entry-module.js** - Merkintöjen käsittely (haku, tallennus, poisto), kommunikoi API:n kanssa
- **chart-module.js** - Verensokerikaavioiden piirtäminen ja päivittäminen
- **hrv-module.js** - HRV-metriikoiden placeholder (näyttää vain viivat)
- **modal-module.js** - Merkintämodaalin avaaminen, täyttäminen ja tapahtumien käsittely
- **info-module.js** - Info-nappien toiminnallisuus, näyttää ohjeet eri osioille

##### Utility-moduulit
- **api-client.js** - Kaikki API-kutsut, autentikaation hallinta, token-käsittely
- **date-utils.js** - Päivämäärien formatointi, vertailu ja aikavyöhykkeiden käsittely
- **ui-utils.js** - UI-komponenttien luominen, virheilmoitukset, toast-ilmoitukset

#### CSS-tiedostot
- **main.css** - Perustyylit koko sovellukselle
- **login.css** ja **register.css** - Kirjautumis- ja rekisteröintilomakkeiden tyylit
- **dashboard.css** - Dashboard-näkymän, kalenterin, kaavioiden ja modaalien tyylit

## Backend-rakenne

```
backend/
├── package.json                # Projektin riippuvuudet
├── .env                       # Ympäristömuuttujat (DB, JWT)
├── src/
│   ├── index.js               # Sovelluksen käynnistyspiste
│   ├── controllers/
│   │   ├── auth-controller.js  # Autentikaation käsittelijät
│   │   ├── entry-controller.js # Merkintöjen käsittelijät
│   │   └── user-controller.js  # Käyttäjien käsittelijät
│   ├── models/
│   │   ├── entry-models.js     # Merkintöjen tietokantaoperaatiot
│   │   └── user-model.js       # Käyttäjien tietokantaoperaatiot
│   ├── routes/
│   │   ├── auth-router.js      # Autentikaation reitit
│   │   ├── entry-router.js     # Merkintöjen reitit
│   │   └── user-router.js      # Käyttäjien reitit
│   ├── middlewares/
│   │   ├── authentication.js   # JWT-autentikaatio
│   │   └── error-handler.js    # Virheidenkäsittely
│   └── utils/
│       └── database.js         # Tietokantayhteys
```

### Tärkeimmät backend-tiedostot ja niiden toiminnot

- **index.js** - Express-sovelluksen asetukset, reittien rekisteröinti ja palvelimen käynnistys
- **authentication.js** - JWT-tokenien validointi ja käyttäjien autentikointi
- **error-handler.js** - Keskitetty virheidenkäsittely ja mukautetut virheviestit

#### Controller-tiedostot
- **auth-controller.js** - Kirjautumisen ja rekisteröitymisen logiikka
- **entry-controller.js** - Merkintöjen luonti, haku, päivitys ja poisto
- **user-controller.js** - Käyttäjien tietojen hallinta

#### Model-tiedostot
- **entry-models.js** - Merkintöjen tietokantaoperaatiot
- **user-model.js** - Käyttäjien tietokantaoperaatiot

#### Router-tiedostot
- **auth-router.js** - Autentikaation reitit (/api/auth/*)
- **entry-router.js** - Merkintöjen reitit (/api/entries/*)
- **user-router.js** - Käyttäjien reitit (/api/users/*)

## Tietokantarakenne

```sql
CREATE TABLE kayttaja (
    kayttaja_id INT AUTO_INCREMENT,
    kayttajanimi VARCHAR(40) NOT NULL,
    salasana VARCHAR(60) NOT NULL,
    kayttajarooli INT NOT NULL DEFAULT 0,
    -- ...
);

CREATE TABLE kirjaus (
    kayttaja_id INT NOT NULL,
    pvm DATE NOT NULL DEFAULT CURRENT_DATE(),
    hrv_data TEXT,
    vs_aamu DECIMAL(3, 1),
    vs_ilta DECIMAL(3, 1),
    vs_aamupala_ennen DECIMAL(3, 1),
    vs_aamupala_jalkeen DECIMAL(3, 1),
    vs_lounas_ennen DECIMAL(3, 1),
    vs_lounas_jalkeen DECIMAL(3, 1),
    vs_valipala_ennen DECIMAL(3, 1),
    vs_valipala_jalkeen DECIMAL(3, 1),
    vs_paivallinen_ennen DECIMAL(3, 1),
    vs_paivallinen_jalkeen DECIMAL(3, 1),
    vs_iltapala_ennen DECIMAL(3, 1),
    vs_iltapala_jalkeen DECIMAL(3, 1),
    oireet VARCHAR(200) DEFAULT "Ei oireita",
    kommentti VARCHAR(500) DEFAULT "Ei kommentteja",
    -- ...
);
```

## Toimintalogiikka

### 1. Käyttäjän kirjautuminen
1. Käyttäjä syöttää tunnukset login.html-sivulla
2. auth.js lähettää pyynnön backend-palvelimelle
3. Backend validoi tunnukset ja palauttaa JWT-tokenin
4. Token tallennetaan localStorage:en
5. Käyttäjä ohjataan dashboard.html-sivulle

### 2. Dashboard-näkymä
1. auth-check.js tarkistaa tokenin olemassaolon
2. dashboard-main.js alustaa kaikki moduulit
3. calendar-module.js hakee kuukauden merkinnät ja näyttää kalenterin
4. Merkintöjen tila näytetään kalenterissa eri väreillä
5. HRV-metriikat näytetään placeholdereina (kunnes saadaan logiikka toimimaan)

### 3. Merkinnän lisääminen/muokkaaminen
1. Käyttäjä tuplaklikkaa kalenterissa päivää
2. modal-module.js avaa modaalin ja täyttää lomakkeen jos merkintä on jo olemassa
3. Käyttäjä täyttää/muokkaa verensokeritietoja ja oireita
4. entry-module.js lähettää tiedot API:lle
5. Kalenteri ja kaaviot päivittyvät

### 4. API-integraatio
1. api-client.js hoitaa kaikki API-kutsut
2. JWT-token liitetään Authorization-headeriin
3. API-vastaukset käsitellään ja muunnetaan frontend-muotoon
4. Virhetilanteissa näytetään virheilmoitus

## Teknologiavalinnat

- **Frontend**: Vanilla JavaScript, ES-moduulit, CSS
- **Backend**: Node.js, Express, MySQL
- **Autentikaatio**: JWT (JSON Web Tokens)
- **Kehitysympäristö**: Vite (frontend), Nodemon (backend)
