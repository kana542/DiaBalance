/**
 * hrv-module.js
 * HRV-datan käsittelyn placeholder-versio
 *
 * Tämä on yksinkertaistettu versio joka näyttää vain viivat HRV-metriikoissa
 * eikä mahdollista datan latausta tai muokkausta
 */

/**
 * Alustaa HRV-moduulin
 */
export function initializeHRVModule() {
    console.log('HRV module initialized (placeholder only)');

    // Asetetaan kaikki HRV-arvot viivoiksi
    resetHRVValues();
}

/**
 * Päivittää HRV-tietojen näkymän
 * @param {Object|null} hrvData - HRV-data (ei käytössä tällä hetkellä)
 */
export function updateHRVView(hrvData = null) {
    // Tällä hetkellä näytämme aina vain viivat riippumatta datasta
    resetHRVValues();
}

/**
 * Asettaa kaikki HRV-arvot viivoiksi
 */
function resetHRVValues() {
    const elements = {
        readiness: document.querySelector('.metric-card:nth-child(1) .metric-value'),
        stress: document.querySelector('.metric-card:nth-child(2) .metric-value'),
        heartRate: document.querySelector('.metric-card:nth-child(3) .metric-value'),
        age: document.querySelector('.metric-card:nth-child(4) .metric-value')
    };

    // Aseta viivat kaikkiin elementteihin
    Object.values(elements).forEach(el => {
        if (el) el.textContent = '–';
    });
}
