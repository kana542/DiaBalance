# DiaBalance

## Yleiskatsaus

DiaBalance on selaimessa toimiva sovellus diabeteksen kokonaisvaltaiseen seurantaan. Sovellus yhdistää verensokerin monitoroinnin ja sydämen sykevälivaihtelun (HRV) analysoinnin, tarjoten käyttäjille kattavan työkalun terveytensä hallintaan.

![dashboard](https://github.com/user-attachments/assets/3becef6f-b702-4b01-86bd-fdec97a92b29)
[Kaikki kuvakaappaukset](docs/screenshots)

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
Sovelluksen dokumentaatio, testausdokumentaatio, kuvakaappaukset jne.

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
* **Wireframe kuvakaappaukset**: [wireframe](docs/wireframe)
* **Figma kuvakaappaukset**: [figma](docs/figma)
* **Käyttöliittymä kuvakaappaukset**: [screenshots](docs/screenshots)
* **Backend-arkkitehtuuri**: [ARCHITECTURE.md](backend/docs/ARCHITECTURE.md)
* **Tietokantakuvaus**: [DATABASE.md](backend/docs/DATABASE.md)
* **API-dokumentaatio**: [index.html](backend/apidoc/index.html)
* **RobotFrameWork logit ja raportit**: [robot-testing.md](docs/robot-testing.md) tai [GitHub.io](https://kana542.github.io/DiaBalance/)

##  Tiedossa olevat bugit/ongelmat
-

## Referenssit
-

## Tekoälyn käyttö projektissa
Tässä projektissa on hyödynnetty tekoälyä kehitysapuna, esimerkiksi koodin tarkistukseen ja parannusehdotuksiin.
- [ChatGPT 4o](https://chatgpt.com/)
- [Claude 3.7 Sonnet (extended)](https://claude.ai)
