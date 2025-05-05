# DiaBalance Frontend -arkkitehtuuri

## Järjestelmän yleiskatsaus

DiaBalance on selaimessa toimiva sovellus diabeteksen seurantaan, joka yhdistää verensokeriseurannan ja HRV-datan (sydämen sykevälivaihtelun) analysoinnin. Frontend-arkkitehtuuri noudattaa modulaarista, puhdasta JavaScript-lähestymistapaa ilman riippuvuutta kehyskirjastoista, painottaen yksinkertaisuutta ja suorituskykyä.

### Keskeiset ominaisuudet

- Verensokerin seuranta sekä perus- että ateriakohtaisilla mittauksilla
- Kalenteripohjainen kirjausjärjestelmä päivittäisille merkinnöille
- HRV-datan integrointi Kubios Cloud API:n kanssa
- Interaktiivinen datan visualisointi Chart.js:llä
- Responsiivinen suunnittelu kaikille laiteko'oille

## Teknologiapino

Frontend on rakennettu seuraavilla teknologioilla:

- **HTML5** - Semanttinen merkintäkieli rakenteelle
- **CSS3** - Mukautettu tyylittely ilman kehyskirjastoja
- **JavaScript** - ES Modules -malli modulaariseen koodin organisointiin
- **Vite** - Rakennustyökalu ja kehityspalvelin
- **Chart.js** - Datan visualisointikomponentteihin
- **LocalStorage** - Client-puolen token- ja käyttäjätietojen tallennukseen

## Sovelluksen rakenne

Sovellus noudattaa modulaarista hakemistorakennetta, joka erottaa vastuualueet:

```
frontend/
├── index.html                  # Etusivu/landing page
├── package.json                # Projektin riippuvuudet
├── vite.config.js              # Vite-konfiguraatio (dev-palvelin)
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
│   │   │   ├── register.js     # Rekisteröitymislogiikka
│   │   │   └── password-validation.js # Salasanan validointi
│   │   ├── dashboard/
│   │   │   ├── dashboard-main.js   # Dashboard-sovelluksen päämoduuli
│   │   │   ├── calendar-module.js  # Kalenterin toiminnallisuus
│   │   │   ├── entry-module.js     # Merkintöjen CRUD-toiminnot
│   │   │   ├── chart-module.js     # Kaavionäkymät
│   │   │   ├── hrv-module.js       # HRV-datan käsittely
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

## Moduulimalli

Sovellus käyttää ES Module -mallia koodin organisointiin, jossa jokainen moduuli vastaa tietystä vastuualueesta:

- **Päämoduulit**: Alustus ja globaali tilan hallinta
- **Ominaisuusmoduulit**: Tietty toiminnallisuus kapseloituna itsenäisiin moduuleihin
- **Apumoduulit**: Uudelleenkäytettävät apufunktiot, joita jaetaan sovelluksen eri osissa

Tämä lähestymistapa varmistaa hyvän vastuualueiden erottelun ja tekee koodipohjasta helpommin ylläpidettävän ja laajennettavan.

## Tietovirta

Sovelluksen tietovirta noudattaa seuraavaa mallia:

1. **Autentikaatio**
   - Käyttäjä kirjautuu tai rekisteröityy autentikaationäkymien kautta
   - Autentikaatiotokeni ja käyttäjätiedot tallennetaan localStorageen
   - Auth-check validoi tokenin suojatuilla sivuilla

2. **Tietojen haku**
   - Dashboard alustaa ja lataa tarvittavat moduulit
   - Kalenteri- ja merkintämoduulit hakevat dataa backendistä
   - HRV-tiedot haetaan Kubios-integraation kautta

3. **Käyttäjän vuorovaikutus**
   - Käyttäjä valitsee päivämääriä kalenterissa nähdäkseen merkintöjä
   - Käyttäjä lisää/muokkaa merkintöjä modaalikäyttöliittymän kautta
   - Verensokeri- ja HRV-visualisoinnit päivittyvät valitun datan mukaan

4. **Tietojen synkronointi**
   - Muutokset lähetetään välittömästi backendille
   - Käyttöliittymä päivitetään muutosten mukaisesti
   - Kaaviot päivitetään uudella datalla

## Tilan hallinta

Ilman erillisyä tilan hallintakirjastoa sovellus käyttää yksinkertaista mutta tehokasta lähestymistapaa:

- `window.DiaBalance` -objekti toimii jaettuna tilakonttina
- Jokainen moduuli ylläpitää omaa sisäistä tilaansa
- Moduulit kommunikoivat paljastettujen metodien kautta
- Tapahtumia käytetään moduulien väliseen kommunikaatioon

## API-integraatio

Frontend kommunikoi backendin kanssa erillisen API-asiakkaan kautta:

- RESTful-päätepisteet CRUD-operaatioille
- JWT-token-autentikaatio Authorization-headerin kautta
- Standardoitu vastausten käsittely
- Virheiden käsittely ja käyttäjäpalaute
- Kubios API -integraatio HRV-dataa varten

## Tietoturvakysymykset

Frontendiin toteutetut turvatoimet:

- JWT-pohjainen autentikaatio turvallisella tokenin tallennuksella
- Käyttöoikeustarkistukset suojatuilla reiteillä
- Lomakkeiden validointi ja sanitointi
- Istunnon aikakatkaisun käsittely
- Vain HTTPS-viestintä

## Responsiivinen suunnittelu

Sovellus on suunniteltu toimimaan eri laitteilla:

- Mobile-first CSS-lähestymistapa
- Responsiiviset ruudukkoasettelut
- Mukautuvat komponenttien koot
- Kosketusystävälliset käyttöliittymäelementit
- Optimoitu asettelu erikokoisille näytöille