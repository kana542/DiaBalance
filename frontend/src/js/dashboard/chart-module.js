/**
 * chart-module.js
 * Verensokeriseurannan kaaviot ja visualisoinnit Chart.js:llä
 */

import { formatLocalizedDate } from '../utils/date-utils.js';
import { updateHRVView } from './hrv-module.js';

// Moduulin sisäiset muuttujat
let currentMeasurementType = 'Ateriat';
let currentMealType = 'Iltapala';
let glucoseChart = null; // Chart.js instanssi

/**
 * Alustaa kaavionäkymän
 */
export function initializeChartView() {
    // Lisää Chart.js CDN
    addChartJsLibrary();
    
    const measurementTypeSelect = document.getElementById('measurementType');
    const mealTypeGroup = document.getElementById('mealTypeGroup');

    if (measurementTypeSelect && mealTypeGroup) {
        // Aseta aloitusarvot nykyiseen tilaan
        currentMeasurementType = measurementTypeSelect.value;

        measurementTypeSelect.addEventListener('change', function() {
            currentMeasurementType = this.value;
            mealTypeGroup.style.display = this.value === 'Perus' ? 'none' : 'flex';

            // Päivitä kaavio uusilla asetuksilla
            updateMonthChart();
        });

        const mealTypeSelect = document.getElementById('mealType');
        if (mealTypeSelect) {
            // Aseta aloitusarvo nykyiseen tilaan
            currentMealType = mealTypeSelect.value;

            mealTypeSelect.addEventListener('change', function() {
                currentMealType = this.value;

                // Päivitä kaavio uusilla asetuksilla
                updateMonthChart();
            });
        }

        // Aseta näkyvyys valinnan mukaan
        mealTypeGroup.style.display = measurementTypeSelect.value === 'Perus' ? 'none' : 'flex';
        
        // Valmistele chart-placeholder kaaviolle
        prepareChartContainer();
    }
}

/**
 * Lisää Chart.js-kirjasto dynaamisesti
 */
function addChartJsLibrary() {
    // Tarkista onko jo lisätty
    if (document.getElementById('chart-js-lib')) return;
    
    const script = document.createElement('script');
    script.id = 'chart-js-lib';
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.onload = () => {
        console.log('Chart.js loaded successfully');
        // Alusta kaavio kun kirjasto on ladattu
        initializeChart();
    };
    document.head.appendChild(script);
}

/**
 * Valmistele chart-container canvas-elementtiä varten
 */
function prepareChartContainer() {
    const chartPlaceholder = document.getElementById('chart-placeholder');
    if (!chartPlaceholder) return;
    
    // Tyhjennä nykyinen sisältö
    chartPlaceholder.innerHTML = '';
    
    // Luo canvas-elementti Chart.js:ää varten
    const canvas = document.createElement('canvas');
    canvas.id = 'glucose-chart';
    canvas.style.width = '100%';
    canvas.style.height = '250px';
    
    // Lisää canvas chart-placeholderiin
    chartPlaceholder.appendChild(canvas);
}

/**
 * Alustaa Chart.js-kaavion
 */
function initializeChart() {
    // Tarkista onko Chart.js saatavilla
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }
    
    const chartCanvas = document.getElementById('glucose-chart');
    if (!chartCanvas) return;
    
    // Tuhoa edellinen kaavio jos sellainen on
    if (glucoseChart) {
        glucoseChart.destroy();
    }
    
    // Luo uusi kaavio
    glucoseChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Ennen',
                    data: [],
                    borderColor: '#ff5869',
                    backgroundColor: '#ff5869',
                    tension: 0.4, // Pehmeämmät kaaret
                    fill: false, // Ei täyttöä viivan alle
                    pointRadius: 5,
                    pointHoverRadius: 8
                },
                {
                    label: 'Jälkeen',
                    data: [],
                    borderColor: '#4ecdc4',
                    backgroundColor: '#4ecdc4',
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: false, // Piilota x-akseli kokonaan, koska tooltip näyttää päivämäärät
                    grid: {
                        display: false // Piilota myös ruudukko
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Verensokeri (mmol/l)'
                    },
                    suggestedMin: 4,
                    suggestedMax: 12
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            // Muotoile päivämäärä tooltipissa
                            const dateStr = tooltipItems[0].label;
                            if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                return formatLocalizedDate(dateStr, 'fi-FI', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                });
                            }
                            return dateStr;
                        },
                        label: function(context) {
                            // Näytä arvo tooltipissa
                            return `${context.dataset.label}: ${context.raw || '-'} mmol/l`;
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true, // Käytä palloja laatikoiden sijaan
                        pointStyle: 'circle',
                        pointStyleWidth: 10 // Tee palloista hieman isompia
                    }
                }
            }
        }
    });
    
    // Päivitä kaavio nykyisillä asetuksilla
    updateMonthChart();
}

/**
 * Näyttää päivän tiedot ja päivittää kaavion
 * @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
 */
export function showDayData(dateStr) {
    console.log("Showing data for date:", dateStr);

    // Korostaa valitun päivän kaaviossa
    highlightSelectedDate(dateStr);
    
    // HRV-näkymä näyttää aina vain placeholder-viivat
    updateHRVView();
    
    // Päivitä kaavio koko kuukauden datalla
    updateMonthChart();
}

/**
 * Korostaa valitun päivän kaaviossa
 * @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
 */
function highlightSelectedDate(dateStr) {
    if (!glucoseChart) return;
    
    // Voit tehdä korostuslogiikan täällä jos haluatte
    // Esim. lisäämällä annotation-pluginin kaaviolle
    console.log("Selected date:", dateStr);
}

/**
 * Päivittää kuukauden verensokeriarvot kaavioon
 */
function updateMonthChart() {
    if (!glucoseChart) {
        // Jos kaaviota ei ole vielä alustettu, alusta se
        initializeChart();
        return;
    }
    
    const entries = window.DiaBalance.entries.monthEntries || {};
    
    // Järjestä päivämäärät
    const sortedDates = Object.keys(entries).sort();
    
    // Valmistele data kaaviolle
    const chartData = {
        labels: [],
        beforeValues: [],
        afterValues: []
    };
    
    // Käy läpi kaikki päivämäärät ja kerää arvot
    sortedDates.forEach(dateStr => {
        const entry = entries[dateStr];
        if (!entry) return;
        
        // Poimi oikeat arvot mittaustyypin mukaan
        let beforeValue = null, afterValue = null;
        
        if (currentMeasurementType === 'Perus') {
            beforeValue = entry.morningValue;
            afterValue = entry.eveningValue;
        } else {
            switch (currentMealType) {
                case 'Aamupala':
                    beforeValue = entry.breakfastBefore; afterValue = entry.breakfastAfter;
                    break;
                case 'Lounas':
                    beforeValue = entry.lunchBefore; afterValue = entry.lunchAfter;
                    break;
                case 'Välipala':
                    beforeValue = entry.snackBefore; afterValue = entry.snackAfter;
                    break;
                case 'Päivällinen':
                    beforeValue = entry.dinnerBefore; afterValue = entry.dinnerAfter;
                    break;
                case 'Iltapala':
                    beforeValue = entry.eveningSnackBefore; afterValue = entry.eveningSnackAfter;
                    break;
            }
        }
        
        // Muunna string-arvot numeroiksi
        beforeValue = beforeValue !== null && beforeValue !== '' ? parseFloat(beforeValue) : null;
        afterValue = afterValue !== null && afterValue !== '' ? parseFloat(afterValue) : null;
        
        // Lisää arvot kaavion dataan jos jompikumpi on olemassa
        chartData.labels.push(dateStr);
        chartData.beforeValues.push(beforeValue);
        chartData.afterValues.push(afterValue);
    });
    
    // Päivitä kaavion otsikot
    glucoseChart.data.labels = chartData.labels;
    
    // Päivitä kaavion dataset-nimet nykyisen mittaustyypin mukaan
    const beforeLabel = currentMeasurementType === 'Perus' ? 'Aamu' : 'Ennen';
    const afterLabel = currentMeasurementType === 'Perus' ? 'Ilta' : 'Jälkeen';
    
    // Päivitä kaavion data
    glucoseChart.data.datasets[0].label = beforeLabel;
    glucoseChart.data.datasets[0].data = chartData.beforeValues;
    
    glucoseChart.data.datasets[1].label = afterLabel;
    glucoseChart.data.datasets[1].data = chartData.afterValues;
    
    // Päivitä kaavion otsikko
    let chartTitle = '';
    if (currentMeasurementType === 'Perus') {
        chartTitle = 'Perusseuranta: Aamu- ja ilta-arvot';
    } else {
        chartTitle = `Ateriaseuranta: ${currentMealType}`;
    }
    
    // Päivitä kaavion otsikko jos Plugin title on käytössä
    if (glucoseChart.options.plugins && glucoseChart.options.plugins.title) {
        glucoseChart.options.plugins.title.text = chartTitle;
    }
    
    // Päivitä kaavio
    glucoseChart.update();
}

/**
 * Näyttää tyhjän näkymän kun merkintää ei ole
 * @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
 */
export function showEmptyView(dateStr) {
    // Tyhjennä HRV-näkymä (näyttää aina vain viivat)
    updateHRVView();
    
    // Näytä tyhjä kaavio - ei tarvitse tyhjentää,
    // vaan päivitetään normaalisti kuukausinäkymä
    updateMonthChart();
}

/**
 * Asettaa nykyisen mittaustyypin
 * @param {string} type - Mittaustyyppi ('Perus'/'Ateriat')
 */
export function setMeasurementType(type) {
    const measurementTypeSelect = document.getElementById('measurementType');
    if (measurementTypeSelect && (type === 'Perus' || type === 'Ateriat')) {
        measurementTypeSelect.value = type;
        currentMeasurementType = type;
        
        const mealTypeGroup = document.getElementById('mealTypeGroup');
        if (mealTypeGroup) {
            mealTypeGroup.style.display = type === 'Perus' ? 'none' : 'flex';
        }
        
        // Päivitä kaavio
        updateMonthChart();
    }
}

/**
 * Asettaa nykyisen ateriatyypin
 * @param {string} type - Ateriatyyppi ('Aamupala', 'Lounas', jne.)
 */
export function setMealType(type) {
    const mealTypeSelect = document.getElementById('mealType');
    const validTypes = ['Aamupala', 'Lounas', 'Välipala', 'Päivällinen', 'Iltapala'];
    
    if (mealTypeSelect && validTypes.includes(type)) {
        mealTypeSelect.value = type;
        currentMealType = type;
        
        // Päivitä kaavio
        updateMonthChart();
    }
}

/**
 * Palauttaa nykyisen mittaustyypin ja ateriatyypin
 * @returns {Object} - {measurementType, mealType}
 */
export function getCurrentChartSettings() {
    return {
        measurementType: currentMeasurementType,
        mealType: currentMealType
    };
}

/**
 * Päivittää kaavion kun merkintöjä lisätään tai poistetaan
 */
export function refreshChart() {
    // Kutsu tätä kun merkintöjä lisätään tai poistetaan
    updateMonthChart();
}