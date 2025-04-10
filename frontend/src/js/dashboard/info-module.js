/**
 * info-module.js
 * Ohjeiden ja info-nappien toiminnallisuus
 */

// Info-sisällöt eri komponenteille
const infoContent = {
   calendar: {
       title: "Kalenterin käyttö",
       content: "Kalenteri näyttää kaikki kuukauden päivät. Punaisella merkityt päivät sisältävät valmiit merkinnät, oranssilla merkityt osittaiset merkinnät. Klikkaa päivämäärää nähdäksesi sen päivän HRV-tiedot. Tuplaklikkaa päivämäärää lisätäksesi tai muokataksesi merkintää."
   },
   bloodSugar: {
       title: "Kuukausittainen verensokeriseuranta",
       content: "Tämä osio näyttää merkatut verensokeriarvosi valitulta kuukaudelta. Voit tarkastella perusseurannan arvoja (aamu- ja ilta-arvot) tai ateriakohtaisia arvoja (ennen ja jälkeen)."
   },
   chart: {
       title: "Kaaviotieto",
       content: "Kaavio näyttää verensokeriarvojen kehityksen kuukauden ajalta. Voit valita näytettäväksi perusseurannan tai ateriakohtaiset arvot. Punaiset pisteet ovat mittauksia ennen ateriaa, turkoosin väriset mittauksia aterian jälkeen. Laittamalla kursorin pisteen päälle, näet yksittäisen merkinnän tiedot"
   },
   hrv: {
       title: "HRV-analyysi",
       content: "Tämä osio näyttää ladatun HRV-datan analyysin tulokset: palautumisen, stressin, keskisykkeen ja fysiologisen iän. Lataa HRV-data päiväkirjamerkinnän kautta."
   }
};

/**
* Asettaa info-nappien tapahtumankäsittelijät
*/
export function setupInfoButtons() {
   const infoButtons = {
       calendar: document.getElementById('calendarInfoBtn'),
       bloodSugar: document.getElementById('bloodSugarInfoBtn'),
       chart: document.getElementById('chartInfoBtn'),
       hrv: document.getElementById('hrvInfoBtn')
   };

   for (const [key, button] of Object.entries(infoButtons)) {
       if (button) {
           button.addEventListener('click', () => {
               showInfoModal(key);
           });
       }
   }
}

/**
* Näyttää info-modaalin annetulle avaimelle
* @param {string} infoKey - Info-avaimen nimi ('calendar', 'bloodSugar', 'chart', 'hrv')
*/
function showInfoModal(infoKey) {
   const info = infoContent[infoKey];
   if (!info) return;

   // Käytä alerttia yksinkertaiseen näyttämiseen
   // Tositilanteessa tämä voitaisiin korvata tyylikkäämmällä modaali-toteutuksella
   alert(`${info.title}\n\n${info.content}`);
}

/**
* Näyttää ohjeita käyttäjälle
* @param {string} component - Komponentin nimi, jolle ohjeet näytetään
*/
export function showHelp(component) {
   if (infoContent[component]) {
       showInfoModal(component);
   } else {
       // Yleinen ohje, jos spesifistä sisältöä ei löydy
       alert(
           'DiaBalance-sovelluksen käyttöohje\n\n' +
           '1. Kalenteri: Klikkaa päivää nähdäksesi tiedot. Tuplaklikkaa lisätäksesi merkinnän.\n' +
           '2. Verensokeriseuranta: Valitse mittaustyyppi ja tarkastele arvoja.\n' +
           '3. HRV-analyysi: Näyttää HRV-datan arvot, jos niitä on saatavilla.\n\n' +
           'Lisätietoja saat klikkaamalla i-painikkeita eri osioissa.'
       );
   }
}
