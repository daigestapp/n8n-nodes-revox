# n8n-nodes-revox

Community nodes for [Revox](https://getrevox.com) that let you place and monitor AI voice calls directly from [n8n](https://n8n.io/).

📚 **[Read the full documentation →](https://docs.getrevox.com/n8n/quickstart)**

Revox is an AI-powered voice calling platform that delivers natural outbound calls, automated follow-ups, and rich call summaries.

## Installation

### Community Nodes (recommended)

1. Open **Settings → Community Nodes** in your n8n instance.
2. Choose **Install** and enter `n8n-nodes-revox`.
3. Confirm the installation and restart (if prompted).

## Credentials

Create **Revox API** credentials in n8n:

1. Visit the Revox dashboard and generate an API key.
2. In n8n, open **Credentials → New** and search for “Revox API”.
3. Paste your API key.
4. Set the base URL if you use a non-default environment (default: `https://getrevox.com/`).

## Nodes & Operations

### Revox (actions)

Perform outbound call operations:

- **Place Call** – create a new AI-powered call and optionally provide a webhook URL for completion events.
- **Get Call** – fetch the latest status and transcript for a specific call.
- **Get Call History** – page through recent calls for analytics or reporting.

Key parameters:

- `phoneNumber` (required) – E.164 formatted phone number, e.g. `+15555555555`.
- `prompt` – custom system prompt for the AI agent.
- `forceNow` – skip scheduling checks and dial immediately.
- `webhookUrl` – where Revox should POST call completion data (normally the output of the trigger node below).

### Revox Trigger (webhook)

Receives call completion payloads from Revox and kicks off downstream automation. The trigger emits:

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

Use the `Filter by Result` parameter to fire only on human pickup, voicemail detection, etc. When the workflow is active or listening for test events, the trigger automatically registers a webhook endpoint. Reference its URL in other nodes using `{{ $node["Revox Trigger"].webhookUrl }}`.

## Example workflows

- **Simple outbound call**  
  `Manual Trigger → Revox (Place Call)`

- **Call with notification**  
  `Manual Trigger → Revox (Place Call) → Slack (Send Message)`

- **Post-call routing**  
  `Revox Trigger → Switch (by result) → [CRM Update | Email | Slack]`

See the `examples/` directory for a full workflow that places a call and processes the webhook response.

## Resources

- [n8n community nodes docs](https://docs.n8n.io/integrations/community-nodes/)
- [Revox n8n Quickstart](https://docs.getrevox.com/n8n/quickstart)
- [Revox API Reference](https://docs.getrevox.com/api-reference)

## Support

Visit [docs.getrevox.com](https://docs.getrevox.com) or email [support@getrevox.com](mailto:support@getrevox.com) for help with the integration.

## License

[MIT](LICENSE)
