
(function () {
  "use strict";

  /* ============================================================
     STORAGE LAYER (demo only)
     Replace authenticate() with a real API call, e.g.:

       async function authenticate(email, password) {
         const res = await fetch('/api/auth/login', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ email, password })
         });
         if (!res.ok) throw new Error((await res.json()).message || 'Invalid credentials');
         return res.json(); // { token, user }
       }

     and store the returned session token instead of writing
     officepulse_session to localStorage directly.
     ============================================================ */
  const USERS_KEY = "officepulse_users_v1";
  const SESSION_KEY = "officepulse_session";

  function loadUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
    catch (e) { return []; }
  }

  function authenticate(email, password) {
    const users = loadUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.password !== password) {
      throw new Error("That email and password don't match our records.");
    }
    return user;
  }

  function seedDemoAccountIfEmpty() {
    const users = loadUsers();
    if (users.length > 0) return;
    localStorage.setItem(USERS_KEY, JSON.stringify([
      { id: "emp_001", name: "Jordan Lee", email: "jordan@company.com", password: "password123", role: "employee" },
    ]));
  }
  seedDemoAccountIfEmpty();

  /* ============================================================
     FORM HANDLING
     ============================================================ */
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const submitBtn = document.getElementById("submit-btn");
  const banner = document.getElementById("form-banner");

  function clearErrors() {
    [emailInput, passwordInput].forEach((el) => el.classList.remove("has-error"));
    [emailError, passwordError].forEach((el) => { el.classList.remove("show"); el.textContent = ""; });
    banner.classList.remove("show");
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

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let hasError = false;

    if (!email) {
      fieldError(emailInput, emailError, "Enter your work email.");
      hasError = true;
    } else if (!isValidEmail(email)) {
      fieldError(emailInput, emailError, "That doesn't look like a valid email.");
      hasError = true;
    }
    if (!password) {
      fieldError(passwordInput, passwordError, "Enter your password.");
      hasError = true;
    }
    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Signing in…";

    // Simulated network delay so the demo feels real; remove when wired to a real API.
    setTimeout(function () {
      try {
        const user = authenticate(email, password);
        localStorage.setItem(SESSION_KEY, JSON.stringify({
          userId: user.id, name: user.name, email: user.email, role: user.role,
        }));
        submitBtn.textContent = "Signed in ✓";
        window.location.href = "index.html";
      } catch (err) {
        banner.textContent = err.message;
        banner.classList.add("show");
        submitBtn.disabled = false;
        submitBtn.textContent = "Sign in";
      }
    }, 450);
  });

  document.getElementById("forgot-link").addEventListener("click", function (e) {
    e.preventDefault();
    banner.textContent = "Password reset isn't wired up in this demo — hook this link to your real reset flow.";
    banner.classList.add("show");
  });
})();
