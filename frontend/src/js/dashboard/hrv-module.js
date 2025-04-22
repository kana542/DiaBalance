export function initializeHRVModule() {
  console.log('HRV module initialized');

  resetHRVValues();
}

export function updateHRVView(hrvData) {
  if (!hrvData) {
    resetHRVValues();
    return;
  }

  console.log('Updating HRV view with data:', hrvData);

  const elements = {
    readiness: document.querySelector('.metrics-container .metric-value:not(.stress):not(.heart-rate):not(.sdnn)'),
    stress: document.querySelector('.metrics-container .metric-value.stress'),
    heartRate: document.querySelector('.metrics-container .metric-value.heart-rate'),
    sdnn: document.querySelector('.metrics-container .metric-value.sdnn')
  };

  console.log('HRV elements found:', {
    readiness: elements.readiness?.textContent,
    stress: elements.stress?.textContent,
    heartRate: elements.heartRate?.textContent,
    sdnn: elements.sdnn?.textContent
  });

  if (elements.readiness) {
    if (hrvData.readiness !== null && hrvData.readiness !== undefined) {
      elements.readiness.textContent = typeof hrvData.readiness === 'number' ?
        hrvData.readiness.toFixed(1) : hrvData.readiness;
    } else if (hrvData.valmiusaste !== null && hrvData.valmiusaste !== undefined) {
      elements.readiness.textContent = typeof hrvData.valmiusaste === 'number' ?
        hrvData.valmiusaste.toFixed(1) : hrvData.valmiusaste;
    }
  }

  if (elements.stress) {
    if (hrvData.stress !== null && hrvData.stress !== undefined) {
      elements.stress.textContent = typeof hrvData.stress === 'number' ?
        hrvData.stress.toFixed(1) : hrvData.stress;
    } else if (hrvData.stress_index !== null && hrvData.stress_index !== undefined) {
      elements.stress.textContent = typeof hrvData.stress_index === 'number' ?
        hrvData.stress_index.toFixed(1) : hrvData.stress_index;
    } else if (hrvData.stressi_indeksi !== null && hrvData.stressi_indeksi !== undefined) {
      elements.stress.textContent = typeof hrvData.stressi_indeksi === 'number' ?
        hrvData.stressi_indeksi.toFixed(1) : hrvData.stressi_indeksi;
    }
  }

  if (elements.heartRate) {
    if (hrvData.bpm !== null && hrvData.bpm !== undefined) {
      elements.heartRate.textContent = typeof hrvData.bpm === 'number' ?
        Math.round(hrvData.bpm) : hrvData.bpm;
    } else if (hrvData.mean_hr_bpm !== null && hrvData.mean_hr_bpm !== undefined) {
      elements.heartRate.textContent = Math.round(hrvData.mean_hr_bpm);
    } else if (hrvData.syke !== null && hrvData.syke !== undefined) {
      elements.heartRate.textContent = typeof hrvData.syke === 'number' ?
        Math.round(hrvData.syke) : hrvData.syke;
    }
  }

  if (elements.sdnn) {
    if (hrvData.sdnn_ms !== null && hrvData.sdnn_ms !== undefined) {
      elements.sdnn.textContent = typeof hrvData.sdnn_ms === 'number' ?
        hrvData.sdnn_ms.toFixed(1) : hrvData.sdnn_ms;
    } else if (hrvData.sdnnMs !== null && hrvData.sdnnMs !== undefined) {
      elements.sdnn.textContent = typeof hrvData.sdnnMs === 'number' ?
        hrvData.sdnnMs.toFixed(1) : hrvData.sdnnMs;
    }
  }
}

export async function fetchHrvDataFromDatabase(dateStr) {
  console.log(`Fetching HRV data from database for date ${dateStr}`);
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
      console.log('User not logged in');
      return null;
    }

    const entries = window.DiaBalance.entries.monthEntries || {};
    const entry = entries[dateStr];

    if (entry && entry.hrv_data) {
      console.log('HRV data found from local cache for date:', dateStr);
      return entry.hrv_data;
    }

    resetHRVValues();
    return null;
  } catch (error) {
    console.error('Error fetching HRV data from database:', error);
    resetHRVValues();
    return null;
  }
}


export async function fetchAndSaveHrvDataForDay(dateStr) {
  console.log(`Fetching HRV data for date ${dateStr}`);
  try {
    // Haetaan käyttäjän ID ja token
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
      return {
        success: false,
        message: 'Käyttäjä ei ole kirjautunut sisään'
      };
    }

    console.log('Sending request to Kubios API through our backend...');

    const response = await fetch(`http://localhost:3000/api/kubios/user-data/${dateStr}?noSave=true`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}`);
      return {
        success: false,
        message: 'HRV-datan hakeminen epäonnistui'
      };
    }

    const data = await response.json();
    console.log('HRV data fetched successfully:', data);

    const hrvData = data.data || [];

    // Check if we actually have HRV data
    if (hrvData.length === 0) {
      return {
        success: false,
        message: 'HRV-dataa ei löytynyt valitulle päivälle'
      };
    }

// Check if we actually have HRV data
if (hrvData.length === 0) {
  return {
    success: false,
    message: 'HRV-dataa ei löytynyt valitulle päivälle'
  };
}

const apiResponse = hrvData[0];

const hrvDisplay = {
  readiness: parseFloat(apiResponse.readiness) || 50, // Default value if missing
  stress_index: parseFloat(apiResponse.stress_index) || parseFloat(apiResponse.stress) || 10,
  mean_hr_bpm: parseInt(apiResponse.mean_hr_bpm) || parseInt(apiResponse.bpm) || 70,
  sdnn_ms: parseFloat(apiResponse.sdnn_ms) || parseFloat(apiResponse.sdnnMs) || 50,
  _rawData: apiResponse // Keep original data
};

    console.log('Transformed HRV data for UI:', hrvDisplay);

    updateHRVView(hrvDisplay);

    const entries = window.DiaBalance.entries.monthEntries || {};
if (entries[dateStr]) {
  entries[dateStr].hrv_data = hrvDisplay;
} else {
  entries[dateStr] = {
    morningValue: null,
    eveningValue: null,
    breakfastBefore: null,
    breakfastAfter: null,
    lunchBefore: null,
    lunchAfter: null,
    snackBefore: null,
    snackAfter: null,
    dinnerBefore: null,
    dinnerAfter: null,
    eveningSnackBefore: null,
    eveningSnackAfter: null,
    symptoms: [],
    comment: "HRV-datamerkintä",
    hrv_data: hrvDisplay
  };

  window.DiaBalance.entries.monthEntries = entries;
}

    return {
      success: true,
      message: 'HRV-data haettu onnistuneesti (ei vielä tallennettu)'
    };
  } catch (error) {
    console.error('Error in fetchAndSaveHrvDataForDay:', error);
    return {
      success: false,
      message: 'Virhe HRV-datan hakemisessa: ' + error.message
    };
  }
}

export async function saveHrvDataToDatabase(dateStr, hrvData) {
  console.log(`Saving HRV data to database for date ${dateStr}`);
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      return {
        success: false,
        message: 'Käyttäjä ei ole kirjautunut sisään'
      };
    }

    try {
      const emptyEntry = {
        pvm: dateStr,
        oireet: 'Ei oireita',
        kommentti: 'Automaattinen kirjaus HRV-dataa varten'
      };

      // Luo tai päivitä perusmerkintä
      const entryResponse = await fetch('http://localhost:3000/api/entries', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emptyEntry)
      });

      if (!entryResponse.ok) {
        console.warn('Warning: Failed to ensure basic entry exists:', await entryResponse.text());
      } else {
        console.log('Basic entry created/updated successfully');
      }
    } catch (entryError) {
      console.error('Error ensuring basic entry exists:', entryError);
    }

    const rawData = hrvData._rawData || hrvData;
    const hrvToSave = {
      readiness: rawData.readiness,
      stress_index: rawData.stress_index,
      mean_hr_bpm: rawData.mean_hr_bpm,
      sdnn_ms: rawData.sdnn_ms
    };

    const response = await fetch(`http://localhost:3000/api/kubios/user-data/${dateStr}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(hrvToSave)
    });

    if (!response.ok) {
      console.error(`API request failed with status ${response.status}`);
      return {
        success: false,
        message: 'HRV-datan tallentaminen epäonnistui'
      };
    }

    const result = await response.json();
    console.log('HRV data save result:', result);

    return {
      success: true,
      message: 'HRV-data tallennettu onnistuneesti'
    };
  } catch (error) {
    console.error('Error in saveHrvDataToDatabase:', error);
    return {
      success: false,
      message: 'Virhe HRV-datan tallentamisessa: ' + error.message
    };
  }
}

function resetHRVValues() {
  const elements = {
    readiness: document.querySelector('.metrics-container .metric-value:not(.stress):not(.heart-rate):not(.sdnn)'),
    stress: document.querySelector('.metrics-container .metric-value.stress'),
    heartRate: document.querySelector('.metrics-container .metric-value.heart-rate'),
    sdnn: document.querySelector('.metrics-container .metric-value.sdnn')
  };

  // Debug: tarkista että elementit löytyvät
  console.log('HRV reset elements found:', {
    readiness: !!elements.readiness,
    stress: !!elements.stress,
    heartRate: !!elements.heartRate,
    sdnn: !!elements.sdnn
  });

  // Aseta viivat kaikkiin elementteihin
  Object.values(elements).forEach(el => {
    if (el) el.textContent = '–';
  });
}
