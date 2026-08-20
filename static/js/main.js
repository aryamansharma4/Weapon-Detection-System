/* =============================================================
   WDS Core JS
   Shared across every page: mobile nav, theme toggle, toasts,
   confirm dialogs, button loading states, form validation utils.
   Does not talk to the backend — purely presentational behavior
   layered on top of the existing server-rendered forms/routes.
============================================================= */

(function () {
  "use strict";

  /* ---------------- Page fade-in ---------------- */
  document.addEventListener("DOMContentLoaded", function () {
    document.body.classList.add("page-fade");
  });

  /* ---------------- Mobile navigation ---------------- */
  function initMobileNav() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var drawer = document.querySelector("[data-mobile-drawer]");
    if (!toggle || !drawer) return;

    toggle.addEventListener("click", function () {
      var isOpen = drawer.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    drawer.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        drawer.classList.remove("is-open");
        document.body.style.overflow = "";
      });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 900) {
        drawer.classList.remove("is-open");
        document.body.style.overflow = "";
      }
    });
  }

  /* ---------------- Dark / light theme toggle ---------------- */
  function initThemeToggle() {
    var STORAGE_KEY = "wds-theme";
    var root = document.documentElement;
    var stored = null;

    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      stored = null;
    }

    if (stored === "light") {
      root.setAttribute("data-theme", "light");
    }

    var buttons = document.querySelectorAll("[data-theme-toggle]");
    function syncIcons() {
      var isLight = root.getAttribute("data-theme") === "light";
      buttons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", isLight ? "true" : "false");
        var sun = btn.querySelector("[data-icon-sun]");
        var moon = btn.querySelector("[data-icon-moon]");
        if (sun && moon) {
          sun.style.display = isLight ? "none" : "block";
          moon.style.display = isLight ? "block" : "none";
        }
      });
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var isLight = root.getAttribute("data-theme") === "light";
        if (isLight) {
          root.removeAttribute("data-theme");
        } else {
          root.setAttribute("data-theme", "light");
        }
        try {
          localStorage.setItem(STORAGE_KEY, isLight ? "dark" : "light");
        } catch (e) {
          /* localStorage unavailable — theme still toggles for this view */
        }
        syncIcons();
      });
    });

    syncIcons();
  }

  /* ---------------- Toast notifications ---------------- */
  function ensureToastStack() {
    var stack = document.querySelector(".toast-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toast-stack";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    return stack;
  }

  function showToast(message, type) {
    if (!message) return;
    var stack = ensureToastStack();
    var toast = document.createElement("div");
    toast.className = "toast" + (type ? " is-" + type : "");
    toast.innerHTML =
      '<span class="toast-message"></span>' +
      '<button type="button" class="toast-close" aria-label="Dismiss">&times;</button>';
    toast.querySelector(".toast-message").textContent = message;

    function remove() {
      toast.classList.add("is-leaving");
      setTimeout(function () {
        toast.remove();
      }, 200);
    }

    toast.querySelector(".toast-close").addEventListener("click", remove);
    stack.appendChild(toast);
    setTimeout(remove, 5000);
  }

  window.WDS = window.WDS || {};
  window.WDS.showToast = showToast;

  function initFlashToasts() {
    var source = document.getElementById("flash-data");
    if (!source) return;
    var messages = [];
    try {
      messages = JSON.parse(source.textContent || "[]");
    } catch (e) {
      messages = [];
    }
    messages.forEach(function (msg) {
      var isError = /invalid|already exists|do not match|select an image|error|unable/i.test(msg);
      showToast(msg, isError ? "error" : "success");
    });
  }

  /* ---------------- Confirm dialog ---------------- */
  function initConfirmDialogs() {
    var overlay = document.querySelector("[data-confirm-overlay]");
    if (!overlay) return;

    var titleEl = overlay.querySelector("[data-confirm-title]");
    var bodyEl = overlay.querySelector("[data-confirm-body]");
    var confirmBtn = overlay.querySelector("[data-confirm-accept]");
    var cancelBtn = overlay.querySelector("[data-confirm-cancel]");
    var pendingHref = null;

    function open(href, title, body) {
      pendingHref = href;
      if (titleEl) titleEl.textContent = title || "Are you sure?";
      if (bodyEl) bodyEl.textContent = body || "This action cannot be undone.";
      overlay.classList.add("is-open");
    }

    function close() {
      overlay.classList.remove("is-open");
      pendingHref = null;
    }

    document.querySelectorAll("[data-confirm]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        open(
          el.getAttribute("href") || el.getAttribute("data-confirm-href"),
          el.getAttribute("data-confirm-title"),
          el.getAttribute("data-confirm")
        );
      });
    });

    if (cancelBtn) cancelBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        if (pendingHref) window.location.href = pendingHref;
      });
    }
  }

  /* ---------------- Button loading state on submit ---------------- */
  function initFormLoadingStates() {
    document.querySelectorAll("form[data-loading-form]").forEach(function (form) {
      form.addEventListener("submit", function (e) {
        if (form.hasAttribute("data-skip-loading")) return;
        var btn = form.querySelector('[type="submit"]');
        if (!btn) return;
        if (form.checkValidity && !form.checkValidity()) return;
        btn.classList.add("is-loading");
        btn.setAttribute("disabled", "disabled");
      });
    });
  }

  /* ---------------- Active nav link ---------------- */
  function markActiveNav() {
    var path = window.location.pathname;
    document.querySelectorAll("[data-nav-link]").forEach(function (link) {
      var href = link.getAttribute("href");
      if (href && (href === path || (href !== "/" && path.indexOf(href) === 0))) {
        link.classList.add("active");
      }
    });
  }

  /* ---------------- Live clock (dashboard welcome strip) ---------------- */
  function initClock() {
    var el = document.querySelector("[data-clock]");
    if (!el) return;
    function tick() {
      var now = new Date();
      el.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
    tick();
    setInterval(tick, 1000);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initMobileNav();
    initThemeToggle();
    initFlashToasts();
    initConfirmDialogs();
    initFormLoadingStates();
    markActiveNav();
    initClock();
  });
})();
