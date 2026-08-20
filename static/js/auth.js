/* =============================================================
   WDS Auth JS (login / signup)
   Client-side validation only. The server still validates and
   is the source of truth — this just gives faster feedback and
   prevents obviously-invalid submits from round-tripping.
============================================================= */

(function () {
  "use strict";

  function setError(field, message) {
    if (!field) return;
    field.classList.toggle("has-error", !!message);
    var errorEl = field.querySelector(".field-error");
    if (errorEl) errorEl.textContent = message || "";
  }

  function closestField(input) {
    return input.closest(".field");
  }

  function initPasswordToggles() {
    document.querySelectorAll("[data-password-toggle]").forEach(function (btn) {
      var targetId = btn.getAttribute("data-password-toggle");
      var input = document.getElementById(targetId);
      if (!input) return;
      btn.addEventListener("click", function () {
        var show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
        btn.classList.toggle("is-visible", show);
      });
    });
  }

  function initSignupValidation() {
    var form = document.querySelector("[data-signup-form]");
    if (!form) return;

    var password = form.querySelector('input[name="password"]');
    var confirm = form.querySelector('input[name="confirmPassword"]');
    var email = form.querySelector('input[name="email"]');

    function validateMatch() {
      if (!password || !confirm || !confirm.value) return true;
      var ok = password.value === confirm.value;
      setError(closestField(confirm), ok ? "" : "Passwords do not match");
      return ok;
    }

    function validateEmail() {
      if (!email) return true;
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value);
      setError(closestField(email), ok || !email.value ? "" : "Enter a valid email address");
      return ok || !email.value;
    }

    function validatePasswordLength() {
      if (!password) return true;
      var ok = password.value.length === 0 || password.value.length >= 6;
      setError(closestField(password), ok ? "" : "Use at least 6 characters");
      return ok;
    }

    if (confirm) confirm.addEventListener("input", validateMatch);
    if (password) password.addEventListener("input", function () {
      validatePasswordLength();
      validateMatch();
    });
    if (email) email.addEventListener("blur", validateEmail);

    form.addEventListener("submit", function (e) {
      var matchOk = validateMatch();
      var emailOk = validateEmail();
      var lenOk = validatePasswordLength();
      if (!matchOk || !emailOk || !lenOk) {
        e.preventDefault();
        var btn = form.querySelector('[type="submit"]');
        if (btn) {
          btn.classList.remove("is-loading");
          btn.removeAttribute("disabled");
        }
      }
    });
  }

  function initLoginValidation() {
    var form = document.querySelector("[data-login-form]");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      var username = form.querySelector('input[name="username"]');
      var password = form.querySelector('input[name="password"]');
      var ok = true;

      if (username && !username.value.trim()) {
        setError(closestField(username), "Username is required");
        ok = false;
      } else if (username) {
        setError(closestField(username), "");
      }

      if (password && !password.value) {
        setError(closestField(password), "Password is required");
        ok = false;
      } else if (password) {
        setError(closestField(password), "");
      }

      if (!ok) {
        e.preventDefault();
        var btn = form.querySelector('[type="submit"]');
        if (btn) {
          btn.classList.remove("is-loading");
          btn.removeAttribute("disabled");
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initPasswordToggles();
    initSignupValidation();
    initLoginValidation();
  });
})();
