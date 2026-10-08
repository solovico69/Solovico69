/**
 * PROYECTO: Control Ethan - Sistema de Inventario y Ventas iPhone
 * DESARROLLO & ARQUITECTURA: Victor Solorzano
 * ASISTENCIA TÉCNICA: OpenCode for Obsidian & Antigravity IDE
 * ROL: Módulo de Autenticación - PIN de 4 Dígitos, Recuperación y Biometría WebAuthn (Touch ID / Face ID)
 */

const AuthModule = (function () {
  const PIN_STORAGE_KEY = 'control_ethan_pin_hash';
  const RECOVERY_STORAGE_KEY = 'control_ethan_recovery_answer';
  const BIOMETRIC_CRED_ID_KEY = 'control_ethan_biometric_id';
  const BIOMETRIC_ENABLED_KEY = 'control_ethan_biometric_enabled';
  const SESSION_KEY = 'control_ethan_session_active';

  let currentPinInput = '';

  // Hashing simple para almacenamiento local
  async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str + '_ethan_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verifica si el usuario ya configuró un PIN inicial
  function hasConfiguredPin() {
    return !!localStorage.getItem(PIN_STORAGE_KEY);
  }

  // Configura o actualiza el PIN y la respuesta de recuperación
  async function setupPin(pin, recoveryAnswer) {
    if (!pin || pin.length !== 4 || isNaN(pin)) {
      throw new Error('El PIN debe contener exactamente 4 dígitos numéricos.');
    }
    const hash = await hashString(pin);
    localStorage.setItem(PIN_STORAGE_KEY, hash);

    if (recoveryAnswer && recoveryAnswer.trim() !== '') {
      const recHash = await hashString(recoveryAnswer.trim().toLowerCase());
      localStorage.setItem(RECOVERY_STORAGE_KEY, recHash);
    }

    markSessionActive();
    return true;
  }

  // Valida el PIN ingresado
  async function verifyPin(pin) {
    const storedHash = localStorage.getItem(PIN_STORAGE_KEY);
    if (!storedHash) return false;
    const testHash = await hashString(pin);
    const isValid = (testHash === storedHash);
    if (isValid) {
      markSessionActive();
    }
    return isValid;
  }

  // Recupera/cambia el PIN si olvidó el código
  async function resetPinWithRecovery(recoveryAnswer, newPin) {
    const storedRecHash = localStorage.getItem(RECOVERY_STORAGE_KEY);
    if (!storedRecHash) {
      throw new Error('No se encontró una palabra de recuperación configurada.');
    }
    const testRecHash = await hashString(recoveryAnswer.trim().toLowerCase());
    if (testRecHash !== storedRecHash) {
      throw new Error('La respuesta de recuperación es incorrecta.');
    }

    return await setupPin(newPin, recoveryAnswer);
  }

  // Comprueba si la biometría (Face ID / Touch ID) está disponible en el navegador
  async function isBiometricAvailable() {
    if (window.PublicKeyCredential && 
        PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  function isBiometricConfigured() {
    return localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true' &&
           !!localStorage.getItem(BIOMETRIC_CRED_ID_KEY);
  }

  // Registrar Huella Dactilar o Face ID mediante WebAuthn
  async function registerBiometrics() {
    if (!window.PublicKeyCredential) {
      throw new Error('Tu dispositivo o navegador no soporta autenticación biométrica web.');
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userId = new Uint8Array(16);
    window.crypto.getRandomValues(userId);

    const publicKeyCredentialCreationOptions = {
      challenge: challenge,
      rp: {
        name: 'Control Ethan App',
        id: window.location.hostname
      },
      user: {
        id: userId,
        name: 'usuario@controlethan.local',
        displayName: 'Usuario Ethan'
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Obliga al uso de Touch ID / Face ID
        userVerification: 'required'
      },
      timeout: 60000,
      attestation: 'none'
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      if (credential) {
        const rawId = btoa(String.fromCharCode.apply(null, new Uint8Array(credential.rawId)));
        localStorage.setItem(BIOMETRIC_CRED_ID_KEY, rawId);
        localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
        return true;
      }
    } catch (err) {
      console.error('Error registrando biometría:', err);
      throw new Error('No se pudo completar el registro biométrico: ' + (err.message || err));
    }
    return false;
  }

  // Autenticar con Huella Dactilar o Face ID
  async function authenticateBiometrics() {
    if (!isBiometricConfigured()) {
      throw new Error('Aún no has activado la huella o Face ID.');
    }

    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const rawIdStr = localStorage.getItem(BIOMETRIC_CRED_ID_KEY);
    const rawId = Uint8Array.from(atob(rawIdStr), c => c.charCodeAt(0));

    const publicKeyCredentialRequestOptions = {
      challenge: challenge,
      allowCredentials: [{
        id: rawId,
        type: 'public-key',
        transports: ['internal']
      }],
      userVerification: 'required',
      timeout: 60000
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      if (assertion) {
        markSessionActive();
        return true;
      }
    } catch (err) {
      console.warn('Error al verificar biometría:', err);
      throw new Error('Verificación biométrica cancelada o no reconocida.');
    }
    return false;
  }

  function markSessionActive() {
    sessionStorage.setItem(SESSION_KEY, 'active');
  }

  function isSessionActive() {
    return sessionStorage.getItem(SESSION_KEY) === 'active';
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  return {
    hasConfiguredPin,
    setupPin,
    verifyPin,
    resetPinWithRecovery,
    isBiometricAvailable,
    isBiometricConfigured,
    registerBiometrics,
    authenticateBiometrics,
    isSessionActive,
    logout
  };
})();
