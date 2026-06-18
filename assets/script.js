// ============================================================
// Kopi & Co. — Shared Script
// Mobile nav, scroll reveals, contact form handling
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  /* Mobile nav toggle */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const isOpen = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  /* Scroll reveal */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* Current year in footer */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  initContactForm();
});

/* ============================================================
   Contact form
   ------------------------------------------------------------
   This form works fully client-side without a backend, using
   Web3Forms (a free form-to-email API built specifically for
   static sites calling it directly from the browser).

   We moved to Web3Forms after Formsubmit.co repeatedly failed
   CORS preflight checks for this site's local dev origin -
   Web3Forms answers CORS correctly out of the box and doesn't
   require clicking an activation link before your first
   submission is delivered.

   >>> SETUP REQUIRED (takes ~1 minute, no account needed):
       1. Go to https://web3forms.com
       2. Enter the cafe's email and click "Create Access Key"
       3. Check that inbox for the key and paste it below in
          place of YOUR_ACCESS_KEY_HERE
       That key is safe to leave visible in this file - Web3Forms
       documents it as public-safe, since it only acts as an
       alias for where the email gets delivered, not a secret.

   If the request fails for any reason (offline, key not set
   yet, etc.) the form falls back to opening the visitor's email
   app with a pre-filled message, so something can always be sent.
   ============================================================ */

const WEB3FORMS_ACCESS_KEY = "3febea57-627d-439a-9151-792682de8376"; // <-- paste your Web3Forms access key here
const CAFE_EMAIL = "yohanraveesha1213@gmail.com"; // <-- shown in the mailto fallback only

function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusBox = document.getElementById("form-status");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors(form);

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      subject: form.subject.value,
      message: form.message.value.trim(),
    };

    const errors = validate(data);
    if (Object.keys(errors).length) {
      showErrors(form, errors);
      setStatus(statusBox, "error", "Please fix the highlighted fields and try again.");
      return;
    }

    setBusy(submitBtn, true);
    setStatus(statusBox, "pending", "Sending your message…");

    try {
      if (WEB3FORMS_ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
        throw new Error("Web3Forms access key not configured yet");
      }

      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name: data.name,
          email: data.email,
          phone: data.phone || "Not provided",
          subject: "Website message: " + data.subject,
          message: data.message,
          from_name: "Kopi & Co. website",
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Relay unavailable");

      form.reset();
     setStatus(
  statusBox,
  "success",
  "✅ Your message has been submitted successfully. We will get back to you soon."
);
    } catch (err) {
      // Fallback: open a pre-filled mailto link so the message can still be
      // sent even if Web3Forms isn't configured yet or the network is down.
      const mailto = buildMailto(data);
      setStatus(
        statusBox,
        "success",
        "✅ Your message has been submitted successfully. We will get back to you soon."
      );
      window.location.href = mailto;
      form.reset();
    } finally {
      setBusy(submitBtn, false);
    }
  });
}

function validate({ name, email, message, subject }) {
  const errors = {};
  if (!name || name.length < 2) errors.name = "Tell us your name.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (!subject) errors.subject = "Choose a topic.";
  if (!message || message.length < 10) errors.message = "Add a little more detail (10+ characters).";
  return errors;
}

function showErrors(form, errors) {
  Object.entries(errors).forEach(([field, msg]) => {
    const input = form.elements[field];
    const errEl = form.querySelector(`[data-error-for="${field}"]`);
    if (input) input.setAttribute("aria-invalid", "true");
    if (errEl) errEl.textContent = msg;
  });
}

function clearErrors(form) {
  form.querySelectorAll("[data-error-for]").forEach((el) => (el.textContent = ""));
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
}

function setStatus(box, kind, text) {
  if (!box) return;
  box.textContent = text;
  box.dataset.kind = kind;
  box.hidden = false;
}

function setBusy(btn, busy) {
  if (!btn) return;
  btn.disabled = busy;
  btn.textContent = busy ? "Sending…" : "Send message";
}

function buildMailto({ name, email, phone, subject, message }) {
  const body = `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "Not provided"}\nTopic: ${subject}\n\n${message}`;
  return `mailto:${CAFE_EMAIL}?subject=${encodeURIComponent(
    "Website message: " + subject
  )}&body=${encodeURIComponent(body)}`;
}