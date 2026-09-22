
(function () {
  "use strict";

  /* ============================================================
     STORAGE LAYER (demo only)
     Replace registerUser() with a real API call, e.g.:

       async function registerUser(data) {
         const res = await fetch('/api/auth/signup', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(data)
         });
         if (!res.ok) throw new Error((await res.json()).message || 'Could not create account');
         return res.json(); // { user }
       }

     A real backend should also validate the company code server-side
     and verify the email address before activating the account.
     ============================================================ */
  const USERS_KEY = "officepulse_users_v1";
  const VALID_COMPANY_CODES = ["ACME-HQ", "DEMO-2026"]; // demo whitelist only

  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
  }

  function registerUser({ name, email, password, companyCode, role }) {
    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with that email already exists.");
    }
    if (!VALID_COMPANY_CODES.includes(companyCode.toUpperCase())) {
      throw new Error("That company code isn't recognized — check with your office manager.");
    }
    const user = {
      id: (role === "manager" ? "mgr_" : "emp_") + Math.random().toString(36).slice(2, 9),
      name, email, password, role,
    };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return user;
  }

  /* ============================================================
     FORM HANDLING
     ============================================================ */
  const form = document.getElementById("signup-form");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const companyCodeInput = document.getElementById("company-code");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirm-password");
  const termsInput = document.getElementById("terms");
  const submitBtn = document.getElementById("submit-btn");
  const banner = document.getElementById("form-banner");
  const strengthMeter = document.getElementById("strength-meter");

  const errors = {
    name: document.getElementById("name-error"),
    email: document.getElementById("email-error"),
    "company-code": document.getElementById("company-code-error"),
    password: document.getElementById("password-error"),
    "confirm-password": document.getElementById("confirm-password-error"),
  };

  function clearErrors() {
    [nameInput, emailInput, companyCodeInput, passwordInput, confirmInput].forEach((el) => el.classList.remove("has-error"));
    Object.values(errors).forEach((el) => { el.classList.remove("show"); el.textContent = ""; });
    banner.classList.remove("show", "success");
    banner.textContent = "";
  }

  function fieldError(input, msgEl, message) {
    input.classList.add("has-error");
    msgEl.textContent = message;
    msgEl.classList.add("show");
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function passwordStrength(value) {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value) && /[0-9]/.test(value)) score++;
    if (value.length >= 12 && /[^A-Za-z0-9]/.test(value)) score++;
    return Math.min(score, 3);
  }

  passwordInput.addEventListener("input", function () {
    strengthMeter.setAttribute("data-level", String(passwordStrength(passwordInput.value)));
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const companyCode = companyCodeInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmInput.value;
    const role = (form.querySelector('input[name="role"]:checked') || {}).value || "employee";
    let hasError = false;

    if (!name) {
      fieldError(nameInput, errors.name, "Enter your full name.");
      hasError = true;
    }
    if (!email) {
      fieldError(emailInput, errors.email, "Enter your work email.");
      hasError = true;
    } else if (!isValidEmail(email)) {
      fieldError(emailInput, errors.email, "That doesn't look like a valid email.");
      hasError = true;
    }
    if (!companyCode) {
      fieldError(companyCodeInput, errors["company-code"], "Enter your company code.");
      hasError = true;
    }
    if (!password) {
      fieldError(passwordInput, errors.password, "Choose a password.");
      hasError = true;
    } else if (password.length < 8) {
      fieldError(passwordInput, errors.password, "Use at least 8 characters.");
      hasError = true;
    }
    if (confirmPassword !== password || !confirmPassword) {
      fieldError(confirmInput, errors["confirm-password"], "Passwords don't match.");
      hasError = true;
    }
    if (!termsInput.checked) {
      banner.textContent = "You'll need to agree to location tracking for attendance to create an account.";
      banner.classList.add("show");
      hasError = true;
    }
    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating account…";

    // Simulated network delay so the demo feels real; remove when wired to a real API.
    setTimeout(function () {
      try {
        registerUser({ name, email, password, companyCode, role });
        banner.textContent = "Account created — redirecting you to sign in…";
        banner.classList.add("show", "success");
        setTimeout(function () { window.location.href = "login.html"; }, 900);
      } catch (err) {
        banner.textContent = err.message;
        banner.classList.add("show");
        submitBtn.disabled = false;
        submitBtn.textContent = "Create account";
      }
    }, 450);
  });
})();