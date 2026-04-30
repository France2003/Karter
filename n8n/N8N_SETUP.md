# Karter Schools Lead Workflow

Import [karter-schools-lead-workflow.json](/d:/N8N/Karter/n8n/karter-schools-lead-workflow.json) into `n8n`.

## What it does

- Receives `POST` requests at `/webhook/karter-schools-lead`
- Normalizes the landing-page payload
- Validates required fields
- Maps the selected campus to the correct address and phone
- Returns a JSON response to the browser
- Optionally upserts the lead into GoHighLevel if `GHL_API_KEY` is available in the `n8n` environment

## Expected webhook path

The landing page is already wired to:

```text
/webhook/karter-schools-lead
```

If your landing page and `n8n` are on different domains, change the form's `data-endpoint` in [index.html](/d:/N8N/Karter/index.html:305) to the full webhook URL.

Example:

```text
https://automation.yourdomain.com/webhook/karter-schools-lead
```

## GoHighLevel setup

This workflow checks for:

```text
GHL_API_KEY
```

If that env var is present, it attempts to `POST` to:

```text
https://services.leadconnectorhq.com/contacts/upsert
```

If `GHL_API_KEY` is missing, the workflow still accepts the lead and returns success, but skips the GHL sync.

## Recommended next step

After importing, test with a sample payload from the page and confirm:

- webhook receives the lead
- browser gets `200 OK`
- GHL contact is created or updated if the API key is configured
