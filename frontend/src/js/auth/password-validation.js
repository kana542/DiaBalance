export function evaluatePasswordStrength(password) {
    // Alusta pistemäärä ja viestit
    let score = 0;
    const feedback = [];
    const strengthLevel = {
      0: { text: "Heikko", color: "#e74c3c" },
      1: { text: "Kohtalainen", color: "#f39c12" },
      2: { text: "Hyvä", color: "#3498db" },
      3: { text: "Vahva", color: "#2ecc71" }
    };
    
    // Validointitarkistukset ja pisteytys
    if (!password || password.length === 0) {
      feedback.push("Syötä salasana");
      return { 
        score, 
        level: strengthLevel[0], 
        feedback, 
        isValid: false 
      };
    }
    
    // Tarkista pituus (vähintään 8 merkkiä)
    if (password.length < 8) {
      feedback.push("Salasanan tulee olla vähintään 8 merkkiä pitkä");
    } else {
      score += 1;
    }
    
    // Tarkista, sisältääkö numeroita
    if (/\d/.test(password)) {
      score += 0.5;
    } else {
      feedback.push("Lisää numeroita vahvistaaksesi salasanaa");
    }
    
    // Tarkista, sisältääkö isoja kirjaimia
    if (/[A-Z]/.test(password)) {
      score += 0.5;
    } else {
      feedback.push("Lisää isoja kirjaimia vahvistaaksesi salasanaa");
    }
    
    // Tarkista, sisältääkö erikoismerkkejä
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Lisää erikoismerkkejä vahvistaaksesi salasanaa");
    }
    
    // Tarkista pituus (yli 12 merkkiä antaa lisäpisteitä)
    if (password.length >= 12) {
      score += 1;
    }
    
    // Rajoita pistemäärä välille 0-3
    score = Math.min(3, Math.floor(score));
    
    // Jos pistemäärä on vähintään 1, salasana on hyväksyttävä
    const isValid = score >= 1;
    
    // Jos salasana on hyväksyttävä ja ei ole erikseen palautetta,
    // anna yleinen positiivinen palaute
    if (isValid && feedback.length === 0) {
      feedback.push("Salasana kelpaa");
    }
    
    return {
      score,
      level: strengthLevel[score],
      feedback,
      isValid
    };
  }
  
  /**
   * Tarkistaa, täsmäävätkö salasanat
   * @param {string} password - Alkuperäinen salasana
   * @param {string} confirmPassword - Vahvistussalasana
   * @returns {boolean} Täsmäävätkö salasanat
   */
  export function doPasswordsMatch(password, confirmPassword) {
    return password === confirmPassword;
  }
  
  /**
   * Luo ja päivittää salasanan vahvuusmittarin
   * @param {HTMLElement} containerElement - Elementti johon mittari lisätään
   * @param {object} strengthInfo - Vahvuustiedot evaluatePasswordStrength-funktiosta
   */
  export function updatePasswordStrengthMeter(containerElement, strengthInfo) {
    // Etsi olemassaoleva vahvuusmittari tai luo uusi
    let strengthMeter = containerElement.querySelector('.password-strength-meter');
    let strengthText = containerElement.querySelector('.password-strength-text');
    let strengthFeedback = containerElement.querySelector('.password-feedback');
    
    if (!strengthMeter) {
      // Luo mittarikontaineri
      const meterContainer = document.createElement('div');
      meterContainer.className = 'password-strength-container';
      
      // Luo palkkimittari
      strengthMeter = document.createElement('div');
      strengthMeter.className = 'password-strength-meter';
      
      // Luo tekstikenttä vahvuudelle
      strengthText = document.createElement('span');
      strengthText.className = 'password-strength-text';
      
      // Luo palautekenttä
      strengthFeedback = document.createElement('div');
      strengthFeedback.className = 'password-feedback';
      
      // Lisää elementit konttiin
      meterContainer.appendChild(strengthMeter);
      meterContainer.appendChild(strengthText);
      meterContainer.appendChild(strengthFeedback);
      containerElement.appendChild(meterContainer);
    }
    
    // Päivitä vahvuusmittarin tila
    const fillWidth = (strengthInfo.score / 3) * 100;
    strengthMeter.style.width = `${fillWidth}%`;
    strengthMeter.style.backgroundColor = strengthInfo.level.color;
    
    // Päivitä vahvuusteksti
    strengthText.textContent = strengthInfo.level.text;
    strengthText.style.color = strengthInfo.level.color;
    
    // Näytä palaute
    strengthFeedback.innerHTML = '';
    if (strengthInfo.feedback.length > 0) {
      const feedbackList = document.createElement('ul');
      feedbackList.className = 'feedback-list';
      
      strengthInfo.feedback.forEach(item => {
        const listItem = document.createElement('li');
        listItem.textContent = item;
        feedbackList.appendChild(listItem);
      });
      
      strengthFeedback.appendChild(feedbackList);
    }
  }