# DiaBalance Backend -arkkitehtuuri

## Yleiskatsaus

Sovelluksen taustapalvelu on toteuttu käyttäen Node.js/Express, joka mahdollistaa REST API:n diabeteksen seurantaan ja Kubios HRV -datan integrointiin.

## Teknologiapino

- **Ajoympäristö**: Node.js
- **Sovelluskehys**: Express.js
- **Tietokanta**: MySQL
- **Autentikointi**: JWT (JSON Web Tokens)
- **Ulkoinen integraatio**: Kubios Cloud API HRV-datalle

## Hakemistorakenne
```
backend/
├── db/                        # Tietokantaan liittyvät tiedostot
│   ├── create-db-user.sql     # SQL-skripti käyttäjän luomiseen
│   └── diabalance.sql         # Päätietokannan skeema ja triggerit
├── docs/                      # Dokumentaatio
│   ├── API.md                 # API-dokumentaatio
│   └── ARCHITECTURE.md        # Tämä tiedosto
├── node_modules/              # Riippuvuudet
├── src/                       # Lähdekoodi
│   ├── controllers/           # Liiketoimintalogiikan toteutus
│   │   ├── auth-controller.js        # Autentikointi
│   │   ├── entry-controller.js       # Diabetesmerkinnät
│   │   ├── kubios-auth-controller.js # Kubios-autentikointi
│   │   ├── kubios-controller.js      # Kubios HRV-data
│   │   └── user-controller.js        # Käyttäjänhallinta
│   ├── middlewares/           # Express-välikerrokset
│   │   ├── authentication.js         # JWT-validointi
│   │   └── error-handler.js          # Keskitetty virheidenkäsittely
│   ├── models/                # Tietokantaoperaatiot
│   │   ├── entry-models.js           # Diabetesmerkintämallit
│   │   ├── hrv-model.js              # HRV-datamallit
│   │   └── user-model.js             # Käyttäjämallit
│   ├── routes/                # API-reittimäärittelyt
│   │   ├── auth-router.js            # Autentikointireitit
│   │   ├── entry-router.js           # Diabetesmerkintäreitit
│   │   ├── kubios-router.js          # Kubios-datareitit
│   │   └── user-router.js            # Käyttäjänhallintareitit
│   ├── utils/                 # Apufunktiot
│   │   ├── database.js               # Tietokantayhteydet
│   │   ├── logger.js                 # Lokipalvelu
│   │   └── token-cache.js            # Token-välimuisti
│   ├── validation/            # Syötteiden validointisäännöt
│   │   ├── auth-validation.js        # Autentikointivalidointi
│   │   └── entry-validation.js       # Merkintöjen validointi
│   └── index.js               # Sovelluksen sisääntulopiste
├── .env.example               # Esimerkki ympäristömuuttujista
├── package.json               # Projektin metadata ja riippuvuudet
└── package-lock.json          # Riippuvuuksien lukitustiedosto
```

## Ydinkomponentit

### 1. Kontrollerit

Kontrollerit sisältävät sovelluksen liiketoimintalogiikan ja toimivat välittäjinä reittien ja mallien välillä.

- **auth-controller.js**:
  - Käyttäjän kirjautuminen, uloskirjautuminen ja tokenin validointi
  - JWT-tokenien generointi ja hallinta
  - Kubios-integraation käsittely kirjautumisen yhteydessä
  - Standardoitu virhe- ja vastausformaatti

- **entry-controller.js**:
  - Verensokerimerkintöjen CRUD-toiminnot
  - Äärimmäisten verensokeriarvojen tarkistus ja lokitus
  - HRV-datan liittäminen merkintöihin
  - Validoinnit ja tyhjien arvojen käsittely

- **kubios-auth-controller.js**:
  - Kubios-järjestelmän autentikointi
  - Tokenien hallinta ja tallennus
  - Käyttäjätietojen vastaanotto Kubios-järjestelmästä

- **kubios-controller.js**:
  - Kubios API -kutsujen käsittely
  - HRV-datan nouto, suodatus ja muotoilu
  - HRV-datan tallennus tietokantaan

- **user-controller.js**:
  - Käyttäjien rekisteröinti
  - Profiilin päivitys
  - Käyttäjätietojen validointi ja duplikaattien tarkistus
  - Salasanojen bcrypt-salaus

### 2. Mallit

Mallit ovat vastuussa tietokantaoperaatioista ja datan käsittelystä.

- **entry-models.js**:
  - Verensokerimerkintöjen lisäys, haku, päivitys ja poisto
  - Kenttäarvojen validointi
  - Aikaperusteisten hakujen toteutus

- **hrv-model.js**:
  - HRV-datan muotoilu ja validointi
  - HRV-tietueiden luominen/päivittäminen
  - Päivämääräkohtainen HRV-datan haku

- **user-model.js**:
  - Käyttäjien rekisteröinti ja kirjautuminen
  - Profiilin päivitys
  - Kubios-tokenien tallennus, haku ja poisto

### 3. Reitit

Reitit määrittelevät API-endpointit ja yhdistävät HTTP-pyynnöt kontrollereihin.

- **auth-router.js**:
  - POST /api/auth/login - Kirjautuminen
  - POST /api/auth/logout - Uloskirjautuminen
  - POST /api/auth/register - Rekisteröityminen
  - GET /api/auth/me - Kirjautuneen käyttäjän tiedot
  - GET /api/auth/validate - Tokenin validointi
  - Kubios-autentikointiin liittyvät reitit

- **entry-router.js**:
  - GET /api/entries?year=YYYY&month=MM - Hae kuukauden merkinnät
  - POST /api/entries - Luo uusi merkintä
  - PUT /api/entries - Päivitä merkintä
  - DELETE /api/entries/:date - Poista merkintä

- **kubios-router.js**:
  - GET /api/kubios/user-data - Hae kaikki HRV-tiedot
  - GET /api/kubios/user-info - Hae käyttäjän tiedot Kubioksesta
  - GET /api/kubios/user-data/:date - Hae tietyn päivän HRV-tiedot
  - POST /api/kubios/user-data/:date - Tallenna HRV-data

- **user-router.js**:
  - POST /api/users/register - Rekisteröi käyttäjä
  - PUT /api/users/me - Päivitä käyttäjätiedot

### 4. Välikerrokset (Middlewares)

Välikerrokset käsittelevät pyyntöjä ennen reititystä ja hallitsevat virhetilanteita.

- **authentication.js**:
  - JWT-tokenin tarkistus
  - Käyttäjätietojen lisääminen pyyntöobjektiin
  - Autentikaatiovirheiden standardoitu käsittely

- **error-handler.js**:
  - Virhekategoriat (validointi, autentikointi, tietokanta, jne.)
  - Vakavuustasot (info, success, warning, error)
  - Standardoidut HTTP-vastaukset
  - Keskitetty virheiden lokitus

### 5. Apuohjelmat (Utils)

Apumoduulit tarjoavat yhteisiä toiminnallisuuksia koko sovellukselle.

- **database.js**:
  - Tietokantayhteyden luonti connection pool -menetelmällä
  - Promise-pohjainen rajapinta kyselyihin
  - Virheenkäsittely tietokantaoperaatioissa

- **logger.js**:
  - Lokitustasot (ERROR, WARN, INFO, DEBUG)
  - Ympäristökohtainen lokituskonfiguraatio
  - Arkaluontoisten tietojen suodatus

- **token-cache.js**:
  - Kubios-tokenien välimuisti
  - Tokenien automaattinen vanhentuminen
  - Suorituskyvyn optimointi

### 6. Validointi

Validointimoduulit varmistavat syötteiden oikeellisuuden.

- **auth-validation.js**:
  - Kirjautumistietojen validointi
  - Rekisteröintitietojen tarkistus
  - Profiilitietojen päivityksen validointi

- **entry-validation.js**:
  - Verensokeriarvojen validointi (arvoalueet)
  - Päivämäärien tarkistus
  - HRV-datan validointi

## Tietokantaskeema

Tietokantaskeema koostuu seuraavista tauluista:

- **kayttaja**: Käyttäjätiedot, sisältäen kirjautumistunnukset, roolit ja Kubios-tokenit
- **kirjaus**: Verensokerimerkinnät päivämäärittäin, sisältäen eri ajankohtien mittaustulokset
- **hrv_kirjaus**: Sydämen sykevälivaihtelun (HRV) tiedot, jotka on linkitetty kirjauksiin
- **potilas_hoitaja**: Määrittelee hoitajien ja potilaiden väliset suhteet (ei käytössä)
- **ajanvaraus**: Ajanvaraustiedot hoitajien ja potilaiden välillä (ei käytössä)

Tietokannassa on myös triggereitä, jotka varmistavat käyttäjäroolien oikeellisuuden ja muiden liiketoimintasääntöjen noudattamisen.

## Autentikoinnin kulku

1. Käyttäjä rekisteröityy sovellukseen käyttäjänimellä, salasanalla ja sähköpostilla
2. Käyttäjä kirjautuu sisään, jolloin järjestelmä:
   - Tarkistaa tunnukset tietokantaa vasten
   - Generoi JWT-tokenin onnistuneelle kirjautumiselle
   - Yrittää kirjautua Kubios-palveluun samoilla tunnuksilla
   - Tallentaa Kubios-tokenin tietokantaan ja välimuistiin
3. Palvelin palauttaa JWT-tokenin asiakassovellukselle
4. Asiakas käyttää tokenia Authorization-headerissa suojatuilla reiteillä
5. Uloskirjautumisen yhteydessä Kubios-token poistetaan tietokannasta

## Kubios-integraatio

Järjestelmä integroituu Kubios Cloud API:n kanssa HRV-datan käsittelyyn:

1. Käyttäjä kirjautuu Kubios-palveluun automaattisesti sisäänkirjautumisen yhteydessä
2. Kubios-token tallennetaan tietokantaan ja välimuistiin suorituskyvyn optimoimiseksi
3. Frontend-sovellus voi hakea käyttäjän HRV-dataa tietylle päivälle
4. HRV-data yhdistetään verensokerimerkintöihin kokonaisvaltaisen terveysseurannan mahdollistamiseksi
5. Data synkronoidaan automaattisesti, kun käyttäjä tekee pyyntöjä

## Virheenkäsittely

Sovelluksessa on kattava virheenkäsittelyjärjestelmä:

1. Eri virhekategoriat (validointi, autentikointi, tietokanta, ulkoiset API:t)
2. Standardoitu vastausformaatti, joka sisältää:
   - Onnistumistilan (success: true/false)
   - Virheviestin
   - HTTP-statuskoodin
   - Vakavuustason (severity)
   - Virhekategorian
   - Mahdolliset validointivirheet kenttäkohtaisesti
3. Automaattinen virheenkäsittely express-validator -kirjaston avulla
4. Keskitetty lokitus virhetilanteissa

## Tietoturvanäkökohdat

- Salasanat on suojattu bcrypt-salauksella
- JWT-tokeneita käytetään autentikointiin
- Syötteet validoidaan ennen käsittelyä
- Tietokantakyselyt käyttävät parametrisoituja lauseita SQL-injektioiden estämiseksi
- Arkaluontoisia tietoja ei lokiteta
- Virheviestit eivät paljasta järjestelmän sisäisiä yksityiskohtia

## Suorituskykyoptimoinnit

- Connection pool -tekniikka tietokantayhteyksille
- Tokenien välimuistitus muistissa
- Asynkroniset operaatiot Node.js:n Promise-toteutuksen avulla
- Optimoidut tietokantakyselyt ja indeksit

## Konfiguroitavuus

Sovellus käyttää .env-tiedostoa konfiguraatioon, mukaan lukien:

- Tietokantayhteyden asetukset (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
- JWT-asetukset (JWT_SECRET, JWT_EXPIRES_IN)
- Kubios API -konfiguraatio (KUBIOS_CLIENT_ID, KUBIOS_API_URI jne.)
- Yleiset sovelluksen asetukset
