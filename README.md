# DiaBalance

# ensimmäiset askeleet (19.3.2025)

### Tekninen toteutus
1. Frontend (Vite + HTML/CSS/JS)
   - Erilliset HTML-sivut jokaiselle näkymälle
   - JavaScript fetch API kommunikointiin backendin kanssa
   - LocalStorage JWT-tokenin säilyttämiseen
   - Sivujen välinen navigointi window.location.href:llä
   - Käyttöliittymän elementit näytetään/piilotetaan käyttäjäroolin mukaan

2. Backend (Node.js/Express)
   - RESTful API käyttäjien autentikointiin ja datan käsittelyyn
   - JWT-autentikaatio suojattujen reittien kontrollointiin
   - Roolipohjainen pääsynhallinta middleware
   - SQL-tietokanta käyttäjien, roolien ja merkintöjen tallentamiseen

3. Autentikaatio- ja roolijärjestelmä
   - JWT-tokeniin sisällytetään käyttäjän roolitieto
   - Backend-middlewaret tarkistavat käyttäjän oikeudet toimintoihin
   - Eri rooleja (potilas, ammattihenkilö, ylläpitäjä) varten erilliset näkymät/ominaisuudet
   - Frontend näyttää vain käyttäjän roolille sallitut toiminnot
