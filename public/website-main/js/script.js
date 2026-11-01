/**
 * Ora Lodge — site interactions
 * Config · Router · Mobile nav · Gallery reveal ·
 * Header shadow · Form validation · Footer dates
 */
(function () {
  "use strict";

  /* ── Config ─────────────────────────────────────────────── */
  var CONFIG = {
    phone:     "+27764751683",
    email:     "beggymarutla@gmail.com",
    whatsapp:  "27764751683",
    mapsQuery: "Ora Lodge Ga-Masemola Limpopo"
  };

  function fmt(p) { return p.replace(/[^\d+]/g, ""); }

  /* ── Apply config to DOM ─────────────────────────────────── */
  function applyConfig() {
    var phoneEl   = document.getElementById("phone-block");
    var emailEl   = document.getElementById("email-block");
    var waEl      = document.getElementById("whatsapp-block");
    var headerCta = document.getElementById("header-phone-link");
    var dirLink   = document.getElementById("directions-link");
    var waBtn     = document.getElementById("btn-send-whatsapp");

    if (CONFIG.phone && phoneEl) {
      phoneEl.className = "";
      phoneEl.innerHTML = 'Phone: <a class="contact-link" href="tel:' +
        fmt(CONFIG.phone) + '">' + CONFIG.phone + '</a>';
      if (headerCta) headerCta.href = "tel:" + fmt(CONFIG.phone);
    }
    if (CONFIG.email && emailEl) {
      emailEl.className = "";
      emailEl.innerHTML = 'Email: <a class="contact-link" href="mailto:' +
        CONFIG.email + '">' + CONFIG.email + '</a>';
    }
    if (CONFIG.whatsapp && waEl) {
      waEl.className = "";
      waEl.innerHTML = 'WhatsApp: <a class="contact-link" href="https://wa.me/' +
        CONFIG.whatsapp + '" target="_blank" rel="noopener">Chat on WhatsApp</a>';
    } else if (waBtn) {
      waBtn.setAttribute("aria-disabled", "true");
    }
    if (dirLink && CONFIG.mapsQuery) {
      dirLink.href = "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(CONFIG.mapsQuery);
    }
  }

  /* ── Scrolled header shadow ──────────────────────────────── */
  var header  = document.getElementById("site-header");
  var ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(function () {
        if (header) header.classList.toggle("is-scrolled", window.scrollY > 10);
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ── Hero image ken-burns ────────────────────────────────── */
  var heroImg = document.getElementById("hero-img");
  if (heroImg) {
    if (heroImg.complete) {
      heroImg.classList.add("loaded");
    } else {
      heroImg.addEventListener("load", function () {
        heroImg.classList.add("loaded");
      });
    }
  }

  /* ── Mobile nav ──────────────────────────────────────────── */
  var burger   = document.getElementById("nav-burger");
  var navLinks = document.getElementById("nav-links");

  function closeNav() {
    if (!burger || !navLinks) return;
    navLinks.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
    document.body.style.overflow = "";
  }
  function openNav() {
    if (!burger || !navLinks) return;
    navLinks.classList.add("is-open");
    burger.setAttribute("aria-expanded", "true");
    burger.setAttribute("aria-label", "Close menu");
    document.body.style.overflow = "hidden"; /* prevent body scroll */
  }

  if (burger) {
    burger.addEventListener("click", function () {
      var isOpen = navLinks && navLinks.classList.contains("is-open");
      isOpen ? closeNav() : openNav();
    });
  }

  /* Close on link click */
  if (navLinks) {
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeNav();
    });
  }

  /* Close on outside tap */
  document.addEventListener("pointerdown", function (e) {
    if (!navLinks || !navLinks.classList.contains("is-open")) return;
    if (!navLinks.contains(e.target) && !burger.contains(e.target)) closeNav();
  });

  /* Close on Escape */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  /* ── Router ──────────────────────────────────────────────── */
  var ROUTES = {
    "/":              "page-home",
    "/rooms":         "page-rooms",
    "/gallery":       "page-gallery",
    "/about":         "page-about",
    "/contact":       "page-contact",
    "/privacy-policy":"page-privacy",
    "/terms":         "page-terms",
    "/cookies":       "page-cookies"
  };
  var TITLES = {
    "/":              "Ora Lodge — Guest Cottages in Ga-Masemola, Limpopo",
    "/rooms":         "Rooms — Ora Lodge",
    "/gallery":       "Gallery — Ora Lodge",
    "/about":         "About — Ora Lodge",
    "/contact":       "Contact — Ora Lodge",
    "/privacy-policy":"Privacy Policy — Ora Lodge",
    "/terms":         "Terms & Conditions — Ora Lodge",
    "/cookies":       "Cookies Policy — Ora Lodge"
  };

  function currentPath() {
    var h = window.location.hash.replace(/^#/, "");
    return h || "/";
  }

  function render() {
    var path   = currentPath();
    var pageId = ROUTES[path] || "page-404";

    document.querySelectorAll(".page").forEach(function (p) {
      p.classList.remove("active");
    });
    var target = document.getElementById(pageId);
    if (target) target.classList.add("active");

    document.title = TITLES[path] || "Page not found — Ora Lodge";

    /* Active nav link */
    document.querySelectorAll("nav a[data-route]").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-route") === path);
    });

    window.scrollTo({ top: 0, behavior: "instant" });

    /* Re-trigger gallery IO on gallery page */
    if (path === "/gallery") scheduleGalleryReveal();
  }

  window.addEventListener("hashchange", render);

  /* ── Gallery — IntersectionObserver reveal with stagger ──── */
  function scheduleGalleryReveal() {
    var items = document.querySelectorAll(".g-item");
    if (!items.length) return;

    var prefersReduced = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      items.forEach(function (el) { el.classList.add("visible"); });
      return;
    }

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el  = entry.target;
          var idx = parseInt(el.getAttribute("data-gidx") || "0", 10);
          setTimeout(function () { el.classList.add("visible"); }, idx * 80);
          io.unobserve(el);
        });
      }, { threshold: 0.08 });

      items.forEach(function (el, i) {
        el.setAttribute("data-gidx", String(i));
        el.classList.remove("visible");
        io.observe(el);
      });
    } else {
      items.forEach(function (el) { el.classList.add("visible"); });
    }
  }

  /* ── Form: inline validation on blur ────────────────────── */
  var form             = document.getElementById("contact-form");
  var msgSuccess       = document.getElementById("form-success");
  var msgError         = document.getElementById("form-error");
  var msgErrorWhatsapp = document.getElementById("form-error-whatsapp");
  var btnWa            = document.getElementById("btn-send-whatsapp");
  var btnEmail         = document.getElementById("btn-send-email");

  if (form) {
    form.querySelectorAll("input, textarea").forEach(function (el) {
      el.addEventListener("blur", function () {
        el.setAttribute("data-touched", "true");
      });
    });
  }

  function hideMsgs() {
    [msgSuccess, msgError, msgErrorWhatsapp].forEach(function (el) {
      if (el) { el.classList.remove("show", "success", "error"); }
    });
  }
  function showMsg(el, type) {
    if (!el) return;
    el.classList.add("show", type);
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function buildBody() {
    var name  = document.getElementById("f-name");
    var email = document.getElementById("f-email");
    var msg   = document.getElementById("f-message");
    var phone = (document.getElementById("f-phone")  || {}).value || "";
    var dates = (document.getElementById("f-dates")  || {}).value || "";
    return {
      name: name, email: email, message: msg,
      lines: [
        "Name: "   + (name  ? name.value  : ""),
        "Email: "  + (email ? email.value : ""),
        phone ? "Phone: "           + phone : null,
        dates ? "Preferred dates: " + dates : null,
        "",
        msg ? msg.value : ""
      ].filter(Boolean)
    };
  }

  function validate() {
    if (!form) return false;
    form.querySelectorAll("[required]").forEach(function (el) {
      el.setAttribute("data-touched", "true");
    });
    return form.checkValidity();
  }

  function sendEmail() {
    hideMsgs();
    if (!validate()) { showMsg(msgError, "error"); return; }
    var d = buildBody();
    var m = "mailto:" + (CONFIG.email || "") +
            "?subject=" + encodeURIComponent("Enquiry from Ora Lodge website — " + (d.name ? d.name.value : "")) +
            "&body="    + encodeURIComponent(d.lines.join("\n"));
    window.location.href = m;
    if (msgSuccess) msgSuccess.textContent = "Thanks — your message is ready to send in your email app.";
    showMsg(msgSuccess, "success");
    form.reset();
  }

  function sendWhatsapp() {
    hideMsgs();
    if (!CONFIG.whatsapp) { showMsg(msgErrorWhatsapp, "error"); return; }
    if (!validate())      { showMsg(msgError, "error"); return; }
    var d    = buildBody();
    var text = "New enquiry from the Ora Lodge website\n\n" + d.lines.join("\n");
    window.open("https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent(text), "_blank", "noopener");
    if (msgSuccess) msgSuccess.textContent = "Thanks — WhatsApp should open with your message ready to send.";
    showMsg(msgSuccess, "success");
    form.reset();
  }

  if (btnEmail) btnEmail.addEventListener("click", sendEmail);
  if (btnWa)    btnWa.addEventListener("click",    sendWhatsapp);

  /* ── Footer year / legal dates ──────────────────────────── */
  var yearEl = document.getElementById("copyright-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var months = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
  var now    = new Date();
  var fmtDate = months[now.getMonth()] + " " + now.getFullYear();
  document.querySelectorAll("[data-current-date]").forEach(function (el) {
    el.textContent = fmtDate;
  });

  /* ── Init ────────────────────────────────────────────────── */
  applyConfig();
  render();

}());
