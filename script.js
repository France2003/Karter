(function () {
  const form = document.querySelector(".lead-form");
  const status = document.querySelector(".form-status");
  const successCard = document.querySelector("#form-success-card");
  const sheetEndpoint =
    "https://script.google.com/macros/s/AKfycbzaKDdaExKDzNQWz_ZteORowhFYsHOFhZKbLlYuq9vLVd8wkK2t1tTFt9Q0YB7OKMHS2Q/exec";
  const ctas = document.querySelectorAll(".js-track-cta");
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
    const requiredFields = formElement.querySelectorAll("[required]");

    for (const field of requiredFields) {
      const isCheckbox = field.type === "checkbox";
      const missingValue = isCheckbox ? !field.checked : !field.value.trim();

      if (missingValue) {
        field.focus();
        return false;
      }
    }

    return true;
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

  async function postLeadToSheet(payload) {
    if (!sheetEndpoint) {
      return;
    }

    await fetch(sheetEndpoint, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
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

    if (!validate(form)) {
      setStatus("Please complete all required fields before submitting.", "error");
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
      await postLeadToSheet(payload);

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
