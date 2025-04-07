/**
 * chart-module.js
 * Verensokeriseurannan kaaviot ja visualisoinnit
 */

import { createDateFromString, formatLocalizedDate } from '../utils/date-utils.js';
import { createElement } from '../utils/ui-utils.js';
import { updateHRVView } from './hrv-module.js';

// Moduulin sisäiset muuttujat
let currentMeasurementType = 'Ateriat';
let currentMealType = 'Iltapala';

/**
 * Alustaa kaavionäkymän
 */
export function initializeChartView() {
    const measurementTypeSelect = document.getElementById('measurementType');
    const mealTypeGroup = document.getElementById('mealTypeGroup');

    if (measurementTypeSelect && mealTypeGroup) {
        // Aseta aloitusarvot nykyiseen tilaan
        currentMeasurementType = measurementTypeSelect.value;

        measurementTypeSelect.addEventListener('change', function() {
            currentMeasurementType = this.value;
            mealTypeGroup.style.display = this.value === 'Perus' ? 'none' : 'flex';

            // Päivitä aktiivisen päivän tiedot
            const activeDate = document.querySelector('.date.active');
            if (activeDate) {
                const dateStr = activeDate.getAttribute('data-date');
                showDayData(dateStr);
            }
        });

        const mealTypeSelect = document.getElementById('mealType');
        if (mealTypeSelect) {
            // Aseta aloitusarvo nykyiseen tilaan
            currentMealType = mealTypeSelect.value;

            mealTypeSelect.addEventListener('change', function() {
                currentMealType = this.value;

                // Päivitä aktiivisen päivän tiedot
                const activeDate = document.querySelector('.date.active');
                if (activeDate) {
                    const dateStr = activeDate.getAttribute('data-date');
                    showDayData(dateStr);
                }
            });
        }

        // Aseta näkyvyys valinnan mukaan
        mealTypeGroup.style.display = measurementTypeSelect.value === 'Perus' ? 'none' : 'flex';
    }
}

/**
 * Näyttää päivän tiedot
 * @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
 */
export function showDayData(dateStr) {
    console.log("Showing data for date:", dateStr);

    const entry = window.DiaBalance.entries.monthEntries[dateStr];

    if (!entry) {
        console.log("No entry found for date:", dateStr);
        showEmptyView(dateStr);
        return;
    }

    // HRV-näkymä näyttää aina vain placeholder-viivat
    updateHRVView();

    updateGlucoseView(entry);
}

/**
 * Näyttää tyhjän näkymän kun merkintää ei ole
 * @param {string} dateStr - Päivämäärä YYYY-MM-DD-muodossa
 */
export function showEmptyView(dateStr) {
    // Tyhjennä HRV-näkymä (näyttää aina vain viivat)
    updateHRVView();

    // Tyhjennä glukoosiarvojen näkymä
    const chartPlaceholder = document.getElementById('chart-placeholder');
    if (!chartPlaceholder) return;

    const formattedDate = formatLocalizedDate(dateStr, 'fi-FI', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    chartPlaceholder.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <p style="font-size: 16px; color: #666; margin-bottom: 10px;">
                Ei verensokeridataa päivälle ${formattedDate}
            </p>
            <p style="font-size: 14px; color: #888; font-style: italic;">
                Tuplaklikkaa päivää kalenterissa lisätäksesi merkinnän
            </p>
        </div>
    `;
}

/**
 * Päivittää glukoosinäkymän annetulla merkinnällä
 * @param {Object} entry - Merkinnän tiedot
 */
export function updateGlucoseView(entry) {
    const measurementType = currentMeasurementType;
    const mealType = currentMealType;

    const chartPlaceholder = document.getElementById('chart-placeholder');
    if (!chartPlaceholder) return;

    let beforeValue = null, afterValue = null, chartTitle = '';

    if (measurementType === 'Perus') {
        beforeValue = entry.morningValue;
        afterValue = entry.eveningValue;
        chartTitle = 'Perusseuranta: Aamu- ja ilta-arvot';
    } else {
        switch (mealType) {
            case 'Aamupala':
                beforeValue = entry.breakfastBefore; afterValue = entry.breakfastAfter;
                chartTitle = 'Aamupala'; break;
            case 'Lounas':
                beforeValue = entry.lunchBefore; afterValue = entry.lunchAfter;
                chartTitle = 'Lounas'; break;
            case 'Välipala':
                beforeValue = entry.snackBefore; afterValue = entry.snackAfter;
                chartTitle = 'Välipala'; break;
            case 'Päivällinen':
                beforeValue = entry.dinnerBefore; afterValue = entry.dinnerAfter;
                chartTitle = 'Päivällinen'; break;
            case 'Iltapala':
                beforeValue = entry.eveningSnackBefore; afterValue = entry.eveningSnackAfter;
                chartTitle = 'Iltapala'; break;
        }
        chartTitle = `Ateriaseuranta: ${chartTitle}`;
    }

    const hasBeforeValue = beforeValue && beforeValue !== '';
    const hasAfterValue = afterValue && afterValue !== '';

    if (!hasBeforeValue && !hasAfterValue) {
        chartPlaceholder.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="font-size: 16px; color: #666; margin-bottom: 10px;">
                    Ei verensokeridataa valitulle mittaustyypille
                </p>
                <p style="font-size: 14px; color: #888; font-style: italic;">
                    Valitse toinen mittaustyyppi tai ateria
                </p>
            </div>
        `;
        return;
    }

    // Tyhjennä container
    chartPlaceholder.innerHTML = '';

    // Aseta tyyliasetukset
    chartPlaceholder.style.backgroundColor = '#f9f9f9';
    chartPlaceholder.style.borderRadius = '5px';
    chartPlaceholder.style.padding = '10px';

    // Luo kaavio
    createGlucoseChart(chartPlaceholder, chartTitle, beforeValue, afterValue, measurementType);
}

/**
 * Luo verensokerikaavio
 * @param {HTMLElement} container - Container-elementti
 * @param {string} chartTitle - Kaavion otsikko
 * @param {number|string} beforeValue - Arvo ennen (aamu/ennen)
 * @param {number|string} afterValue - Arvo jälkeen (ilta/jälkeen)
 * @param {string} measurementType - Mittaustyyppi ('Perus'/'Ateriat')
 */
function createGlucoseChart(container, chartTitle, beforeValue, afterValue, measurementType) {
    // Luo otsikko
    const titleElement = createElement('div', {
        style: {
            textAlign: 'center',
            marginBottom: '10px',
            fontWeight: 'bold'
        }
    }, chartTitle);
    container.appendChild(titleElement);

    // Luo kaavion container
    const chartContainer = createElement('div', {
        style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            height: '180px',
            position: 'relative'
        }
    });

    const hasBeforeValue = beforeValue && beforeValue !== '';
    const hasAfterValue = afterValue && afterValue !== '';

    // Lisää pylväät
    if (hasBeforeValue) {
        const beforeLabel = measurementType === 'Perus' ? 'Aamu' : 'Ennen';
        chartContainer.appendChild(createBarElement(beforeValue, beforeLabel, '#ff5869'));
    }

    if (hasAfterValue) {
        const afterLabel = measurementType === 'Perus' ? 'Ilta' : 'Jälkeen';
        chartContainer.appendChild(createBarElement(afterValue, afterLabel, '#4ecdc4'));
    }

    container.appendChild(chartContainer);

    // Lisää selite
    const legendContainer = createElement('div', {
        style: {
            display: 'flex',
            justifyContent: 'center',
            marginTop: '15px',
            gap: '30px'
        }
    });

    if (hasBeforeValue) {
        const beforeLabel = measurementType === 'Perus' ? 'Aamu' : 'Ennen';
        addLegendItem(legendContainer, '#ff5869', beforeLabel);
    }

    if (hasAfterValue) {
        const afterLabel = measurementType === 'Perus' ? 'Ilta' : 'Jälkeen';
        addLegendItem(legendContainer, '#4ecdc4', afterLabel);
    }

    container.appendChild(legendContainer);
}

/**
 * Luo pylväselementti
 * @param {number|string} value - Pylvään arvo
 * @param {string} label - Arvoselite (esim. "Ennen")
 * @param {string} color - Pylvään väri
 * @returns {HTMLElement} - Luotu pylväselementti
 */
function createBarElement(value, label, color) {
    const container = createElement('div', {
        style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            margin: '0 20px'
        }
    });

    const valueElement = createElement('div', {
        style: {
            marginBottom: '5px',
            fontWeight: 'bold'
        }
    }, `${value} mmol/l`);

    const height = Math.min(parseFloat(value) * 15, 150);
    const bar = createElement('div', {
        style: {
            height: `${height}px`,
            width: '60px',
            backgroundColor: color,
            borderRadius: '5px'
        }
    });

    container.appendChild(valueElement);
    container.appendChild(bar);

    return container;
}

/**
 * Lisää selite-item
 * @param {HTMLElement} container - Container-elementti
 * @param {string} color - Selitteen väri
 * @param {string} label - Selitteen teksti
 */
function addLegendItem(container, color, label) {
    const legendItem = createElement('div', {
        style: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
        }
    });

    const colorDot = createElement('span', {
        style: {
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: color,
            display: 'inline-block'
        }
    });

    const labelText = createElement('span', {}, label);

    legendItem.appendChild(colorDot);
    legendItem.appendChild(labelText);
    container.appendChild(legendItem);
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
