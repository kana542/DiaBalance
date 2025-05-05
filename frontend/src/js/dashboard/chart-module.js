import { formatLocalizedDate } from '../utils/date-utils.js';
import { updateHRVView } from './hrv-module.js';

// Moduulin sisäiset muuttujat kaaviolle
let currentMeasurementType = 'Ateriat';
let currentMealType = 'Iltapala';
let glucoseChart = null;

// Alustaa kaavionäkymän
export function initializeChartView() {
    // Lisää Chart.js-kirjasto dokumenttiin
    addChartJsLibrary();

    // Haetaan tarvittavat HTML-elementit
    const measurementTypeSelect = document.getElementById('measurementType');
    const mealTypeGroup = document.getElementById('mealTypeGroup');

    if (measurementTypeSelect && mealTypeGroup) {
        currentMeasurementType = measurementTypeSelect.value;

        // Lisätään tapahtumankäsittelijä mittaustyypin valinnalle
        measurementTypeSelect.addEventListener('change', function() {
            currentMeasurementType = this.value;
            mealTypeGroup.style.display = this.value === 'Perus' ? 'none' : 'flex';

            updateMonthChart();
        });

        // Lisätään tapahtumankäsittelijä ateriatyypin valinnalle
        const mealTypeSelect = document.getElementById('mealType');
        if (mealTypeSelect) {
            currentMealType = mealTypeSelect.value;

            mealTypeSelect.addEventListener('change', function() {
                currentMealType = this.value;

                updateMonthChart();
            });
        }

        // Näytetään/piilotetaan ateriatyypin valinta mittaustyypin mukaan
        mealTypeGroup.style.display = measurementTypeSelect.value === 'Perus' ? 'none' : 'flex';

        // Valmistellaan kaaviokontaineri
        prepareChartContainer();

        // Alustetaan kalenterin muutoksien käsittely
        setupCalendarChangeListener();
    }
}

// Lisää Chart.js-kirjasto
function addChartJsLibrary() {
    if (document.getElementById('chart-js-lib')) return;

    const script = document.createElement('script');
    script.id = 'chart-js-lib';
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.async = true;
    script.onload = () => {
        console.log('Chart.js loaded successfully');
        initializeChart();
    };
    document.head.appendChild(script);
}

// Valmistelee kaavion kontainerin
function prepareChartContainer() {
    const chartPlaceholder = document.getElementById('chart-placeholder');
    if (!chartPlaceholder) return;

    chartPlaceholder.innerHTML = '';

    const canvas = document.createElement('canvas');
    canvas.id = 'glucose-chart';
    canvas.style.width = '100%';
    canvas.style.height = '250px';

    chartPlaceholder.appendChild(canvas);
}

// Alustaa kaavion Chart.js-kirjastolla
function initializeChart() {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }

    const chartCanvas = document.getElementById('glucose-chart');
    if (!chartCanvas) return;

    // Tuhoa aiempi kaavio jos sellainen on
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
                    borderColor: '#e64458',
                    backgroundColor: '#e64458',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 5,
                    pointHoverRadius: 8
                },
                {
                    label: 'Jälkeen',
                    data: [],
                    borderColor: '#39b3aa',
                    backgroundColor: '#39b3aa',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 5,
                    pointHoverRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: false,
                    grid: {
                        display: false
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
                        // Muotoile työkaluvihjeen otsikko
                        title: function(tooltipItems) {
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
                        // Muotoile työkaluvihjeen teksti
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw || '-'} mmol/l`;
                        }
                    }
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        pointStyleWidth: 10
                    }
                }
            }
        }
    });

    // Päivitä kaavio
    updateMonthChart();
}

// Asettaa kalenterin muutoksien kuuntelijat
function setupCalendarChangeListener() {
    const prevButton = document.getElementById('prevBtn');
    const nextButton = document.getElementById('nextBtn');

    // Päivitä kaavio kun siirrytään edelliseen kuukauteen
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            setTimeout(() => refreshChart(), 300);
        });
    }

    // Päivitä kaavio kun siirrytään seuraavaan kuukauteen
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            setTimeout(() => refreshChart(), 300);
        });
    }

    // Korvaa merkintöjen latausfunktio omalla versiolla, joka päivittää myös kaavion
    if (window.DiaBalance && window.DiaBalance.entries) {
        const originalLoadMonthEntries = window.DiaBalance.entries.loadMonthEntries;

        if (typeof originalLoadMonthEntries === 'function') {
            window.DiaBalance.entries.loadMonthEntries = async function(...args) {
                const result = await originalLoadMonthEntries.apply(this, args);

                refreshChart();

                return result;
            };
        }
    }

    // Korvaa kalenterinäkymän päivitysfunktio omalla versiolla, joka päivittää myös kaavion
    if (window.DiaBalance && window.DiaBalance.calendar) {
        const originalUpdateCalendarView = window.DiaBalance.calendar.updateCalendarView;

        if (typeof originalUpdateCalendarView === 'function') {
            window.DiaBalance.calendar.updateCalendarView = function(...args) {
                const result = originalUpdateCalendarView.apply(this, args);

                refreshChart();

                return result;
            };
        }
    }

    // Päivitä kaavio sivun latautumisen jälkeen
    window.addEventListener('load', () => {
        setTimeout(() => refreshChart(), 500);
    });
}

// Näyttää valitun päivämäärän tiedot
export function showDayData(dateStr) {
    console.log("Showing data for date:", dateStr);

    // Korostaa valitun päivän
    highlightSelectedDate(dateStr);

    // Hae merkinnät ja päivitä HRV-näkymä, jos HRV-dataa löytyy
    const entries = window.DiaBalance.entries.monthEntries || {};
    const entry = entries[dateStr];

    if (entry && entry.hrv_data) {
      console.log("Found HRV data for date, updating view:", dateStr, entry.hrv_data);
      updateHRVView(entry.hrv_data);
    } else {
      console.log("No HRV data for date, resetting view:", dateStr);
      updateHRVView(null);
    }

    // Päivitä kaavio
    updateMonthChart();
  }

// Korostaa valitun päivämäärän kaaviossa
function highlightSelectedDate(dateStr) {
    if (!glucoseChart) return;

    console.log("Selected date:", dateStr);
}

// Päivittää kuukauden verensokeridatan kaavioon
function updateMonthChart() {
    if (!glucoseChart) {
        initializeChart();
        return;
    }

    const entries = window.DiaBalance.entries.monthEntries || {};

    // Järjestä päivämäärät aikajärjestykseen
    const sortedDates = Object.keys(entries).sort();

    const chartData = {
        labels: [],
        beforeValues: [],
        afterValues: []
    };

    // Kerätään kaavion data merkinnöistä
    sortedDates.forEach(dateStr => {
        const entry = entries[dateStr];
        if (!entry) return;

        let beforeValue = null, afterValue = null;

        // Valitaan mittausarvot mittaustyypin ja ateriatyypin mukaan
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

        // Muunnetaan tekstiarvot numeroiksi
        beforeValue = beforeValue !== null && beforeValue !== '' ? parseFloat(beforeValue) : null;
        afterValue = afterValue !== null && afterValue !== '' ? parseFloat(afterValue) : null;

        chartData.labels.push(dateStr);
        chartData.beforeValues.push(beforeValue);
        chartData.afterValues.push(afterValue);
    });

    // Päivitä kaavion data
    glucoseChart.data.labels = chartData.labels;

    // Aseta oikeat selitteet mittaustyypin mukaan
    const beforeLabel = currentMeasurementType === 'Perus' ? 'Aamu' : 'Ennen';
    const afterLabel = currentMeasurementType === 'Perus' ? 'Ilta' : 'Jälkeen';

    glucoseChart.data.datasets[0].label = beforeLabel;
    glucoseChart.data.datasets[0].data = chartData.beforeValues;

    glucoseChart.data.datasets[1].label = afterLabel;
    glucoseChart.data.datasets[1].data = chartData.afterValues;

    // Aseta kaavion otsikko mittaustyypin mukaan
    let chartTitle = '';
    if (currentMeasurementType === 'Perus') {
        chartTitle = 'Perusseuranta: Aamu- ja ilta-arvot';
    } else {
        chartTitle = `Ateriaseuranta: ${currentMealType}`;
    }

    if (glucoseChart.options.plugins && glucoseChart.options.plugins.title) {
        glucoseChart.options.plugins.title.text = chartTitle;
    }

    // Päivitä kaavio
    glucoseChart.update();
}

// Näyttää tyhjän näkymän (käytetään esim. merkinnän poiston jälkeen)
export function showEmptyView(dateStr) {
    updateHRVView();

    updateMonthChart();
}

// Asettaa mittaustyypin (Perus/Ateriat)
export function setMeasurementType(type) {
    const measurementTypeSelect = document.getElementById('measurementType');
    if (measurementTypeSelect && (type === 'Perus' || type === 'Ateriat')) {
        measurementTypeSelect.value = type;
        currentMeasurementType = type;

        const mealTypeGroup = document.getElementById('mealTypeGroup');
        if (mealTypeGroup) {
            mealTypeGroup.style.display = type === 'Perus' ? 'none' : 'flex';
        }

        updateMonthChart();
    }
}

// Asettaa ateriatyypin
export function setMealType(type) {
    const mealTypeSelect = document.getElementById('mealType');
    const validTypes = ['Aamupala', 'Lounas', 'Välipala', 'Päivällinen', 'Iltapala'];

    if (mealTypeSelect && validTypes.includes(type)) {
        mealTypeSelect.value = type;
        currentMealType = type;

        updateMonthChart();
    }
}

// Palauttaa kaavion nykyiset asetukset
export function getCurrentChartSettings() {
    return {
        measurementType: currentMeasurementType,
        mealType: currentMealType
    };
}

// Päivittää kaavion nykyisen kuukauden tiedoilla
export function refreshChart() {
    console.log("Refreshing chart with current month data");
    updateMonthChart();
}