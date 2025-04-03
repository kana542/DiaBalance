/**
 * DiaBalance Dashboard - Main functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    
    updateUserInfo();
    if (!window.dashboardInitialized) initializeDashboard();
});

function initializeDashboard() {
    if (window.dashboardInitialized) return;
    
    window.dashboardInitialized = true;
    initializeCalendar();
    initializeChartView();
    setupInfoButtons();
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('Kirjauduttu ulos onnistuneesti.');
    window.location.href = '../../index.html';
}

function updateUserInfo() {
    try {
        const userString = localStorage.getItem('user');
        if (userString) {
            const user = JSON.parse(userString);
            const usernameElement = document.getElementById('username');
            if (usernameElement && user.username) {
                usernameElement.textContent = user.username;
            }
        }
    } catch (error) {
        console.error('Error updating user info:', error);
    }
}

function initializeCalendar() {
    const monthYearElement = document.getElementById("monthYear");
    const datesElement = document.getElementById("dates");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (!monthYearElement || !datesElement || !prevBtn || !nextBtn) return;

    let currentDate = new Date();

    const updateCalendar = async () => {
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();

        let firstDayIndex = firstDay.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6;

        let lastDayIndex = lastDay.getDay() - 1;
        if (lastDayIndex === -1) lastDayIndex = 6;

        monthYearElement.textContent = currentDate.toLocaleString("fi-FI", {
            month: "long",
            year: "numeric",
        });

        const savedEntries = getSavedEntries();
        const entriesMap = new Map();
        
        Object.keys(savedEntries).forEach(dateStr => {
            const entryDate = new Date(dateStr);
            if (entryDate.getMonth() === currentMonth && 
                entryDate.getFullYear() === currentYear) {
                entriesMap.set(entryDate.getDate(), {
                    isComplete: checkIfEntryIsComplete(savedEntries[dateStr])
                });
            }
        });

        let datesHTML = "";

        // Previous month's days
        for (let i = firstDayIndex; i > 0; i--) {
            const prevDate = new Date(currentYear, currentMonth, 0 - i + 1);
            datesHTML += `<div class="date inactive">${prevDate.getDate()}</div>`;
        }

        // Current month's days
        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const today = new Date();
            const isToday = date.getDate() === today.getDate() &&
                           date.getMonth() === today.getMonth() &&
                           date.getFullYear() === today.getFullYear();
            const hasEntry = entriesMap.has(i);
            const entryClass = hasEntry ? 
                (entriesMap.get(i).isComplete ? 'has-complete-entry' : 'has-partial-entry') : '';
            const activeClass = isToday ? "active" : "";

            datesHTML += `<div class="date ${activeClass} ${entryClass}" data-date="${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}">${i}</div>`;
        }

        // Next month's days
        for (let i = 1; i <= 7 - lastDayIndex - 1; i++) {
            const nextDate = new Date(currentYear, currentMonth + 1, i);
            datesHTML += `<div class="date inactive">${nextDate.getDate()}</div>`;
        }

        datesElement.innerHTML = datesHTML;
        setupDateClickHandlers();
    };

    prevBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        updateCalendar();
    });

    nextBtn.addEventListener("click", () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        updateCalendar();
    });
    
    updateCalendar();
}

function setupDateClickHandlers() {
    document.querySelectorAll('.date:not(.inactive)').forEach(dateElement => {
        dateElement.addEventListener('click', (e) => {
            document.querySelectorAll('.date').forEach(el => {
                el.classList.remove('active');
            });
            dateElement.classList.add('active');
            loadDayData(dateElement.getAttribute('data-date'));
        });
        
        dateElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            openEntryModal(dateElement.getAttribute('data-date'));
        });
    });
}

function initializeChartView() {
    const measurementTypeSelect = document.getElementById('measurementType');
    const mealTypeGroup = document.getElementById('mealTypeGroup');

    if (measurementTypeSelect && mealTypeGroup) {
        measurementTypeSelect.addEventListener('change', function() {
            mealTypeGroup.style.display = this.value === 'Perus' ? 'none' : 'flex';
            updateActiveDay();
        });
        
        const mealTypeSelect = document.getElementById('mealType');
        if (mealTypeSelect) {
            mealTypeSelect.addEventListener('change', updateActiveDay);
        }

        mealTypeGroup.style.display = measurementTypeSelect.value === 'Perus' ? 'none' : 'flex';
    }
}

function updateActiveDay() {
    const activeDay = document.querySelector('.date.active');
    if (activeDay) {
        const dateString = activeDay.getAttribute('data-date');
        if (dateString) loadDayData(dateString);
    }
}

function setupInfoButtons() {
    const infoContent = {
        calendar: {
            title: "Kalenterin käyttö",
            content: "Kalenteri näyttää kaikki kuukauden päivät. Punaisella merkityt päivät sisältävät valmiit merkinnät, oranssilla merkityt osittaiset merkinnät. Klikkaa päivämäärää nähdäksesi sen päivän tiedot. Tuplaklikkaa päivämäärää lisätäksesi tai muokataksesi merkintää."
        },
        bloodSugar: {
            title: "Verensokeriseuranta",
            content: "Tämä osio näyttää verensokeriarvosi valitulta päivältä. Voit tarkastella perusseurannan arvoja (aamu- ja ilta-arvot) tai ateriakohtaisia arvoja (ennen ja jälkeen)."
        },
        chart: {
            title: "Kaaviotieto",
            content: "Kaavio näyttää verensokeriarvojen kehityksen kuukauden ajalta. Voit valita näytettäväksi perusseurannan tai ateriakohtaiset arvot. Punaiset pisteet ovat mittauksia ennen ateriaa, turkoosin väriset mittauksia aterian jälkeen."
        },
        hrv: {
            title: "HRV-analyysi",
            content: "Tämä osio näyttää ladatun HRV-datan analyysin tulokset: palautumisen, stressin, keskisykkeen ja fysiologisen iän. Lataa HRV-data päiväkirjamerkinnän kautta."
        }
    };
    
    const infoButtons = {
        calendar: document.getElementById('calendarInfoBtn'),
        bloodSugar: document.getElementById('bloodSugarInfoBtn'),
        chart: document.getElementById('chartInfoBtn'),
        hrv: document.getElementById('hrvInfoBtn')
    };
    
    for (const [key, button] of Object.entries(infoButtons)) {
        if (button) {
            button.addEventListener('click', () => {
                const info = infoContent[key];
                alert(`${info.title}\n\n${info.content}`);
            });
        }
    }
}

function loadDayData(dateString) {
    const entriesData = localStorage.getItem('diabalance_entries');
    
    if (!entriesData) {
        showEmptyView(dateString);
        return;
    }
    
    try {
        const entries = JSON.parse(entriesData);
        const entry = entries[dateString];
        
        if (!entry) {
            showEmptyView(dateString);
            return;
        }
        
        if (entry.hasHrvData) {
            updateHRVView(entry.hrvData || getMockHRVData(dateString));
        } else {
            updateHRVView(null);
        }
        
        updateGlucoseView(entry);
        
    } catch (error) {
        console.error("Virhe datan käsittelyssä:", error);
        showEmptyView(dateString);
    }
}

function showEmptyView(dateString) {
    updateHRVView(null);
    
    const chartPlaceholder = document.getElementById('chart-placeholder');
    if (chartPlaceholder) {
        chartPlaceholder.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <p style="font-size: 16px; color: #666; margin-bottom: 10px;">
                    Ei verensokeridataa päivälle ${dateString}
                </p>
                <p style="font-size: 14px; color: #888; font-style: italic;">
                    Tuplaklikkaa päivää kalenterissa lisätäksesi merkinnän
                </p>
            </div>
        `;
    }
}

function updateHRVView(hrvData) {
    const elements = {
        readiness: document.querySelector('.metric-card:nth-child(1) .metric-value'),
        stress: document.querySelector('.metric-card:nth-child(2) .metric-value'),
        heartRate: document.querySelector('.metric-card:nth-child(3) .metric-value'),
        age: document.querySelector('.metric-card:nth-child(4) .metric-value')
    };
    
    if (!hrvData) {
        Object.values(elements).forEach(el => { if (el) el.textContent = '–'; });
        return;
    }
    
    if (elements.readiness) elements.readiness.textContent = hrvData.readiness;
    if (elements.stress) elements.stress.textContent = hrvData.stress;
    if (elements.heartRate) elements.heartRate.textContent = hrvData.heartRate;
    if (elements.age) elements.age.textContent = hrvData.physiologicalAge;
}

function updateGlucoseView(entry) {
    const measurementType = document.getElementById('measurementType').value;
    const mealType = document.getElementById('mealType').value;
    
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
    
    chartPlaceholder.innerHTML = '';
    chartPlaceholder.style.backgroundColor = '#f9f9f9';
    chartPlaceholder.style.borderRadius = '5px';
    chartPlaceholder.style.padding = '10px';
    
    const titleElement = document.createElement('div');
    titleElement.textContent = chartTitle;
    titleElement.style.textAlign = 'center';
    titleElement.style.marginBottom = '10px';
    titleElement.style.fontWeight = 'bold';
    chartPlaceholder.appendChild(titleElement);
    
    const chartContainer = document.createElement('div');
    chartContainer.style.display = 'flex';
    chartContainer.style.justifyContent = 'center';
    chartContainer.style.alignItems = 'flex-end';
    chartContainer.style.height = '180px';
    chartContainer.style.position = 'relative';
    
    if (hasBeforeValue) {
        const beforeLabel = measurementType === 'Perus' ? 'Aamu' : 'Ennen';
        chartContainer.appendChild(createBarElement(beforeValue, beforeLabel, '#ff5869'));
    }
    
    if (hasAfterValue) {
        const afterLabel = measurementType === 'Perus' ? 'Ilta' : 'Jälkeen';
        chartContainer.appendChild(createBarElement(afterValue, afterLabel, '#4ecdc4'));
    }
    
    chartPlaceholder.appendChild(chartContainer);
    
    const legendContainer = document.createElement('div');
    legendContainer.style.display = 'flex';
    legendContainer.style.justifyContent = 'center';
    legendContainer.style.marginTop = '15px';
    legendContainer.style.gap = '30px';
    
    if (hasBeforeValue) {
        const beforeLabel = measurementType === 'Perus' ? 'Aamu' : 'Ennen';
        addLegendItem(legendContainer, '#ff5869', beforeLabel);
    }
    
    if (hasAfterValue) {
        const afterLabel = measurementType === 'Perus' ? 'Ilta' : 'Jälkeen';
        addLegendItem(legendContainer, '#4ecdc4', afterLabel);
    }
    
    chartPlaceholder.appendChild(legendContainer);
}

function createBarElement(value, label, color) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.margin = '0 20px';
    
    const valueElement = document.createElement('div');
    valueElement.textContent = `${value} mmol/l`;
    valueElement.style.marginBottom = '5px';
    valueElement.style.fontWeight = 'bold';
    
    const bar = document.createElement('div');
    const height = Math.min(parseFloat(value) * 15, 150);
    bar.style.height = `${height}px`;
    bar.style.width = '60px';
    bar.style.backgroundColor = color;
    bar.style.borderRadius = '5px';
    
    container.appendChild(valueElement);
    container.appendChild(bar);
    
    return container;
}

function addLegendItem(container, color, label) {
    const legendItem = document.createElement('div');
    legendItem.style.display = 'flex';
    legendItem.style.alignItems = 'center';
    legendItem.style.gap = '5px';
    
    const colorDot = document.createElement('span');
    colorDot.style.width = '12px';
    colorDot.style.height = '12px';
    colorDot.style.borderRadius = '50%';
    colorDot.style.backgroundColor = color;
    colorDot.style.display = 'inline-block';
    
    const labelText = document.createElement('span');
    labelText.textContent = label;
    
    legendItem.appendChild(colorDot);
    legendItem.appendChild(labelText);
    container.appendChild(legendItem);
}

function openEntryModal(dateString) {
    const modal = document.getElementById('entryModal');
    if (!modal) {
        alert('Merkinnän lisäys/muokkaus ei ole käytettävissä.');
        return;
    }
    
    modal.setAttribute('data-date', dateString);
    
    const modalTitle = modal.querySelector('.modal-title');
    if (modalTitle) {
        const formattedDate = new Date(dateString).toLocaleDateString('fi-FI', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        modalTitle.textContent = `Merkintä: ${formattedDate}`;
    }
    
    const entryForm = document.getElementById('entryForm');
    if (entryForm) entryForm.reset();
    
    const savedEntries = getSavedEntries();
    const entry = savedEntries[dateString];
    
    if (entry) {
        populateEntryForm(entry);
    } else {
        resetHrvStatus();
    }
    
    setupModalEvents();
    modal.style.display = 'block';
}

function setupModalEvents() {
    const modal = document.getElementById('entryModal');
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = document.getElementById('cancelButton');
    const saveBtn = document.getElementById('saveButton');
    const uploadHrvBtn = document.getElementById('uploadHrvButton');
    const deleteHrvBtn = document.getElementById('deleteHrvButton');
    
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
    if (cancelBtn) cancelBtn.onclick = () => modal.style.display = 'none';
    
    window.onclick = function(event) {
        if (event.target === modal) modal.style.display = 'none';
    };
    
    if (saveBtn) {
        saveBtn.onclick = function() {
            saveEntryData(modal.getAttribute('data-date'));
        };
    }
    
    if (uploadHrvBtn) {
        uploadHrvBtn.onclick = function() {
            const fileInput = document.getElementById('hrvDataFile');
            if (fileInput && fileInput.files.length > 0) {
                uploadHRVData(fileInput.files[0]);
            } else {
                alert('Valitse ensin tiedosto.');
            }
        };
    }
    
    if (deleteHrvBtn) {
        deleteHrvBtn.onclick = function() {
            if (confirm('Haluatko varmasti poistaa HRV-datan?')) {
                deleteHRVData();
            }
        };
    }
}

function populateEntryForm(entryData) {
    if (!entryData) {
        resetHrvStatus();
        return;
    }
    
    // Perusseuranta
    setInputValue('morningValue', entryData.morningValue);
    setInputValue('eveningValue', entryData.eveningValue);
    
    // Ateriat
    const mealFields = {
        'breakfast': ['breakfastBefore', 'breakfastAfter'],
        'lunch': ['lunchBefore', 'lunchAfter'],
        'snack': ['snackBefore', 'snackAfter'],
        'dinner': ['dinnerBefore', 'dinnerAfter'],
        'eveningSnack': ['eveningSnackBefore', 'eveningSnackAfter']
    };
    
    for (const [meal, fields] of Object.entries(mealFields)) {
        for (const field of fields) {
            setInputValue(field, entryData[field]);
        }
    }
    
    // Oireet
    if (entryData.symptoms && Array.isArray(entryData.symptoms)) {
        entryData.symptoms.forEach(symptom => {
            const checkbox = document.querySelector(`input[name="symptoms"][value="${symptom}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    
    // Kommentti
    setInputValue('comment', entryData.comment);
    
    // HRV
    updateHrvStatus(entryData.hasHrvData);
}

function setInputValue(id, value) {
    const input = document.getElementById(id);
    if (input && value) input.value = value;
}

function updateHrvStatus(hasHrvData) {
    const hrvStatusMessage = document.getElementById('hrvStatusMessage');
    const deleteHrvButton = document.getElementById('deleteHrvButton');
    
    if (hasHrvData) {
        if (hrvStatusMessage) {
            hrvStatusMessage.textContent = 'HRV-data ladattu onnistuneesti.';
            hrvStatusMessage.style.color = 'green';
        }
        
        if (deleteHrvButton) {
            deleteHrvButton.style.display = 'inline-block';
        }
    } else {
        resetHrvStatus();
    }
}

function resetHrvStatus() {
    const hrvStatusMessage = document.getElementById('hrvStatusMessage');
    const deleteHrvButton = document.getElementById('deleteHrvButton');
    
    if (hrvStatusMessage) {
        hrvStatusMessage.textContent = 'HRV-dataa ei ole ladattu.';
        hrvStatusMessage.style.color = 'gray';
    }
    
    if (deleteHrvButton) {
        deleteHrvButton.style.display = 'none';
    }
}

function saveEntryData(dateString) {
    const form = document.getElementById('entryForm');
    if (!form) return;
    
    const formData = new FormData(form);
    const entryData = {};
    
    // Perusseuranta
    entryData.morningValue = formData.get('morningValue');
    entryData.eveningValue = formData.get('eveningValue');
    
    // Ateriat
    entryData.breakfastBefore = formData.get('breakfastBefore');
    entryData.breakfastAfter = formData.get('breakfastAfter');
    entryData.lunchBefore = formData.get('lunchBefore');
    entryData.lunchAfter = formData.get('lunchAfter');
    entryData.snackBefore = formData.get('snackBefore');
    entryData.snackAfter = formData.get('snackAfter');
    entryData.dinnerBefore = formData.get('dinnerBefore');
    entryData.dinnerAfter = formData.get('dinnerAfter');
    entryData.eveningSnackBefore = formData.get('eveningSnackBefore');
    entryData.eveningSnackAfter = formData.get('eveningSnackAfter');
    
    // Oireet
    const symptoms = [];
    document.querySelectorAll('input[name="symptoms"]:checked').forEach(checkbox => {
        symptoms.push(checkbox.value);
    });
    entryData.symptoms = symptoms;
    
    // Kommentti
    entryData.comment = formData.get('comment');
    
    // HRV-data status
    const savedEntries = getSavedEntries();
    const existingEntry = savedEntries[dateString];
    
    entryData.hasHrvData = existingEntry && existingEntry.hasHrvData ? true : false;
    if (entryData.hasHrvData) entryData.hrvData = existingEntry.hrvData;
    
    // Tallenna
    savedEntries[dateString] = entryData;
    localStorage.setItem('diabalance_entries', JSON.stringify(savedEntries));
    
    // Päivitykset ja ilmoitus
    alert(`Merkintä päivälle ${dateString} tallennettu onnistuneesti.`);
    document.getElementById('entryModal').style.display = 'none';
    initializeCalendar();
    loadDayData(dateString);
}

function uploadHRVData(file) {
    const modal = document.getElementById('entryModal');
    const dateString = modal.getAttribute('data-date');
    
    const savedEntries = getSavedEntries();
    const entry = savedEntries[dateString] || {};
    
    entry.hasHrvData = true;
    entry.hrvData = getMockHRVData(dateString);
    
    savedEntries[dateString] = entry;
    localStorage.setItem('diabalance_entries', JSON.stringify(savedEntries));
    
    updateHrvStatus(true);
    initializeCalendar();
    
    alert('HRV-data ladattu onnistuneesti.');
}

function deleteHRVData() {
    const modal = document.getElementById('entryModal');
    const dateString = modal.getAttribute('data-date');
    
    const savedEntries = getSavedEntries();
    
    if (savedEntries[dateString]) {
        savedEntries[dateString].hasHrvData = false;
        delete savedEntries[dateString].hrvData;
        
        localStorage.setItem('diabalance_entries', JSON.stringify(savedEntries));
        resetHrvStatus();
        initializeCalendar();
        
        alert('HRV-data poistettu onnistuneesti.');
    }
}

function getSavedEntries() {
    const entriesString = localStorage.getItem('diabalance_entries');
    return entriesString ? JSON.parse(entriesString) : {};
}

function checkIfEntryIsComplete(entry) {
    if (!entry) return false;
    
    const requiredFields = [
        'morningValue', 'eveningValue', 
        'breakfastBefore', 'breakfastAfter',
        'lunchBefore', 'lunchAfter',
        'snackBefore', 'snackAfter',
        'dinnerBefore', 'dinnerAfter',
        'eveningSnackBefore', 'eveningSnackAfter'
    ];
    
    for (const field of requiredFields) {
        if (!entry[field] || entry[field] === '' || entry[field] === null || entry[field] === undefined) {
            return false;
        }
    }
    
    return true;
}

function getMockHRVData(dateString) {
    const dateSeed = new Date(dateString).getDate();
    
    return {
        readiness: Math.floor(40 + (dateSeed % 60)),
        stress: (4 + (dateSeed % 7)).toFixed(1),
        heartRate: Math.floor(50 + (dateSeed % 20)),
        physiologicalAge: (20 + (dateSeed % 10)).toFixed(1)
    };
}

// Näitä funktioita ei käytetä, mutta valmisteltu tulevaa varten
function initializeBloodGlucoseView() {}
function initializeHrvAnalysis() {}