# DiaBalance

DiaBalance on selaimessa toimiva sovellus diabeteksen seurantaan. Sovellus yhdistää verensokerin seurannan ja sydämen sykevälivaihtelun (HRV) analysoinnin, tarjoten käyttäjille kokonaisvaltaisen työkalun terveytensä hallintaan.

## Projektin rakenne

### Backend

Backend-toteutus on rakennettu Node.js ja Express -teknologioilla. Se tarjoaa REST API -rajapinnan diabetesmerkintöjen hallintaan ja Kubios HRV -datan integrointiin.

* **controllers**: Sisältää logiikan API-pyyntöjen käsittelyyn (auth, entry, kubios)
* **middlewares**: Autentikointi ja virheenkäsittely
* **models**: Tietokantaoperaatiot ja datamallit
* **routes**: API-rajapinnan reitit
* **utils**: Apufunktiot kuten tietokantayhteydet ja lokitus
* **validation**: Syötteiden validointisäännöt
* **db**: Tietokantaskeema ja SQL-skriptit

### Frontend

Frontend on toteutettu puhtaalla JavaScriptillä, HTML\:llä ja CSS\:llä. Sovellus käyttää moduulipohjaista arkkitehtuuria.

* **css**: Tyylitiedostot (dashboard, login, register)
* **js**: JavaScript-moduulit

  * **auth**: Kirjautuminen ja rekisteröinti
  * **dashboard**: Sovelluksen päänäkymän toiminnallisuudet
  * **utils**: Yleiset apufunktiot
* **pages**: HTML-sivut (dashboard, login, register)

### Testing

Testauspaketti on toteutettu Robot Framework -työkalulla. Se sisältää automaatiotestit sekä frontend- että backend-toteutuksille.

* **resources**: Testien avainsanatiedostot
* **tests**: Testitiedostot

  * **backend**: Backend-testit (kirjautuminen, merkintöjen käsittely)
  * **frontend**: Frontend-testit (käyttöliittymän toiminnallisuudet)
* **results**: Testien tulokset (raportit, kuvakaappaukset)
* **variables**: Ympäristömuuttujat testeille

### Docs

Sisältää yleisiä dokumentaatiotiedostoja kuten käyttöohjeet ja testausdokumentaation.

## Teknologiapino

* **Backend**: Node.js, Express, MySQL
* **Frontend**: JavaScript, HTML, CSS
* **Testaus**: Robot Framework, Browser Library
* **Muut**: Kubios Cloud API -integraatio (HRV-data)

## Asennus ja käyttöönotto

### Vaatimukset

* Node.js (v18 tai uudempi)
* MySQL-tietokanta
* Kubios-tunnukset (HRV-ominaisuuksia varten)

### Backend-asennus

```bash
cd backend
npm install
cp .env.example .env # täytä tarvittavat tiedot
mysql -u root -p < db/diabalance.sql
npm run dev
```

### Frontend-asennus

```bash
cd frontend
npm install
npm run dev
```

### Testien ajaminen

```bash
cd testing
pip install -r requirements.txt
cp .env.sample .env # täytä tarvittavat tiedot
robot tests/
```

## Dokumentaatio

Tarkempi dokumentaatio löytyy kansiosta `docs` sekä erillisistä dokumentaatiotiedostoista backend- ja frontend-kansioissa:

* **Backend-arkkitehtuuri**: `backend/docs/ARCHITECTURE.md`
* **Tietokantakuvaus**: `backend/docs/DATABASE.md`
* **API-dokumentaatio**: `backend/apidoc/index.html`
