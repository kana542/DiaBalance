# DiaBalance

## Yleiskatsaus

DiaBalance on selaimessa toimiva sovellus diabeteksen kokonaisvaltaiseen seurantaan. Sovellus yhdistää verensokerin monitoroinnin ja sydämen sykevälivaihtelun (HRV) analysoinnin, tarjoten käyttäjille kattavan työkalun terveytensä hallintaan.

![screenshot2](https://github.com/user-attachments/assets/d4a164ca-f823-4068-bd37-d1db39442bb8)

## Ominaisuudet

### Käyttäjähallinta
- Rekisteröityminen käyttäjänimellä, sähköpostilla ja salasanalla
- Kirjautuminen ja uloskirjautuminen
- Kirjautumistilan säilyttäminen JWT-tokeneilla
- Käyttäjäprofiilin hallinta ja päivitys

### Verensokeriseuranta
- Uusien merkintöjen lisääminen, muokkaaminen ja poistaminen
- Päiväkohtaiset perusmittaukset (aamu/ilta)
- Ateriakohtaiset mittaukset (ennen/jälkeen aterioiden)
- Oireseuranta
- Vapaamuotoiset kommentit

### Kalenteri ja visualisointi
- Kuukausikalenteri merkintöjen seurantaan
- Värikoodatut merkinnät täydellisille ja osittaisille kirjauksille
- Verensokeriarvojen graafinen esitys
- Mittaustyypin vaihtamismahdollisuus (perusseuranta/ateriat)
- Ateriakohtainen suodatus kaavioissa

### HRV-integraatio (Kubios)
- Automaattinen Kubios-kirjautuminen
- HRV-datan nouto ja yhdistäminen verensokerimerkintöihin
- Keskeiset HRV-metriikat:
  - Palautuminen (Readiness Score)
  - Stressi (Baevskyn stressi-indeksi)
  - Keskisyke (lyöntiä/min)
  - SDNN (sykevälivaihtelun mitta, ms)

### Käyttöliittymä
- Responsiivinen suunnittelu eri laitteille
- Selkeä navigointi
- Saavutettavat väri- ja kontrastivalinnat

## Teknologiapino

- **Backend**: Node.js, Express, MySQL
- **Frontend**: JavaScript, HTML, CSS
- **Testaus**: Robot Framework, Browser Library
- **Integraatiot**: Kubios Cloud API (HRV-data)

## Projektin rakenne

### Backend
Backend on toteutettu Node.js ja Express -teknologioilla, tarjoten REST API -rajapinnan:

- **controllers**: API-pyyntöjen käsittely (auth, entry, kubios)
- **middlewares**: Autentikointi ja virheenkäsittely
- **models**: Tietokantaoperaatiot ja datamallit
- **routes**: API-rajapinnan reitit
- **utils**: Apufunktiot (tietokantayhteydet, lokitus)
- **validation**: Syötteiden validointisäännöt
- **db**: Tietokantaskeema ja SQL-skriptit

### Frontend
Frontend on toteutettu puhtaalla JavaScriptillä, HTML:llä ja CSS:llä moduulipohjaisella arkkitehtuurilla:

- **css**: Tyylitiedostot
- **js**: JavaScript-moduulit
  - **auth**: Kirjautuminen ja rekisteröinti
  - **dashboard**: Päänäkymän toiminnallisuudet
  - **utils**: Yleiset apufunktiot
- **pages**: HTML-sivut

### Testing
Testauspaketti on toteutettu Robot Framework -työkalulla:

- **resources**: Testien avainsanatiedostot
- **tests**: Testitiedostot (backend ja frontend)
- **results**: Testien tulokset
- **variables**: Ympäristömuuttujat testeille

### Docs
Sovelluksen dokumentaatio, käyttöohjeet ja testausdokumentaatio.

## Asennus ja käyttöönotto

### Vaatimukset
- Node.js (v18 tai uudempi)
- MySQL-tietokanta
- Kubios-tunnukset (HRV-ominaisuuksia varten)

### Backend-asennus
```bash
cd backend
npm install
cp .env.example .env  # täytä tarvittavat tiedot
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
robot tests
```

## Dokumentaatio

Tarkempi dokumentaatio löytyy kansiosta `docs` sekä erillisistä dokumentaatiotiedostoista backend- ja frontend-kansioissa:

* **Backend-arkkitehtuuri**: `backend/docs/ARCHITECTURE.md`
* **Tietokantakuvaus**: `backend/docs/DATABASE.md`
* **API-dokumentaatio**: `backend/apidoc/index.html`
