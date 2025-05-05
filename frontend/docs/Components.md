# DiaBalance Frontend -komponentit

Tämä dokumentti tarjoaa yksityiskohtaiset kuvaukset DiaBalance-sovelluksen frontend-pääkomponenteista, niiden vastuualueista ja vuorovaikutuksista.

## Komponenttihierarkia

DiaBalance-frontend on järjestetty useisiin keskeisiin komponenttiryhmiin:

```
DiaBalance
├── Autentikaatiokomponentit
│   ├── Kirjautumislomake
│   ├── Rekisteröitymislomake
│   └── Autentikaation tarkistus
├── Dashboard-komponentit
│   ├── Kalenteri
│   ├── Verensokeriseuranta
│   │   └── Kaaviot
│   ├── HRV-mittarit
│   └── Merkintämodaali
└── Apukomponentit
    ├── API-asiakas
    ├── Päivämääräapuvälineet
    ├── Toast-ilmoitukset
    └── Validointiapuvälineet
```

## Keskeiset näkymät

### Etusivu (index.html)

Etusivu toimii sovelluksen sisäänkäyntinä ja sisältää:

- Navigointipalkin autentikaatiolinkkeineen
- Hero-osion sovelluksen yleiskatsauksella
- Tietosiosiot sovelluksesta
- Käyttöohjeet

**Keskeiset tiedostot**:
- `index.html` - Päärakenne
- `main.js` - Etusivun toiminnallisuus
- Autentikaatiotarkistus käyttöliittymän sovittamiseksi kirjautumistilan mukaan

### Kirjautumissivu (login.html)

Tarjoaa käyttäjän tunnistautumisen:

- Käyttäjänimi/sähköposti- ja salasanakentät
- Validointipalaute
- Virheilmoitukset
- Linkki rekisteröitymiseen

**Keskeiset tiedostot**:
- `login.html` - Lomakkeen rakenne
- `auth.js` - Autentikaatiologiikka
- `login.css` - Tyylittelyt

### Rekisteröitymissivu (register.html)

Mahdollistaa uusien käyttäjätilien luomisen:

- Rekisteröitymislomake validoinnilla
- Salasanan vahvuusmittari
- Reaaliaikainen validointipalaute
- Linkki kirjautumissivulle

**Keskeiset tiedostot**:
- `register.html` - Lomakkeen rakenne
- `register.js` - Rekisteröitymislogiikka
- `password-validation.js` - Salasanan validointi
- `register.css` - Tyylittelyt

### Dashboard (dashboard.html)

Sovelluksen pääkäyttöliittymä autentikaation jälkeen, koostuu:

- Ylätunnisteesta käyttäjätiedoilla ja uloskirjautumispainikkeella
- Kalenterista päivämäärän valintaan
- Verensokeriseurantaosiosta kaavioilla
- HRV-datan visualisoinnista
- Modaalista merkintöjen hallintaan

**Keskeiset tiedostot**:
- `dashboard.html` - Päärakenne
- `dashboard-main.js` - Alustus ja koordinointi
- `dashboard.css` - Tyylittelyt

## Komponenttien yksityiskohtaiset kuvaukset

### Autentikaatiokomponentit

#### Auth-moduuli (auth.js)

**Vastuualue**: Käsittelee käyttäjän sisäänkirjautumista ja tokenin hallintaa.

**Keskeiset funktiot**:
- `handleLogin()` - Käsittelee kirjautumislomakkeen lähettämisen
- `login()` - API-kutsu käyttäjän autentikointiin
- `getAuthToken()` - Hakee tallennetun tokenin
- `clearAuthToken()` - Tyhjentää autentikaatiotiedot

#### Register-moduuli (register.js)

**Vastuualue**: Käsittelee uuden käyttäjän rekisteröitymisen.

**Keskeiset funktiot**:
- `handleRegister()` - Käsittelee rekisteröitymislomakkeen lähettämisen
- `setupFormValidation()` - Asettaa lomakkeen validoinnin
- `register()` - API-kutsu uuden käyttäjän luomiseen

#### Auth Check -moduuli (auth-check.js)

**Vastuualue**: Validoi autentikaation suojatuilla sivuilla.

**Keskeiset funktiot**:
- Automaattinen tokenin tarkistus sivun latauksessa
- Uudelleenohjaus kirjautumissivulle, jos token puuttuu tai on virheellinen

#### Salasanan validointi -moduuli (password-validation.js)

**Vastuualue**: Validoi salasanan vahvuuden ja täsmäävyyden.

**Keskeiset funktiot**:
- `evaluatePasswordStrength()` - Tarkistaa salasanan turvallisuuskriteerien mukaan
- `updatePasswordStrengthMeter()` - Päivittää käyttöliittymäpalautteen
- `doPasswordsMatch()` - Varmistaa salasanan vahvistuksen

### Dashboard-komponentit

#### Dashboard Main -moduuli (dashboard-main.js)

**Vastuualue**: Alustaa ja koordinoi dashboard-moduuleja.

**Keskeiset funktiot**:
- `initializeUI()` - Asettaa dashboard-käyttöliittymäkomponentit
- `updateUserInfo()` - Päivittää näytetyt käyttäjätiedot
- `handleLogout()` - Käsittelee käyttäjän uloskirjautumisen
- Globaali tilan hallinta `window.DiaBalance`-objektin kautta

#### Kalenteri-moduuli (calendar-module.js)

**Vastuualue**: Hallitsee kalenterinäyttöä ja päivämäärän valintaa.

**Keskeiset funktiot**:
- `initializeCalendar()` - Asettaa kalenterin käyttöliittymän
- `updateCalendarView()` - Päivittää kalenterin merkinnöillä
- `getMonthEntries()` - Palauttaa merkinnät nykyiselle kuukaudelle
- Tapahtumankäsittelijät päivämäärän valintaan ja merkintöjen muokkaamiseen

#### Merkintä-moduuli (entry-module.js)

**Vastuualue**: Käsittelee merkintöjen CRUD-operaatiot.

**Keskeiset funktiot**:
- `loadMonthEntries()` - Hakee merkinnät kuukausinäyttöä varten
- `saveEntryData()` - Tallentaa merkinnän backendiin
- `deleteEntryData()` - Poistaa merkinnän backendistä
- Tietojen muunnos frontendin ja backendin formaattien välillä

#### Kaavio-moduuli (chart-module.js)

**Vastuualue**: Luo ja päivittää verensokerikuvaajia.

**Keskeiset funktiot**:
- `initializeChartView()` - Asettaa kaavionäytön
- `updateMonthChart()` - Päivittää kaavion nykyisellä datalla
- `showDayData()` - Päivittää kaavion valitulle päivälle
- `setMeasurementType()` - Vaihtaa näytettävää mittaustyyppiä

#### HRV-moduuli (hrv-module.js)

**Vastuualue**: Hallitsee HRV-datan hakua ja näyttöä.

**Keskeiset funktiot**:
- `updateHRVView()` - Päivittää HRV-mittareiden näytön
- `fetchAndSaveHrvDataForDay()` - Hakee HRV-datan Kubioksesta
- `saveHrvDataToDatabase()` - Tallentaa HRV-datan backendiin

#### Modaali-moduuli (modal-module.js)

**Vastuualue**: Hallitsee merkintöjen luomis-/muokkausmodaalia.

**Keskeiset funktiot**:
- `initializeModalModule()` - Asettaa modaalin käyttöliittymän
- `openEntryModal()` - Avaa modaalin merkintätiedoilla
- `closeEntryModal()` - Sulkee modaalin
- `setupModalEvents()` - Asettaa tapahtumankäsittelijät

#### Info-moduuli (info-module.js)

**Vastuualue**: Hallitsee info-nappeja ja ohjesisältöä.

**Keskeiset funktiot**:
- `setupInfoButtons()` - Alustaa info-napit
- `showInfoModal()` - Näyttää ohjetietoja
- `showHelp()` - Näyttää kontekstisidonnaista ohjeistusta

### Apukomponentit

#### API-asiakas (api-client.js)

**Vastuualue**: Käsittelee kaiken API-kommunikaation.

**Keskeiset funktiot**:
- `fetchWithAuth()` - Tekee autentikoituja API-pyyntöjä
- `apiGet()`, `apiPost()`, `apiPut()`, `apiDelete()` - HTTP-metodien käärimet
- `handleApiResponse()` - Standardoi vastausten käsittelyn
- Tokenin hallintafunktiot

#### Päivämääräapuvälineet (date-utils.js)

**Vastuualue**: Tarjoaa päivämäärien muotoilun ja manipuloinnin.

**Keskeiset funktiot**:
- `formatDateYYYYMMDD()` - Muotoilee päivämäärän YYYY-MM-DD -muotoon
- `formatDateISOString()` - Muotoilee päivämäärän ISO-stringiksi
- `formatLocalizedDate()` - Muotoilee päivämäärän lokalisoitua näyttöä varten
- `isToday()` - Tarkistaa, onko päivämäärä tänään
- `compareDates()` - Vertailee kahta päivämäärää

#### UI-apuvälineet (ui-utils.js)

**Vastuualue**: Tarjoaa käyttöliittymäapufunktioita.

**Keskeiset funktiot**:
- `showToast()` - Näyttää ilmoitusviestejä
- `showError()` - Näyttää virheilmoituksia
- `showConfirmDialog()` - Näyttää vahvistusdialogin
- `createElement()` - Luo HTML-elementtejä
- `showValidationErrors()` - Näyttää lomakkeen validointivirheet

#### Verensokerin validointi (blood-sugar-validation.js)

**Vastuualue**: Validoi verensokerin syöttöarvot.

**Keskeiset funktiot**:
- `validateBloodSugarValue()` - Tarkistaa arvoalueen
- `setupBloodSugarValidation()` - Asettaa validoinnin syöttökentälle
- `setupAllBloodSugarInputs()` - Alustaa validoinnin kaikille kentille

## Komponenttien vuorovaikutukset

### Autentikaatiovirta

1. Käyttäjä syöttää tunnukset kirjautumislomakkeeseen
2. `auth.js` käsittelee lomakkeen lähettämisen `handleLogin()`-funktiolla
3. API-asiakas tekee autentikaatiopyynnön
4. Onnistuessa token tallennetaan ja käyttäjä uudelleenohjataan
5. Myöhemmillä sivulatauksilla `auth-check.js` validoi tokenin

### Dashboardin alustus

1. `dashboard-main.js` alustuu, kun DOM on ladattu
2. Autentikaation tarkistus varmistaa, että käyttäjä on kirjautunut
3. Dashboard-moduulit tuodaan ja tallennetaan `window.DiaBalance`-objektiin
4. Käyttöliittymä alustetaan `initializeUI()`-funktiolla
5. Jokainen moduuli alustetaan vastaavilla funktioilla

### Tietojensyöttövirta

1. Käyttäjä valitsee päivämäärän kalenterista
2. `calendar-module.js` laukaisee `openEntryModal()`-funktion
3. `modal-module.js` näyttää modaalin lomakkeella
4. Käyttäjä syöttää tai muokkaa tietoja
5. Tallennettaessa `entry-module.js` käsittelee `saveEntryData()`-funktion
6. API-asiakas lähettää tiedot backendille
7. Kalenteri ja kaaviot päivitetään

### HRV-datan integraatio

1. Käyttäjä klikkaa "Hae HRV-data" -nappia merkintämodaalissa
2. `hrv-module.js` suorittaa `fetchAndSaveHrvDataForDay()`-funktion
3. API-asiakas hakee datan Kubioksesta backendin kautta
4. Data tallennetaan `saveHrvDataToDatabase()`-funktiolla
5. HRV-mittarit päivitetään `updateHRVView()`-funktiolla

## Käyttöliittymäkomponentit

### Toast-ilmoitukset

Tarjoaa palautetta käyttäjille ei-häiritsevien ilmoitusten kautta.

**Ominaisuudet**:
- Useat vakavuustasot (info, success, warning, error)
- Automaattinen hylkäys aikarajan jälkeen
- Pinoaminen useille ilmoituksille

### Lomakkeiden validointi

Tarjoaa reaaliaikaista validointipalautetta lomakkeiden syötteille.

**Ominaisuudet**:
- Välitön visuaalinen palaute
- Virheilmoitukset
- Salasanan vahvuusmittari
- Kenttien välinen validointi (salasanan vahvistus)

### Modaalidialogi

Käytetään merkintöjen luomiseen ja muokkaamiseen.

**Ominaisuudet**:
- Lomake verensokeriarvoille
- Oireiden valinta
- HRV-datan integraatio
- Tallenna-, peruuta- ja poista-toiminnot

### Infomodaalit

Tarjoaa kontekstuaalista apua sovelluksen eri osissa.

**Ominaisuudet**:
- Kontekstisidonnainen tieto
- Yksityiskohtaiset selitykset ominaisuuksista
- Visuaaliset esimerkit ja ohjeet