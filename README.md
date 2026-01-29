# n8n-nodes-revox

Community nodes for [Revox](https://getrevox.com) — place and manage AI voice calls and assistants from [n8n](https://n8n.io/).

📚 **[Full documentation →](https://docs.getrevox.com/n8n/quickstart)** · **[API Reference](https://docs.getrevox.com/api-reference)**

Revox is an AI-powered voice calling platform: outbound calls, automated follow-ups, and call summaries. This package aligns with the [Revox API](https://docs.getrevox.com/api-reference) and exposes **Calls**, **Assistants**, and a **webhook trigger** for call completion.

---

## Installation

1. In n8n, go to **Settings → Community Nodes**.
2. Click **Install** and enter: `n8n-nodes-revox`.
3. Restart n8n if prompted.

Requires n8n **0.188.0** or higher.

---

## Credentials

Create **Revox API** credentials in n8n:

1. Get an API key from the [Revox Dashboard](https://getrevox.com/dashboard) (**API Keys**).
2. In n8n: **Credentials → Add Credential** → search for **Revox API**.
3. Enter your **API Key**.
4. **Base URL** is optional (default: `https://www.getrevox.com/`).

All requests use Bearer token authentication.

---

## Nodes & Operations

### Revox (action node)

The Revox node has two **resources**. Choose one, then pick an operation.

#### Resource: **Call**

| Operation | Description |
|-----------|-------------|
| **Place Call** | Start a new AI voice call. Use an existing **Assistant ID** or configure inline (prompt, voice, webhook). |
| **Get Call** | Fetch status and details for a call by **Call ID**. |
| **Get Call History** | List calls with pagination (`page` 0-based, `page_size`). |

**Place Call parameters**

- **Phone Number** (required) – E.164 format, e.g. `+15555555555`.
- **Assistant ID** (optional) – If set, Revox uses this assistant; prompt/voice/webhook below are ignored.
- **Prompt** – System prompt for the AI (used when no Assistant ID).
- **Voice** – Choose from list or expression (when no Assistant ID).
- **Webhook URL** – Callback URL for completion events; often `{{ $node["Revox Trigger"].webhookUrl }}`.
- **Force Now** – Bypass time-zone checks and place the call immediately.

**Get Call** – **Call ID** (required).

**Get Call History** – **Page** (0-based), **Page Size** (sent as `page_size` to the API).

#### Resource: **Assistant**

| Operation | Description |
|-----------|-------------|
| **Create** | Create an assistant with name, prompt, optional first sentence, webhook URL, and voice. |
| **List** | Return all assistants. |
| **Get** | Get one assistant by **Assistant ID**. |
| **Update** | Update an assistant’s name and/or prompt by **Assistant ID**. |
| **Delete** | Delete an assistant by **Assistant ID**. |

**Create Assistant** – **Name** (required), **Prompt** (required), **First Sentence**, **Webhook URL**, **Voice** (optional).

**Get / Update / Delete** – **Assistant ID** (required). Update also accepts **Name** and **Prompt**.

---

### Revox Trigger (webhook)

Receives **call completion** webhooks from Revox and starts the workflow.

**Filter by Result** – Only run when the call result matches:

- **All** – Every completion.
- **Human** – Person answered.
- **Voicemail** – Voicemail detected.
- **IVR** – Automated system.

**Webhook URL** – After the workflow is active (or listening for test events), the trigger exposes a URL. Use it in the Revox node (Place Call → Webhook URL) or in the Revox dashboard. In n8n you can reference it with:

```text
{{ $node["Revox Trigger"].webhookUrl }}
```

**Output** – The trigger emits the webhook payload. Example:

```json
{
  "call_order_id": "uuid",
  "call_id": "uuid",
  "status": "completed",
  "result": "human",
  "annotation": "Brief summary",
  "transcript": "Full transcript",
  "recording_url": "https://...",
  "started_at": "2024-01-01T12:00:00Z",
  "ended_at": "2024-01-01T12:05:00Z",
  "calls_count": 1,
  "timestamp": "2024-01-01T12:05:01Z",
  "webhookUrl": "https://your-n8n-host/webhook/..."
}
```

---

## Example Workflows

- **Place a call (inline config)**  
  `Manual Trigger → Revox (Resource: Call, Place Call)` — set phone number, prompt, optional voice and webhook.

- **Place a call with an assistant**  
  `Manual Trigger → Revox (Resource: Call, Place Call)` — set **Assistant ID** (from a previous Create Assistant or dashboard).

- **Notify when a call completes**  
  `Revox Trigger → Revox (Get Call) → Slack (Send Message)` — use trigger webhook URL in Place Call; on completion, fetch call details and post to Slack.

- **Route by result**  
  `Revox Trigger → Switch (by result) → [Human: CRM · Voicemail: Retry · IVR: Log]`.

- **Manage assistants**  
  `Manual Trigger → Revox (Resource: Assistant, Create)` then use the returned assistant ID in Place Call.

More examples are in the `examples/` directory.

---

## Resources

- [Revox n8n Quickstart](https://docs.getrevox.com/n8n/quickstart)
- [Revox API Reference](https://docs.getrevox.com/api-reference)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

---

## Support

- Docs: [docs.getrevox.com](https://docs.getrevox.com)
- Email: [support@getrevox.com](mailto:support@getrevox.com)

## License

[MIT](LICENSE)
