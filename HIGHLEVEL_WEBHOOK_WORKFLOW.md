# HighLevel Webhook Workflow (For `index.html` Form)

## 1) Create Workflow
1. Go to `Automation` -> `Workflows`.
2. Click `+ Create Workflow` -> `Start from Scratch`.
3. Name it: `Karter Cascades - Tour Lead Webhook`.

## 2) Add Trigger
1. Click `Add New Trigger`.
2. Choose `Inbound Webhook` (or `Webhook` / `Catch Hook`, depending on UI version).
3. Save trigger.
4. Copy the generated `Webhook URL`.

## 3) Connect Landing Form to Webhook
In [index.html](d:/N8N/Karter/index.html:191), replace:

```html
data-endpoint="/webhook/karter-schools-lead"
```

with your HighLevel webhook URL:

```html
data-endpoint="https://YOUR_HIGHLEVEL_WEBHOOK_URL"
```

## 4) Add Workflow Actions (Recommended Order)
1. `Create/Update Contact`
2. `Add Contact Tag` -> `cascades-tour-lead`
3. `Assign User` (optional, admissions owner)
4. `Send Internal Notification` (email/SMS to your team)
5. `Send SMS` (optional, instant acknowledgment)
6. `Send Email` (optional, confirmation + next steps)

## 5) Field Mapping (From Current Form)
Map these webhook fields into HighLevel contact/custom fields:

- `parent_name`
- `email`
- `phone`
- `child_age_group`
- `preferred_time`
- `timeline`
- `message`
- `consent`
- `preferred_campus`
- `campus_address`
- `campus_phone`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`
- `landing_url`
- `page_title`
- `referrer`
- `submitted_at`

## 6) Create Custom Fields in HighLevel
Before testing, create custom fields for non-standard data:
- Child Age Group
- Preferred Tour Time
- Enrollment Timeline
- Parent Notes
- Consent
- Preferred Campus
- UTM Source / Medium / Campaign / Content / Term
- Landing URL
- Page Title
- Referrer
- Submitted At

## 7) Publish and Test
1. Set workflow to `Publish` (not Draft).
2. Submit 1 real test lead from landing page form.
3. Check:
   - `Execution Logs`
   - Contact created/updated
   - Tag applied
   - Internal notification sent

## 8) Quick Troubleshooting
- If no trigger fires:
  - Confirm `data-endpoint` is production webhook URL.
  - Confirm workflow is published.
  - Confirm no CORS/security block from browser console.
- If trigger fires but fields are empty:
  - Re-check webhook payload keys vs custom field mapping.
- If duplicate contacts:
  - Use email/phone as dedupe keys in `Create/Update Contact`.

## 9) Example Payload (What your form sends)
```json
{
  "parent_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+17035551234",
  "child_age_group": "3-5 years",
  "preferred_time": "Weekday morning",
  "timeline": "Within 30 days",
  "message": "Interested in preschool tour next week.",
  "consent": "yes",
  "preferred_campus": "Cascades",
  "campus_address": "21290 Springlake Ct, Sterling, VA 20166",
  "campus_phone": "+17034308657",
  "utm_source": "facebook",
  "utm_medium": "paid_social",
  "utm_campaign": "cascades_tour_q2",
  "utm_content": "video_a",
  "utm_term": "",
  "landing_url": "https://your-landing-url",
  "page_title": "Karter School of Cascades | Book a Tour in Sterling, VA",
  "referrer": "https://facebook.com/",
  "submitted_at": "2026-04-30T15:40:00.000Z"
}
```
