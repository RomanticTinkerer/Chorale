(function () {
  "use strict";

  var overlay = document.getElementById("site-menu");
  var toggle = document.querySelector(".menu-toggle");
  var year = document.querySelector("[data-year]");
  var EMAIL = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

  function setOpen(open) {
    if (!overlay || !toggle) return;
    overlay.classList.toggle("is-open", open);
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    overlay.toggleAttribute("inert", !open);
    document.body.classList.toggle("menu-open", open);
    if (open) {
      var first = overlay.querySelector("a");
      if (first) first.focus();
    } else {
      toggle.focus();
    }
  }

  if (toggle && overlay) {
    overlay.setAttribute("inert", "");

    toggle.addEventListener("click", function () {
      setOpen(!overlay.classList.contains("is-open"));
    });

    overlay.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) {
        setOpen(false);
      }
    });
  }

  if (year) year.textContent = String(new Date().getFullYear());

  function draftKey(formId) {
    return formId + "-draft";
  }

  function collect(form) {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.disabled) return;
      data[el.name] = el.value;
    });
    return data;
  }

  function fill(form, data) {
    if (!data) return;
    Object.keys(data).forEach(function (name) {
      var field = form.elements.namedItem(name);
      if (field && "value" in field) field.value = data[name];
    });
  }

  function bindDraft(form) {
    var key = draftKey(form.id);
    try {
      fill(form, JSON.parse(window.localStorage.getItem(key) || "null"));
    } catch (err) {
      /* ignore broken drafts */
    }

    form.addEventListener("input", function () {
      window.localStorage.setItem(key, JSON.stringify(collect(form)));
    });
  }

  function messageFor(field) {
    if (!field.value.trim()) {
      if (field.id.indexOf("name") !== -1) return "Enter your full name.";
      if (field.type === "email") return "Enter an email like name@example.com.";
      if (field.tagName === "TEXTAREA") return "Write a short message.";
      return "This field needs a value.";
    }
    if (field.type === "email" && !EMAIL.test(field.value.trim())) {
      return "Enter an email like name@example.com.";
    }
    return "";
  }

  function bindForm(form, success, kind) {
    if (!form || !success) return;

    bindDraft(form);
    var banner = form.querySelector("[data-form-banner]");

    var again = success.querySelector("[data-form-reset]");
    if (again) {
      again.addEventListener("click", function () {
        form.classList.remove("is-sent");
        success.classList.remove("is-shown");
        form.reset();
        if (banner) banner.textContent = "";
        window.localStorage.removeItem(draftKey(form.id));
        var first = form.querySelector("input, textarea");
        if (first) first.focus();
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var valid = true;
      var firstBad = null;
      if (banner) banner.textContent = "";

      form.querySelectorAll("input, textarea").forEach(function (field) {
        if (!field.required && field.type !== "email") return;
        var row = field.closest(".field");
        var err = row ? row.querySelector(".form-error") : null;
        var needsCheck = field.required || (field.type === "email" && field.value.trim());
        if (!needsCheck) {
          if (err) err.textContent = "";
          field.removeAttribute("aria-invalid");
          return;
        }
        var msg = messageFor(field);
        if (msg) {
          valid = false;
          if (!firstBad) firstBad = field;
          if (err) err.textContent = msg;
          field.setAttribute("aria-invalid", "true");
        } else {
          if (err) err.textContent = "";
          field.removeAttribute("aria-invalid");
        }
      });

      if (!valid) {
        if (firstBad) firstBad.focus();
        return;
      }

      var site = window.CHORALE_CONVEX_SITE;
      if (!site) {
        if (banner) banner.textContent = "The form is not connected yet. Try again later.";
        return;
      }

      var btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.setAttribute("aria-busy", "true");
      }

      var entry = collect(form);
      fetch(site.replace(/\/$/, "") + "/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: kind,
          name: entry.name,
          email: entry.email,
          city: entry.city,
          message: entry.message,
        }),
      })
        .then(function (response) {
          return response
            .json()
            .catch(function () {
              return { ok: false, error: "Unable to send this just now. Please try again." };
            })
            .then(function (payload) {
              return { ok: response.ok && payload.ok, error: payload.error };
            });
        })
        .then(function (result) {
          if (!result.ok) {
            if (banner) {
              banner.textContent = result.error || "Unable to send this just now. Please try again.";
            }
            return;
          }
          window.localStorage.removeItem(draftKey(form.id));
          form.classList.add("is-sent");
          success.classList.add("is-shown");
          success.focus();
        })
        .catch(function () {
          if (banner) {
            banner.textContent = "Unable to reach the foundation. Check your connection and try again.";
          }
        })
        .then(function () {
          if (btn) {
            btn.disabled = false;
            btn.removeAttribute("aria-busy");
          }
        });
    });
  }

  bindForm(document.getElementById("join-form"), document.getElementById("join-success"), "join");
  bindForm(document.getElementById("contact-form"), document.getElementById("contact-success"), "contact");
})();
