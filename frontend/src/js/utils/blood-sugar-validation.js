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
export function validateBloodSugarValue(value) {
  if (value === null || value === undefined || value === '') {
    return { isValid: true, message: '' };
  }

  const numericValue = parseFloat(value);
  
  if (isNaN(numericValue)) {
    return { isValid: false, message: 'Syötä kelvollinen numero' };
  }
  
  if (numericValue < 1 || numericValue > 30) {
    return { isValid: false, message: 'Arvon tulee olla välillä 1-30 mmol/l' };
  }
  
  return { isValid: true, message: '' };
}


/**
 * Liitä verensokerikentän validointi input-elementtiin
 * Näyttää virheilmoituksen heti kun arvo ylittää sallitun rajan
 * @param {HTMLInputElement} inputElement - Kenttä johon validointi liitetään
 */
export function setupBloodSugarValidation(inputElement) {
  if (!inputElement) return;
  
  console.log("Setting up validation for:", inputElement.id);
  
  // Create feedback element right away
  let feedbackElement = inputElement.parentNode.querySelector('.validation-feedback');
  if (!feedbackElement) {
    feedbackElement = document.createElement('div');
    feedbackElement.className = 'validation-feedback';
    feedbackElement.style.fontSize = '12px';
    feedbackElement.style.marginTop = '5px';
    feedbackElement.style.color = '#e74c3c';
    feedbackElement.style.display = 'none';
    
    // Insert after input
    inputElement.parentNode.insertBefore(feedbackElement, inputElement.nextSibling);
  }
  
  // Immediate validation on every keystroke
  inputElement.addEventListener('input', function() {
    const value = this.value;
    const numValue = parseFloat(value);
    
    // Check immediately if value exceeds 30
    if (value && (numValue > 30 || numValue < 1)) {
      feedbackElement.textContent = 'Arvon tulee olla välillä 1-30 mmol/l';
      feedbackElement.style.display = 'block';
      this.style.borderColor = '#e74c3c';
      console.log("Showing error for:", this.id, "Value:", numValue);
    } else {
      feedbackElement.style.display = 'none';
      this.style.borderColor = value ? '#2ecc71' : '';
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
