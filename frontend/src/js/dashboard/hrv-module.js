// Alustaa HRV-moduulin
export function initializeHRVModule() {
  console.log('HRV module initialized');

  // Nollaa mittausarvot alussa
  resetHRVValues();
}

// Päivittää HRV-mittausnäkymän datan perusteella
export function updateHRVView(hrvData) {
  if (!hrvData) {
    resetHRVValues();
    return;
  }

  console.log('Updating HRV view with data:', hrvData);

  // Haetaan tarvittavat elementit mittausarvojen näyttämiseen
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

  // Päivitetään palautumisarvo (readiness)
  if (elements.readiness) {
    if (hrvData.readiness !== null && hrvData.readiness !== undefined) {
      elements.readiness.textContent = typeof hrvData.readiness === 'number' ?
        hrvData.readiness.toFixed(1) : hrvData.readiness;
    } else if (hrvData.valmiusaste !== null && hrvData.valmiusaste !== undefined) {
      elements.readiness.textContent = typeof hrvData.valmiusaste === 'number' ?
        hrvData.valmiusaste.toFixed(1) : hrvData.valmiusaste;
    }
  }

  // Päivitetään stressiarvo
  if (elements.stress) {
    // Käytetään johdonmukaista kenttien nimien priorisointia
    const stressValue = hrvData.stress !== undefined ? hrvData.stress :
                      (hrvData.stress_index !== undefined ? hrvData.stress_index :
                      hrvData.stressi_indeksi);

    if (stressValue !== null && stressValue !== undefined) {
      elements.stress.textContent = typeof stressValue === 'number' ?
        stressValue.toFixed(1) : stressValue;
    }
  }

  // Päivitetään keskisyke
  if (elements.heartRate) {
    // Käytetään johdonmukaista kenttien nimien priorisointia
    const bpmValue = hrvData.bpm !== null && hrvData.bpm !== undefined ? hrvData.bpm :
                   (hrvData.mean_hr_bpm !== null && hrvData.mean_hr_bpm !== undefined ? hrvData.mean_hr_bpm :
                   hrvData.syke);
                   
    if (bpmValue !== null && bpmValue !== undefined) {
      elements.heartRate.textContent = typeof bpmValue === 'number' ?
        Math.round(bpmValue) : bpmValue;
    }
  }

  // Päivitetään SDNN-arvo
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

// Hakee HRV-tietoja tietokannasta
export async function fetchHrvDataFromDatabase(dateStr) {
  console.log(`Fetching HRV data from database for date ${dateStr}`);
  try {
    // Tarkistetaan onko käyttäjä kirjautunut
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
      console.log('User not logged in');
      return null;
    }

    // Tarkistetaan löytyykö tietoja paikallisesta välimuistista
    const entries = window.DiaBalance.entries.monthEntries || {};
    const entry = entries[dateStr];

    if (entry && entry.hrv_data) {
      console.log('HRV data found from local cache for date:', dateStr);
      return entry.hrv_data;
    }

    // Nollataan näkymä jos tietoja ei löydy
    resetHRVValues();
    return null;
  } catch (error) {
    console.error('Error fetching HRV data from database:', error);
    resetHRVValues();
    return null;
  }
}

// Hakee ja tallentaa HRV-tiedot tietylle päivälle
export async function fetchAndSaveHrvDataForDay(dateStr) {
  console.log(`Fetching HRV data for date ${dateStr}`);
  try {
    // Haetaan käyttäjätiedot ja token
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    if (!user || !token) {
      return {
        success: false,
        message: 'Käyttäjä ei ole kirjautunut sisään'
      };
    }

    console.log('Sending request to Kubios API through our backend...');

    // TÄRKEÄ MUUTOS: Poistettu noSave=true parametri jotta data tallennetaan tietokantaan
    const response = await fetch(`http://localhost:3000/api/kubios/user-data/${dateStr}`, {
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

    // Tarkistetaan löytyikö HRV-dataa
    if (hrvData.length === 0) {
      return {
        success: false,
        message: 'HRV-dataa ei löytynyt valitulle päivälle'
      };
    }

    // Logataan API-vastaus debuggausta varten
    console.log('Raw API response fields:', Object.keys(hrvData[0]));
    console.log('API response data:', hrvData[0]);

    const apiResponse = hrvData[0];

    // Muokataan näytettävä HRV-data oikeaan muotoon
    const hrvDisplay = {
      readiness: apiResponse.readiness,
      // Yhdenmukainen kenttien nimeäminen - priorisoidaan tietokannan nimiä
      stress: apiResponse.stress || apiResponse.stress_index,
      bpm: apiResponse.bpm || apiResponse.mean_hr_bpm,
      sdnn_ms: apiResponse.sdnn_ms,
      _rawData: apiResponse
    };

    console.log('Transformed HRV data for UI:', hrvDisplay);

    // Päivitetään näkymä
    updateHRVView(hrvDisplay);

    // TÄRKEÄ KORJAUS: Muokataan suoraan window.DiaBalance.entries.monthEntries 
    // objektia eikä yritetä korvata sitä kokonaan
    if (window.DiaBalance.entries.monthEntries[dateStr]) {
      window.DiaBalance.entries.monthEntries[dateStr].hrv_data = hrvDisplay;
    } else {
      // Jos merkintää ei vielä ole, luodaan uusi merkintä HRV-datalla
      window.DiaBalance.entries.monthEntries[dateStr] = {
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
    }

    // Varmistetaan tietojen säilyvyys tallentamalla ne tietokantaan
    const saveResult = await saveHrvDataToDatabase(dateStr, hrvDisplay);
    
    if (saveResult.success) {
      return {
        success: true,
        message: 'HRV-data haettu ja tallennettu onnistuneesti'
      };
    } else {
      return {
        success: true,
        message: 'HRV-data haettu, mutta tallennuksessa oli ongelmia'
      };
    }
  } catch (error) {
    console.error('Error in fetchAndSaveHrvDataForDay:', error);
    return {
      success: false,
      message: 'Virhe HRV-datan hakemisessa: ' + error.message
    };
  }
}

// Tallentaa HRV-tiedot tietokantaan
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

    // KORJAUS: Varmistetaan että perusmerkintä on olemassa ja odotetaan operaation valmistumista
    try {
      const emptyEntry = {
        pvm: dateStr,
        oireet: 'Ei oireita',
        kommentti: 'Automaattinen kirjaus HRV-dataa varten'
      };

      // Luodaan tai päivitetään perusmerkintä
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
        return {
          success: false,
          message: 'Perusmerkinnän luonti HRV-datalle epäonnistui'
        };
      }

      console.log('Basic entry created/updated successfully');
      
      // Pieni viive varmistaa että tietokanta ehtii käsitellä merkinnän
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (entryError) {
      console.error('Error ensuring basic entry exists:', entryError);
      return {
        success: false,
        message: 'Virhe perusmerkinnän luonnissa: ' + entryError.message
      };
    }

    // Valmistellaan HRV-data tallennusta varten
    const rawData = hrvData._rawData || hrvData;
    const hrvToSave = {
      readiness: rawData.readiness,
      // Yhdenmukainen kenttien nimeäminen - priorisoidaan tietokannan nimet
      stress: rawData.stress || rawData.stress_index,
      bpm: rawData.bpm || rawData.mean_hr_bpm,
      sdnn_ms: rawData.sdnn_ms
    };

    // Tallennetaan HRV-data
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

// Asettaa mittausarvot oletusarvoon
function resetHRVValues() {
  // Haetaan mittausarvojen elementit
  const elements = {
    readiness: document.querySelector('.metrics-container .metric-value:not(.stress):not(.heart-rate):not(.sdnn)'),
    stress: document.querySelector('.metrics-container .metric-value.stress'),
    heartRate: document.querySelector('.metrics-container .metric-value.heart-rate'),
    sdnn: document.querySelector('.metrics-container .metric-value.sdnn')
  };

  // Tarkistetaan että elementit löytyvät
  console.log('HRV reset elements found:', {
    readiness: !!elements.readiness,
    stress: !!elements.stress,
    heartRate: !!elements.heartRate,
    sdnn: !!elements.sdnn
  });

  // Asetetaan viivat kaikille elementeille
  Object.values(elements).forEach(el => {
    if (el) el.textContent = '–';
  });
}