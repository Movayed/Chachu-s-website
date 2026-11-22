/* Global Communication Lmtd — site behaviour
   No dependencies. Everything degrades gracefully without JS. */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- sticky header ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- mobile navigation ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const drawer = document.querySelector(".nav__drawer");
  if (toggle && drawer) {
    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      drawer.dataset.open = "false";
    };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      drawer.dataset.open = String(!open);
    });
    drawer.addEventListener("click", (e) => {
      if (e.target.closest("a")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.dataset.open === "true") {
        close();
        toggle.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 940) close();
    });
  }

  /* ---------- mark the current page in the nav ---------- */
  const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav__links a, .nav__drawer a").forEach((link) => {
    const target = (link.getAttribute("href") || "").split("#")[0].toLowerCase();
    if (target && target === here) link.setAttribute("aria-current", "page");
  });

  /* ---------- reveal on scroll ---------- */
  const revealables = document.querySelectorAll(".reveal");
  if (revealables.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealables.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      revealables.forEach((el, i) => {
        el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
        io.observe(el);
      });
    }
  }

  /* ---------- count-up stats ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const runCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const prefix = el.dataset.prefix || "";
    if (reduceMotion) {
      el.textContent = prefix + target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(target * eased);
      el.textContent = prefix + value + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCount);
    } else {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              runCount(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.4 }
      );
      counters.forEach((el) => cio.observe(el));
    }
  }

  /* ---------- footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- forms ---------- */
  const showStatus = (form, message, state) => {
    const box = form.querySelector(".form-status");
    if (!box) return;
    box.dataset.state = state || "success";
    box.querySelector("[data-status-text]").textContent = message;
    box.classList.add("is-visible");
    box.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
  };

  const validateField = (input) => {
    const field = input.closest(".field");
    if (!field) return true;
    const errorEl = field.querySelector(".field__error");
    let message = "";

    if (input.type === "checkbox" && input.required && !input.checked) {
      message = input.dataset.requiredMessage || "Please tick this box to continue.";
    } else if (input.required && !input.value.trim()) {
      message = input.dataset.requiredMessage || "Please fill this in.";
    } else if (input.type === "email" && input.value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value)) {
      message = "Enter a valid email address.";
    } else if (input.type === "tel" && input.value && input.value.replace(/[^\d]/g, "").length < 7) {
      message = "Enter a valid phone number.";
    } else if (input.dataset.minlength && input.value.length < Number(input.dataset.minlength)) {
      message = "Please use at least " + input.dataset.minlength + " characters.";
    }

    field.classList.toggle("is-invalid", Boolean(message));
    if (errorEl) errorEl.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  };

  document.querySelectorAll("form[data-validate]").forEach((form) => {
    const fields = form.querySelectorAll("input, select, textarea");

    fields.forEach((input) => {
      input.addEventListener("blur", () => validateField(input));
      input.addEventListener("input", () => {
        const field = input.closest(".field");
        if (field && field.classList.contains("is-invalid")) validateField(input);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let firstInvalid = null;
      fields.forEach((input) => {
        if (!validateField(input) && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        showStatus(form, "Almost there — please check the highlighted fields.", "error");
        firstInvalid.focus();
        return;
      }

      const success = form.dataset.success || "Thanks — your request has been received.";
      const submit = form.querySelector('button[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.dataset.label = submit.textContent;
        submit.textContent = "Sending…";
      }

      window.setTimeout(() => {
        showStatus(form, success, "success");
        form.reset();
        if (submit) {
          submit.disabled = false;
          submit.textContent = submit.dataset.label || "Send";
        }
      }, 700);
    });
  });

  /* ---------- auth tabs ---------- */
  const tabs = document.querySelectorAll("[data-tab]");
  if (tabs.length) {
    const panels = document.querySelectorAll("[data-panel]");
    const activate = (name) => {
      tabs.forEach((tab) => {
        const on = tab.dataset.tab === name;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.panel !== name;
      });
      const panel = document.querySelector('[data-panel="' + name + '"]');
      if (panel) {
        const first = panel.querySelector("input");
        if (first) window.setTimeout(() => first.focus(), 60);
      }
    };
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => activate(tab.dataset.tab));
      tab.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();
          const list = Array.from(tabs);
          const i = list.indexOf(tab);
          const next = list[(i + (e.key === "ArrowRight" ? 1 : list.length - 1)) % list.length];
          next.focus();
          activate(next.dataset.tab);
        }
      });
    });
    document.querySelectorAll("[data-switch-to]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        activate(link.dataset.switchTo);
      });
    });
  }

  /* ---------- password visibility ---------- */
  document.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      btn.textContent = showing ? "Show" : "Hide";
      btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
  });

  /* ---------- payment summary ---------- */
  const planSelect = document.querySelector("[data-plan-select]");
  if (planSelect) {
    const plans = {
      launch: { name: "Launch", price: 2500 },
      growth: { name: "Growth", price: 8000 },
      enterprise: { name: "Enterprise", price: 15000 },
    };
    const outName = document.querySelector("[data-summary-plan]");
    const outAmount = document.querySelector("[data-summary-total]");
    const outVat = document.querySelector("[data-summary-vat]");
    const outLine = document.querySelector("[data-summary-amount]");
    const money = (n) => "$" + n.toLocaleString("en-US");
    const update = () => {
      const plan = plans[planSelect.value] || plans.launch;
      const vat = Math.round(plan.price * 0.05);
      if (outName) outName.textContent = plan.name + " campaign deposit";
      if (outLine) outLine.textContent = money(plan.price);
      if (outVat) outVat.textContent = money(vat);
      if (outAmount) outAmount.textContent = money(plan.price + vat);
    };
    planSelect.addEventListener("change", update);
    const planForm = planSelect.closest("form");
    if (planForm) planForm.addEventListener("reset", () => window.setTimeout(update, 0));
    update();
  }
})();
