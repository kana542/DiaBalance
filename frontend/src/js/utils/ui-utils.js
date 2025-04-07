/**
 * ui-utils.js
 * UI-komponenttien luomiseen ja hallintaan tarkoitetut apufunktiot
 */

/**
 * Näyttää virheviestin käyttäjälle
 * @param {HTMLElement|string} element - Elementti tai elementin id, johon virheilmoitus näytetään
 * @param {string} message - Virheilmoituksen teksti
 */
export function showError(element, message) {
   const errorElement = typeof element === 'string' ? document.getElementById(element) : element;

   if (errorElement) {
       errorElement.textContent = message;
       errorElement.style.display = 'block';

       // Vieritetään viesti näkyviin
       errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
   } else {
       // Fallback: käytä alerttia jos elementtiä ei löydy
       alert('Virhe: ' + message);
   }
}

/**
* Asettaa input-kentän arvon
* @param {string} id - Input-kentän id
* @param {any} value - Kentän arvo
* @returns {boolean} - true jos arvo asetettiin onnistuneesti
*/
export function setInputValue(id, value) {
   const input = document.getElementById(id);
   if (input && value !== null && value !== undefined) {
       input.value = value;
       return true;
   }
   return false;
}

/**
* Nollaa lomakkeen kentät
* @param {HTMLFormElement|string} form - Lomake-elementti tai lomakkeen id
*/
export function resetForm(form) {
   const formElement = typeof form === 'string' ? document.getElementById(form) : form;
   if (formElement && formElement.tagName === 'FORM') {
       formElement.reset();
   }
}

/**
* Asettaa elementin näkyvyyden
* @param {HTMLElement|string} element - Elementti tai elementin id
* @param {boolean} visible - true = näkyvissä, false = piilotettu
*/
export function setElementVisibility(element, visible) {
   const el = typeof element === 'string' ? document.getElementById(element) : element;
   if (el) {
       el.style.display = visible ? 'block' : 'none';
   }
}

/**
* Luo HTML-elementti annetuilla ominaisuuksilla ja lapsielementeillä
* @param {string} tag - HTML-tagin nimi
* @param {Object} attributes - Elementin attribuutit
* @param {Array|string} children - Lapsielementit tai tekstisisältö
* @returns {HTMLElement} - Luotu elementti
*/
export function createElement(tag, attributes = {}, children = []) {
   const element = document.createElement(tag);

   // Aseta attribuutit
   Object.entries(attributes).forEach(([key, value]) => {
       if (key === 'style' && typeof value === 'object') {
           Object.entries(value).forEach(([prop, val]) => {
               element.style[prop] = val;
           });
       } else if (key.startsWith('on') && typeof value === 'function') {
           // Tapahtumankäsittelijät (onClick => click)
           const eventName = key.substring(2).toLowerCase();
           element.addEventListener(eventName, value);
       } else {
           element.setAttribute(key, value);
       }
   });

   // Lisää lapsielementit tai tekstisisältö
   if (typeof children === 'string') {
       element.textContent = children;
   } else if (Array.isArray(children)) {
       children.forEach(child => {
           if (typeof child === 'string') {
               element.appendChild(document.createTextNode(child));
           } else if (child instanceof HTMLElement) {
               element.appendChild(child);
           }
       });
   }

   return element;
}

/**
* Luo vahvistusikkuna
* @param {string} message - Vahvistusviesti
* @param {string} confirmText - Vahvistusnapin teksti
* @param {string} cancelText - Peruutusnapin teksti
* @returns {Promise<boolean>} - True jos käyttäjä vahvisti, false jos peruutti
*/
export function showConfirmDialog(message, confirmText = 'Kyllä', cancelText = 'Peruuta') {
   return new Promise((resolve) => {
       // Käytä natiivi-confirmiä jos oma toteutus ei ole mahdollinen
       const confirmed = window.confirm(message);
       resolve(confirmed);
   });
}

/**
* Näyttää toast-ilmoituksen (väliaikainen popup)
* @param {string} message - Ilmoituksen teksti
* @param {string} type - Ilmoituksen tyyppi ('success', 'error', 'info')
* @param {number} duration - Ilmoituksen kesto millisekunneissa
*/
export function showToast(message, type = 'info', duration = 3000) {
   // Tarkistetaan onko toast-container jo luotu
   let toastContainer = document.getElementById('toast-container');

   if (!toastContainer) {
       // Luodaan container toasteille
       toastContainer = createElement('div', {
           id: 'toast-container',
           style: {
               position: 'fixed',
               bottom: '20px',
               right: '20px',
               zIndex: '1000'
           }
       });
       document.body.appendChild(toastContainer);
   }

   // Määritetään väri tyypin mukaan
   let backgroundColor;
   switch (type) {
       case 'success':
           backgroundColor = '#4ecdc4';
           break;
       case 'error':
           backgroundColor = '#ff5869';
           break;
       case 'info':
       default:
           backgroundColor = '#1cb0f6';
   }

   // Luodaan toast-elementti
   const toast = createElement('div', {
       style: {
           backgroundColor,
           color: 'white',
           padding: '12px 20px',
           borderRadius: '4px',
           marginTop: '10px',
           boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
           opacity: '0',
           transition: 'opacity 0.3s ease-in-out',
           fontSize: '14px'
       }
   }, message);

   // Lisätään toast containeriin
   toastContainer.appendChild(toast);

   // Animoidaan toast näkyviin
   setTimeout(() => {
       toast.style.opacity = '1';
   }, 10);

   // Poistetaan toast määritetyn ajan jälkeen
   setTimeout(() => {
       toast.style.opacity = '0';
       setTimeout(() => {
           toastContainer.removeChild(toast);

           // Poistetaan container jos se on tyhjä
           if (toastContainer.children.length === 0) {
               document.body.removeChild(toastContainer);
           }
       }, 300);
   }, duration);
}
