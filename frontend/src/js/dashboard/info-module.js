const infoContent = {
    calendar: {
        title: "Kalenterin käyttö",
        content: "Kalenteri näyttää kaikki kuukauden päivät. Punaisella merkityt päivät sisältävät valmiit merkinnät, oranssilla merkityt osittaiset merkinnät. Klikkaa päivämäärää nähdäksesi sen HRV-tiedot. Tuplaklikkaa päivämäärää lisätäksesi tai muokataksesi merkintää."
    },
    bloodSugar: {
        title: "Verensokeriseuranta",
        content: "Tämä osio näyttää verensokeriarvosi valitulta kuukaudelta. Voit tarkastella perusseurannan arvoja (aamu- ja ilta-arvot) tai ateriakohtaisia arvoja (ennen ja jälkeen)."
    },
    chart: {
        title: "Kaaviotieto",
        content: "Kaavio näyttää verensokeriarvojen kehityksen kuukauden ajalta. Voit valita näytettäväksi perusseurannan tai ateriakohtaiset arvot. Punaiset pisteet ovat mittauksia ennen ateriaa, turkoosin väriset mittauksia aterian jälkeen."
    },
    hrv: {
        title: "HRV-analyysi",
        content: "Tämä osio näyttää HRV-datan analyysin tulokset."
    }
 };

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

 function showInfoModal(infoKey) {
    const info = infoContent[infoKey];
    if (!info) return;

    alert(`${info.title}\n\n${info.content}`);
 }

 export function showHelp(component) {
    if (infoContent[component]) {
        showInfoModal(component);
    } else {
        // Yleinen ohje, jos spesifistä sisältöä ei löydy
        alert(
            'DiaBalance-sovelluksen käyttöohje\n\n' +
            '1. Kalenteri: Klikkaa päivää nähdäksesi tiedot. Tuplaklikkaa lisätäksesi merkinnän.\n' +
            '2. Verensokeriseuranta: Valitse mittaustyyppi ja tarkastele arvoja.\n' +
            '3. HRV-analyysi: Näyttäisi HRV-datan arvot, mutta toiminnallisuus ei ole käytössä.\n\n' +
            'Lisätietoja saat klikkaamalla i-painikkeita eri osioissa.'
        );
    }
 }
