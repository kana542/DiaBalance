// Ohjetekstit eri sovelluksen osioille
const infoContent = {
    calendar: {
        title: "Kalenterin käyttö",
        content: "Kalenteri näyttää kaikki kuukauden päivät. Punaisella merkityt päivät sisältävät valmiit merkinnät, oranssilla merkityt osittaiset merkinnät. Klikkaa päivämäärää nähdäksesi sen HRV-tiedot. Tuplaklikkaa päivämäärää lisätäksesi tai muokataksesi merkintää."
    },
    bloodSugar: {
        title: "Verensokeriseuranta",
        content: "Tämä osio näyttää verensokeriarvosi valitulta kuukaudelta. Voit tarkastella perusseurannan arvoja (aamu- ja ilta-arvot) tai ateriakohtaisia arvoja (ennen ja jälkeen).\n\nKaavio näyttää verensokeriarvojen kehityksen kuukauden ajalta. Voit valita näytettäväksi perusseurannan tai ateriakohtaiset arvot. Punaiset pisteet ovat mittauksia ennen ateriaa, turkoosin väriset mittauksia aterian jälkeen."
    },
    hrv: {
        title: "HRV-analyysi",
        content: `
        <p><strong>Palautuminen / Readiness Score</strong></p>
        <p>Kuvaa kehon palautumisen ja valmiuden tasoa. Korkeampi lukema viittaa parempaan palautumistilaan, eli keho on hyvin palautunut ja valmis rasitukseen.</p>
        <p><em>Tyypilliset arvot: 0-100, jossa yli 70 on erinomainen, 50-70 hyvä, 30-50 kohtalainen, alle 30 heikko.</em></p>
    
        <p><strong>Stressi / Baevskyn stressi-indeksi</strong></p>
        <p>Mittaa sympaattisen hermoston aktiivisuutta. Korkeampi lukema viittaa lisääntyneeseen stressitilaan. Matalampi lukema kertoo rentoutuneemmasta tilasta.</p>
        <p><em>Tyypilliset arvot: 10-50 levossa, jossa alle 20 on erittäin alhainen stressitaso, 20-40 normaali, 40-60 kohonnut, yli 60 korkea stressitaso.</em></p>
    
        <p><strong>Keskisyke</strong></p>
        <p>Sydämen keskimääräinen lyöntinopeus minuutin aikana. Leposyke on yleensä matalampi hyväkuntoisilla henkilöillä.</p>
        <p><em>Tyypilliset arvot: 40-100 lyöntiä minuutissa. Urheilijoilla jopa 40-60, tavallisesti 60-80, yli 80 voi viitata kohonneeseen stressiin tai huonoon palautumiseen.</em></p>
    
        <p><strong>SDNN (Standard Deviation of NN intervals)</strong></p>
        <p>Mittaa sykevälivaihtelua millisekunteina. Korkeampi SDNN viittaa yleensä parempaan palautumiseen ja autonomisen hermoston toimintaan.</p>
        <p><em>Tyypilliset arvot: 20-100 ms, jossa yli 70 ms on erinomainen, 50-70 ms hyvä, 30-50 ms kohtalainen, alle 30 ms heikko.</em></p>
        `
      }
    };

// Luo modaali HTML-elementti dokumenttiin, jos sitä ei vielä ole
function createInfoModal() {
    // Tarkistetaan onko modaali jo luotu
    let modal = document.getElementById('infoModal');
    
    if (!modal) {
        // Luodaan modaalielementti
        modal = document.createElement('div');
        modal.id = 'infoModal';
        modal.className = 'modal info-modal';
        
        // Asetetaan modaalin HTML-rakenne
        modal.innerHTML = `
            <div class="modal-content info-modal-content">
                <span class="close-modal">&times;</span>
                <div class="modal-header">
                    <h2 class="modal-title" id="infoModalTitle"></h2>
                </div>
                <div class="modal-body" id="infoModalBody">
                </div>
                <div class="modal-footer">
                    <button type="button" id="infoModalCloseBtn" class="btn-secondary">Sulje</button>
                </div>
            </div>
        `;
        
        // Lisätään modaali dokumenttiin
        document.body.appendChild(modal);
        
        // Lisätään sulkemistoiminnallisuus modaalin napeille
        const closeBtn = modal.querySelector('.close-modal');
        const footerCloseBtn = modal.querySelector('#infoModalCloseBtn');
        
        closeBtn.onclick = () => closeInfoModal();
        footerCloseBtn.onclick = () => closeInfoModal();
        
        // Suljetaan modaali kun klikataan modaalin ulkopuolelta
        modal.onclick = (event) => {
            if (event.target === modal) {
                closeInfoModal();
            }
        };
    }
    
    return modal;
}

// Näyttää info-modaalin annetulla sisällöllä
function showInfoModal(infoKey) {
    // Haetaan oikea sisältö avaimen perusteella
    const info = infoContent[infoKey];
    if (!info) return;
    
    // Luodaan tai haetaan modaali
    const modal = createInfoModal();
    const modalTitle = document.getElementById('infoModalTitle');
    const modalBody = document.getElementById('infoModalBody');
    
    // Asetetaan otsikko
    modalTitle.textContent = info.title;
    
    // Tarkistetaan onko sisältö HTML-muodossa vai tavallisena tekstinä
    if (info.content.includes('<p>') || info.content.includes('<strong>')) {
        modalBody.innerHTML = info.content;
    } else {
        // Muunnetaan tavallinen teksti HTML-muotoon, säilyttäen rivinvaihdot
        modalBody.innerHTML = info.content
            .split('\n\n')
            .map(paragraph => `<p>${paragraph}</p>`)
            .join('');
    }
    
    // Näytetään modaali
    modal.style.display = 'block';
}

// Sulkee info-modaalin
function closeInfoModal() {
    const modal = document.getElementById('infoModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Asettaa info-nappien toiminnallisuuden
export function setupInfoButtons() {
    // Määritetään eri osioiden info-napit
    const infoButtons = {
        calendar: document.getElementById('calendarInfoBtn'),
        bloodSugar: document.getElementById('bloodSugarInfoBtn'),
        chart: document.getElementById('chartInfoBtn'),
        hrv: document.getElementById('hrvInfoBtn')
    };

    // Lisätään klikkaustapahtuma jokaiselle napille
    for (const [key, button] of Object.entries(infoButtons)) {
        if (button) {
            button.addEventListener('click', () => {
                showInfoModal(key);
            });
        }
    }
}

// Näyttää yleisen tai spesifisen ohjeen
export function showHelp(component) {
    if (infoContent[component]) {
        // Näytetään komponentin spesifinen ohje
        showInfoModal(component);
    } else {
        // Näytetään yleinen ohje jos spesifistä sisältöä ei löydy
        const generalInfo = {
            title: "DiaBalance-sovelluksen käyttöohje",
            content: `
            <p><strong>1. Kalenteri:</strong> Klikkaa päivää nähdäksesi tiedot. Tuplaklikkaa lisätäksesi merkinnän.</p>
            <p><strong>2. Verensokeriseuranta:</strong> Valitse mittaustyyppi ja tarkastele arvoja.</p>
            <p><strong>3. HRV-analyysi:</strong> Näyttää HRV-datan arvot palautumiseen ja stressiin liittyen.</p>
            <p>Lisätietoja saat klikkaamalla i-painikkeita eri osioissa.</p>
            `
        };
        
        // Näytetään yleinen ohje modaalissa
        const modal = createInfoModal();
        const modalTitle = document.getElementById('infoModalTitle');
        const modalBody = document.getElementById('infoModalBody');
        
        modalTitle.textContent = generalInfo.title;
        modalBody.innerHTML = generalInfo.content;
        
        modal.style.display = 'block';
    }
}