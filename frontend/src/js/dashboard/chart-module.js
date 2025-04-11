import { formatLocalizedDate } from '../utils/date-utils.js';
import { updateHRVView } from './hrv-module.js';

let currentMeasurementType = 'Ateriat';
let currentMealType = 'Iltapala';
let glucoseChart = null;

export function initializeChartView() {
    addChartJsLibrary();

    const measurementTypeSelect = document.getElementById('measurementType');
    const mealTypeGroup = document.getElementById('mealTypeGroup');

    if (measurementTypeSelect && mealTypeGroup) {
        currentMeasurementType = measurementTypeSelect.value;

        measurementTypeSelect.addEventListener('change', function() {
            currentMeasurementType = this.value;
            mealTypeGroup.style.display = this.value === 'Perus' ? 'none' : 'flex';

            updateMonthChart();
        });

        const mealTypeSelect = document.getElementById('mealType');
        if (mealTypeSelect) {
            currentMealType = mealTypeSelect.value;

            mealTypeSelect.addEventListener('change', function() {
                currentMealType = this.value;

                updateMonthChart();
            });
        }

        mealTypeGroup.style.display = measurementTypeSelect.value === 'Perus' ? 'none' : 'flex';

        prepareChartContainer();

        setupCalendarChangeListener();
    }
}

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

function initializeChart() {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded');
        return;
    }

    const chartCanvas = document.getElementById('glucose-chart');
    if (!chartCanvas) return;

    if (glucoseChart) {
        glucoseChart.destroy();
    }

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

    updateMonthChart();
}

function setupCalendarChangeListener() {
    const prevButton = document.getElementById('prevBtn');
    const nextButton = document.getElementById('nextBtn');

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            setTimeout(() => refreshChart(), 300);
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            setTimeout(() => refreshChart(), 300);
        });
    }

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

    window.addEventListener('load', () => {
        setTimeout(() => refreshChart(), 500);
    });
}

export function showDayData(dateStr) {
    console.log("Showing data for date:", dateStr);

    highlightSelectedDate(dateStr);

    const entries = window.DiaBalance.entries.monthEntries || {};
    const entry = entries[dateStr];

    if (entry && entry.hrv_data) {
      console.log("Found HRV data for date, updating view:", dateStr, entry.hrv_data);
      updateHRVView(entry.hrv_data);
    } else {
      console.log("No HRV data for date, resetting view:", dateStr);
      updateHRVView(null);
    }

    updateMonthChart();
  }

function highlightSelectedDate(dateStr) {
    if (!glucoseChart) return;

    console.log("Selected date:", dateStr);
}

function updateMonthChart() {
    if (!glucoseChart) {
        initializeChart();
        return;
    }

    const entries = window.DiaBalance.entries.monthEntries || {};

    const sortedDates = Object.keys(entries).sort();

    const chartData = {
        labels: [],
        beforeValues: [],
        afterValues: []
    };

    sortedDates.forEach(dateStr => {
        const entry = entries[dateStr];
        if (!entry) return;

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

        beforeValue = beforeValue !== null && beforeValue !== '' ? parseFloat(beforeValue) : null;
        afterValue = afterValue !== null && afterValue !== '' ? parseFloat(afterValue) : null;

        chartData.labels.push(dateStr);
        chartData.beforeValues.push(beforeValue);
        chartData.afterValues.push(afterValue);
    });

    glucoseChart.data.labels = chartData.labels;

    const beforeLabel = currentMeasurementType === 'Perus' ? 'Aamu' : 'Ennen';
    const afterLabel = currentMeasurementType === 'Perus' ? 'Ilta' : 'Jälkeen';

    glucoseChart.data.datasets[0].label = beforeLabel;
    glucoseChart.data.datasets[0].data = chartData.beforeValues;

    glucoseChart.data.datasets[1].label = afterLabel;
    glucoseChart.data.datasets[1].data = chartData.afterValues;

    let chartTitle = '';
    if (currentMeasurementType === 'Perus') {
        chartTitle = 'Perusseuranta: Aamu- ja ilta-arvot';
    } else {
        chartTitle = `Ateriaseuranta: ${currentMealType}`;
    }

    if (glucoseChart.options.plugins && glucoseChart.options.plugins.title) {
        glucoseChart.options.plugins.title.text = chartTitle;
    }

    glucoseChart.update();
}

export function showEmptyView(dateStr) {
    updateHRVView();

    updateMonthChart();
}

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

export function setMealType(type) {
    const mealTypeSelect = document.getElementById('mealType');
    const validTypes = ['Aamupala', 'Lounas', 'Välipala', 'Päivällinen', 'Iltapala'];

    if (mealTypeSelect && validTypes.includes(type)) {
        mealTypeSelect.value = type;
        currentMealType = type;

        updateMonthChart();
    }
}

export function getCurrentChartSettings() {
    return {
        measurementType: currentMeasurementType,
        mealType: currentMealType
    };
}

export function refreshChart() {
    console.log("Refreshing chart with current month data");
    updateMonthChart();
}
