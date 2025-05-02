// ui-utils.js

/**
 * Ilmoitusten vakavuustasot
 */
export const NotificationSeverity = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
  };

  /**
   * Näyttää virheen määritellyssä elementissä tai alertissa
   * @param {string|Element} element - Virhe-elementti tai elementin ID
   * @param {string} message - Virheviesti
   */
  export function showError(element, message) {
    const errorElement = typeof element === 'string' ? document.getElementById(element) : element;

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';

      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      showToast(message, NotificationSeverity.ERROR);
    }
  }

  /**
   * Asettaa syötekentän arvon
   * @param {string} id - Elementin ID
   * @param {*} value - Asetettava arvo
   * @returns {boolean} - Onnistuiko operaatio
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
   * Resetoi lomakkeen arvot
   * @param {string|Element} form - Lomake-elementti tai elementin ID
   */
  export function resetForm(form) {
    const formElement = typeof form === 'string' ? document.getElementById(form) : form;
    if (formElement && formElement.tagName === 'FORM') {
      formElement.reset();
    }
  }

  /**
   * Asettaa elementin näkyvyyden
   * @param {string|Element} element - Kohde-elementti tai elementin ID
   * @param {boolean} visible - Näytetäänkö elementti
   */
  export function setElementVisibility(element, visible) {
    const el = typeof element === 'string' ? document.getElementById(element) : element;
    if (el) {
      el.style.display = visible ? 'block' : 'none';
    }
  }

  /**
   * Luo HTML-elementin annetuilla attribuuteilla ja lapsilla
   * @param {string} tag - HTML-elementin tyyppi
   * @param {object} attributes - Elementin attribuutit
   * @param {array|string} children - Elementin lapset tai tekstisisältö
   * @returns {HTMLElement} Luotu elementti
   */
  export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

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
   * Näyttää vahvistusdialogn käyttäjälle
   * @param {string} message - Vahvistusviesti
   * @param {string} confirmText - Vahvistusnapin teksti
   * @param {string} cancelText - Peruutusnapin teksti
   * @returns {Promise<boolean>} Käyttäjän valinta (true/false)
   */
  export function showConfirmDialog(message, confirmText = 'Kyllä', cancelText = 'Peruuta') {
    return new Promise((resolve) => {
      // Käytä natiivi-confirmiä jos oma toteutus ei ole mahdollinen
      const confirmed = window.confirm(message);
      resolve(confirmed);
    });
  }

  /**
   * Näyttää ilmoituksen oikeassa alakulmassa
   * @param {string} message - Ilmoitusteksti
   * @param {string} severity - Ilmoituksen vakavuusaste (info, success, warning, error)
   * @param {number} duration - Ilmoituksen kesto millisekunteina
   */
  export function showToast(message, severity = NotificationSeverity.INFO, duration = 3000) {
    // Etsi olemassa oleva container
    let toastContainer = document.getElementById('toast-container');

    // Jos container on olemassa, poista ensin kaikki samantyyppiset viestit
    if (toastContainer) {
        const existingToasts = toastContainer.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            // Poista samantyyppiset viestit (esim. kaikki verensokeriin liittyvät)
            if (toast.textContent.includes('välillä 0-30 mmol/l')) {
                toast.remove();
            }
        });
    } else {
        // Luo container toasteille jos sitä ei vielä ole
        toastContainer = createElement('div', {
            id: 'toast-container',
            style: {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                zIndex: '1000',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
            }
        });
        document.body.appendChild(toastContainer);
    }

    // Määritetään väri vakavuuden mukaan
    let backgroundColor, borderColor, iconClass;
    switch (severity) {
      case NotificationSeverity.SUCCESS:
        backgroundColor = '#edf7f0';
        borderColor = '#4ecdc4';
        iconClass = 'fa-check-circle';
        break;
      case NotificationSeverity.WARNING:
        backgroundColor = '#fff7e8';
        borderColor = '#ff9f43';
        iconClass = 'fa-exclamation-triangle';
        break;
      case NotificationSeverity.ERROR:
        backgroundColor = '#feecef';
        borderColor = '#ff5869';
        iconClass = 'fa-times-circle';
        break;
      case NotificationSeverity.INFO:
      default:
        backgroundColor = '#e8f4fd';
        borderColor = '#1cb0f6';
        iconClass = 'fa-info-circle';
    }

    // Luodaan toast-elementti
    const toast = createElement('div', {
      style: {
        backgroundColor,
        color: '#333',
        padding: '12px 20px',
        borderRadius: '6px',
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
        opacity: '0',
        transition: 'all 0.3s ease-in-out',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        maxWidth: '400px',
        wordBreak: 'break-word'
      }
    });

    // Jos Font Awesome on saatavilla, lisätään ikoni
    if (typeof window.FontAwesome !== 'undefined' || document.querySelector('link[href*="font-awesome"]')) {
      const icon = createElement('i', {
        className: `fas ${iconClass}`,
        style: {
          marginRight: '10px',
          color: borderColor,
          fontSize: '18px'
        }
      });
      toast.appendChild(icon);
    }

    // Lisätään viesti
    const messageEl = createElement('span', {}, message);
    toast.appendChild(messageEl);

    // Lisätään toast containeriin
    toastContainer.appendChild(toast);

    // Animoidaan toast näkyviin
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    // Poistetaan toast määritetyn ajan jälkeen
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (toast.parentNode) {
          toastContainer.removeChild(toast);
        }

        // Poistetaan container jos se on tyhjä
        if (toastContainer.children.length === 0 && toastContainer.parentNode) {
          document.body.removeChild(toastContainer);
        }
      }, 300);
    }, duration);
  }

  /**
   * Näyttää lomakkeen validointivirheet
   * @param {Object} errors - Virheet muodossa [{field: "kenttä", message: "virheviesti"}, ...]
   * @param {string} formId - Lomakkeen ID (valinnainen)
   */
  export function showValidationErrors(errors, formId = null) {
    if (!Array.isArray(errors) || errors.length === 0) return;

    // Etsi lomake jos ID annettu
    const form = formId ? document.getElementById(formId) : document;
    if (!form) return;

    // Näytä jokainen virhe kentän vieressä
    errors.forEach(error => {
      const field = form.querySelector(`[name="${error.field}"]`);
      if (field) {
        // Luo tai hae virheilmoituselementti
        let errorElement = field.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('field-error')) {
          errorElement = createElement('div', {
            className: 'field-error',
            style: {
              color: '#ff5869',
              fontSize: '12px',
              marginTop: '5px'
            }
          });
          field.parentNode.insertBefore(errorElement, field.nextSibling);
        }

        // Aseta virheviesti
        errorElement.textContent = error.message;

        // Korosta virheellinen kenttä
        field.style.borderColor = '#ff5869';

        // Lisää tapahtumankäsittelijä virhekorostuksen poistamiseksi
        const clearError = () => {
          field.style.borderColor = '';
          if (errorElement && errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
          }
          field.removeEventListener('input', clearError);
        };

        field.addEventListener('input', clearError);
      }
    });

    // Näytä yhteenveto toastina jos virheitä on monta
    if (errors.length > 1) {
      showToast(`Lomakkeessa on ${errors.length} virhettä`, NotificationSeverity.WARNING);
    }
  }
