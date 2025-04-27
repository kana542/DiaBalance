/**
 * Verensokeriarvojen validointi
 *
 * Varmistaa että syötetyt arvot ovat järkeviä (0-30 mmol/l),
 * hyväksyy vain numerot ja desimaalipilkut/pisteet, ja antaa
 * välittömän palautteen virheellisistä arvoista.
 */

/**
 * Muuntaa suomalaisen desimaaliluvun (pilkku) kansainväliseen muotoon (piste)
 * @param {string} value - Syötetty arvo
 * @returns {string} Muunnettu arvo
 */
export function formatDecimalValue(value) {
  if (!value) return '';
  // Korvaa pilkut pisteillä
  return value.replace(',', '.');
}

/**
 * Validoi verensokeriarvon
 * @param {string|number} value - Tarkistettava arvo
 * @returns {object} Validointitulokset
 */
export function validateBloodSugarValue(value) {
  // Jos arvo on tyhjä, se on kelvollinen (ei pakollinen kenttä)
  if (value === null || value === undefined || value === '') {
    return { isValid: true, message: '' };
  }

  // Muunna arvo numeroksi
  const numericValue = parseFloat(value);

  // Tarkista että arvo on numero
  if (isNaN(numericValue)) {
    return {
      isValid: false,
      message: 'Syötä kelvollinen numero'
    };
  }

  // Tarkista arvoalue (0-30 mmol/l)
  if (numericValue < 0 || numericValue > 30) {
    return {
      isValid: false,
      message: 'Arvon tulee olla välillä 0-30 mmol/l'
    };
  }

  // Tarkista että desimaaleja ei ole liikaa (max 1)
  const decimalPlaces = (numericValue.toString().split('.')[1] || '').length;
  if (decimalPlaces > 1) {
    return {
      isValid: false,
      message: 'Enintään yksi desimaalipaikka sallittu'
    };
  }

  // Arvo on kelvollinen
  return {
    isValid: true,
    message: '',
    value: numericValue
  };
}

/**
 * Liitä verensokerikentän validointi input-elementtiin
 * @param {HTMLInputElement} inputElement - Kenttä johon validointi liitetään
 */
export function setupBloodSugarValidation(inputElement) {
  if (!inputElement) return;

  // Poista aiemmat validointikuuntelijat
  const newInput = inputElement.cloneNode(true);
  if (inputElement.parentNode) {
    inputElement.parentNode.replaceChild(newInput, inputElement);
    inputElement = newInput;
  }

  // Poista aiemmat validointiviestit
  const existingFeedback = inputElement.parentNode?.querySelector('.validation-feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }

  // Luo palauteviestielementti
  const feedbackElement = document.createElement('div');
  feedbackElement.className = 'validation-feedback';
  feedbackElement.style.fontSize = '12px';
  feedbackElement.style.marginTop = '5px';
  feedbackElement.style.display = 'none';

  // Lisää palauteviesti kentän jälkeen
  if (inputElement.parentNode) {
    inputElement.parentNode.insertBefore(feedbackElement, inputElement.nextSibling);
  }

  // Lisää validointi syötettäessä
  inputElement.addEventListener('input', function(event) {
    // Tarkista että syöte sisältää vain sallittuja merkkejä
    const inputValue = event.target.value;
    // Salli vain numerot, pisteet ja pilkut
    const cleanValue = inputValue.replace(/[^0-9.,]/g, '');

    // Jos syöte on muuttunut, päivitä kenttä
    if (cleanValue !== inputValue) {
      event.target.value = cleanValue;
    }

    // Validoi arvo
    const formattedValue = formatDecimalValue(cleanValue);
    const validationResult = validateBloodSugarValue(formattedValue);

    // Näytä palaute
    if (!validationResult.isValid && cleanValue.length > 0) {
      feedbackElement.textContent = validationResult.message;
      feedbackElement.style.display = 'block';
      feedbackElement.style.color = '#e74c3c';
      inputElement.style.borderColor = '#e74c3c';
    } else {
      feedbackElement.style.display = 'none';
      inputElement.style.borderColor = cleanValue.length > 0 ? '#2ecc71' : '';
    }
  });

  // Muunna pilkut pisteiksi kun kenttä menettää fokuksen
  inputElement.addEventListener('blur', function() {
    const value = inputElement.value;
    if (value) {
      const formattedValue = formatDecimalValue(value);
      inputElement.value = formattedValue;

      // Tarkista vielä kerran validointi
      const validationResult = validateBloodSugarValue(formattedValue);
      if (!validationResult.isValid) {
        feedbackElement.textContent = validationResult.message;
        feedbackElement.style.display = 'block';
        feedbackElement.style.color = '#e74c3c';
        inputElement.style.borderColor = '#e74c3c';
      } else {
        feedbackElement.style.display = 'none';
        inputElement.style.borderColor = value.length > 0 ? '#2ecc71' : '';
      }
    }
  });
}

/**
 * Liitä validointi kaikkiin verensokerisyöttökenttiin
 * @param {string} selector - CSS-valitsin syöttökentille
 */
export function setupAllBloodSugarInputs(selector = 'input[type="number"].blood-sugar-input') {
  const inputs = document.querySelectorAll(selector);
  inputs.forEach(input => {
    setupBloodSugarValidation(input);
  });
}

/**
 * Liitä validointi modal-lomakkeen verensokerisyöttökenttiin
 */
export function setupEntryModalBloodSugarValidation() {
  // Kaikki verensokerikenttien ID:t
  const bloodSugarInputIds = [
    'morningValue', 'eveningValue',
    'breakfastBefore', 'breakfastAfter',
    'lunchBefore', 'lunchAfter',
    'snackBefore', 'snackAfter',
    'dinnerBefore', 'dinnerAfter',
    'eveningSnackBefore', 'eveningSnackAfter'
  ];

  // Liitä validointi jokaiseen kenttään
  bloodSugarInputIds.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      setupBloodSugarValidation(input);
    }
  });
}
