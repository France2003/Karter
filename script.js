(function () {
  const form = document.querySelector(".lead-form");
  const status = document.querySelector(".form-status");
  const successCard = document.querySelector("#form-success-card");
  const ctas = document.querySelectorAll(".js-track-cta");
  const reviewSlider = document.querySelector(".review-slider");
  const reviewTrack = reviewSlider?.querySelector(".review-grid");
  const reviewPrevButton = document.querySelector('[data-review-nav="prev"]');
  const reviewNextButton = document.querySelector('[data-review-nav="next"]');
  const url = new URL(window.location.href);
  const utmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  function pushEvent(eventName, payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...payload,
    });

    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
    }
  }

  function trackGenerateLead() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "generate_lead",
      event_category: "form",
      event_label: "landing_page",
    });

    if (typeof window.gtag === "function") {
      window.gtag("event", "generate_lead", {
        event_category: "form",
        event_label: "landing_page",
      });
    }
  }

  function setStatus(message, kind) {
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.remove("is-success", "is-error");

    if (kind) {
      status.classList.add(kind === "success" ? "is-success" : "is-error");
    }
  }

  function setSuccessCard(visible) {
    if (!successCard) {
      return;
    }
    successCard.classList.toggle("hidden", !visible);
  }

  function getReviewStep() {
    if (!reviewTrack) {
      return 0;
    }

    const firstCard = reviewTrack.querySelector(".review-card");
    if (!firstCard) {
      return 0;
    }

    const styles = window.getComputedStyle(reviewTrack);
    const gap = parseFloat(styles.columnGap || styles.gap || "0");
    return firstCard.getBoundingClientRect().width + gap;
  }

  function updateReviewNav() {
    if (!reviewSlider || !reviewPrevButton || !reviewNextButton) {
      return;
    }

    const maxScrollLeft = reviewSlider.scrollWidth - reviewSlider.clientWidth;
    reviewPrevButton.disabled = reviewSlider.scrollLeft <= 8;
    reviewNextButton.disabled = reviewSlider.scrollLeft >= maxScrollLeft - 8;
  }

  function setupReviewSlider() {
    if (!reviewSlider || !reviewTrack || !reviewPrevButton || !reviewNextButton) {
      return;
    }

    function scrollReviews(direction) {
      const step = getReviewStep();
      if (!step) {
        return;
      }

      reviewSlider.scrollBy({
        left: direction * step,
        behavior: "smooth",
      });
    }

    reviewPrevButton.addEventListener("click", () => scrollReviews(-1));
    reviewNextButton.addEventListener("click", () => scrollReviews(1));
    reviewSlider.addEventListener("scroll", updateReviewNav, { passive: true });
    window.addEventListener("resize", updateReviewNav);
    updateReviewNav();
  }

  function fillTrackingFields() {
    if (!form) {
      return;
    }

    utmFields.forEach((name) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (input) {
        input.value = url.searchParams.get(name) || "";
      }
    });

    const metaFields = {
      landing_url: window.location.href,
      page_title: document.title,
      referrer: document.referrer || "",
      submitted_at: "",
    };

    Object.entries(metaFields).forEach(([name, value]) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (input) {
        input.value = value;
      }
    });
  }

  function setFieldError(field, message) {
    field.setCustomValidity(message);
    field.reportValidity();
    field.focus();
  }

  function clearFieldErrors(formElement) {
    formElement.querySelectorAll("input, select, textarea").forEach((field) => {
      field.setCustomValidity("");
    });
  }

  function initializeFormConstraints() {
    if (!form) {
      return;
    }

    const dateInput = form.querySelector('[name="preferred_date"]');
    if (dateInput) {
      const now = new Date();
      const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      dateInput.min = localDate;
    }
  }

  function serializeForm(formElement) {
    const formData = new FormData(formElement);
    const payload = {};

    formData.forEach((value, key) => {
      payload[key] = value;
    });

    return payload;
  }

  function formatNationalPhone(digits, countryCode) {
    if (countryCode === "+1" && digits.length === 10) {
      return `+1 ${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }

    if (countryCode === "+84") {
      if (digits.startsWith("84")) {
        digits = digits.slice(2);
      } else if (digits.startsWith("0")) {
        digits = digits.slice(1);
      }
      return `+84 ${digits}`;
    }

    return `${countryCode} ${digits}`;
  }

  function normalizePhonePayload(payload) {
    const rawPhone = String(payload.phone || "").trim();
    const countryCode = String(payload.phone_country_code || "+1").trim();

    if (!rawPhone) {
      return payload;
    }

    if (rawPhone.startsWith("+")) {
      payload.phone = rawPhone.replace(/[^\d+]/g, "");
      return payload;
    }

    const digits = rawPhone.replace(/\D/g, "");
    if (!digits) {
      return payload;
    }

    payload.phone = formatNationalPhone(digits, countryCode);
    return payload;
  }

  function validate(formElement) {
    clearFieldErrors(formElement);
    const requiredFields = formElement.querySelectorAll("[required]");

    for (const field of requiredFields) {
      const isCheckbox = field.type === "checkbox";
      const missingValue = isCheckbox ? !field.checked : !field.value.trim();

      if (missingValue) {
        const message = isCheckbox
          ? "Please confirm consent before submitting."
          : `Please complete the ${field.closest("label")?.querySelector("span")?.textContent?.trim() || field.name} field.`;
        setFieldError(field, message);
        return { ok: false, message };
      }
    }

    const emailField = formElement.querySelector('[name="email"]');
    if (emailField && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim())) {
      const message = "Please enter a valid email address.";
      setFieldError(emailField, message);
      return { ok: false, message };
    }

    const phoneField = formElement.querySelector('[name="phone"]');
    if (phoneField) {
      const digits = phoneField.value.replace(/\D/g, "");
      if (digits.length < 7) {
        const message = "Please enter a valid phone number.";
        setFieldError(phoneField, message);
        return { ok: false, message };
      }
    }

    const dateField = formElement.querySelector('[name="preferred_date"]');
    if (dateField && dateField.min && dateField.value && dateField.value < dateField.min) {
      const message = "Please choose a tour date that is today or later.";
      setFieldError(dateField, message);
      return { ok: false, message };
    }

    const timeField = formElement.querySelector('[name="preferred_time"]');
    if (timeField && !timeField.value) {
      const message = "Please choose a preferred tour time.";
      setFieldError(timeField, message);
      return { ok: false, message };
    }

    return { ok: true };
  }

  async function postLead(payload) {
    const endpoint = (form.dataset.endpoint || form.getAttribute("action") || "").trim();

    if (!endpoint) {
      return { ok: true, simulated: true };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Submission failed with status ${response.status}`);
    }

    return { ok: true, simulated: false };
  }

  ctas.forEach((cta) => {
    cta.addEventListener("click", () => {
      pushEvent("karter_cta_click", {
        cta_name: cta.dataset.cta || cta.textContent.trim(),
        page_path: window.location.pathname,
      });
    });
  });

  fillTrackingFields();
  initializeFormConstraints();
  setupReviewSlider();

  pushEvent("karter_page_view", {
    page_path: window.location.pathname,
    page_title: document.title,
    utm_source: url.searchParams.get("utm_source") || "",
    utm_medium: url.searchParams.get("utm_medium") || "",
    utm_campaign: url.searchParams.get("utm_campaign") || "",
  });

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("", "");
    setSuccessCard(false);

    const validation = validate(form);
    if (!validation.ok) {
      setStatus(validation.message || "Please complete all required fields before submitting.", "error");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const originalLabel = submitButton.textContent;
    const submittedAt = form.querySelector('[name="submitted_at"]');

    if (submittedAt) {
      submittedAt.value = new Date().toISOString();
    }

    const payload = normalizePhonePayload(serializeForm(form));

    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    try {
      const result = await postLead(payload);

      window.localStorage.setItem("karter_last_lead", JSON.stringify(payload));

      pushEvent("karter_lead_submitted", {
        preferred_campus: payload.preferred_campus || "",
        child_age_group: payload.child_age_group || "",
        timeline: payload.timeline || "",
        utm_source: payload.utm_source || "",
        utm_medium: payload.utm_medium || "",
        utm_campaign: payload.utm_campaign || "",
        simulated: result.simulated ? "true" : "false",
      });

      setStatus(
        result.simulated
          ? "Lead captured locally. Add your webhook endpoint to make the form submit live."
          : "Thanks. Your tour request was submitted successfully.",
        "success"
      );
      setTimeout(trackGenerateLead, 300);
      setSuccessCard(true);
      successCard?.scrollIntoView({ behavior: "smooth", block: "nearest" });

      form.reset();
      fillTrackingFields();
    } catch (error) {
      setStatus("The form could not be submitted. Check the endpoint configuration and try again.", "error");
      pushEvent("karter_lead_submit_error", {
        message: error.message,
      });
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  });
})();
