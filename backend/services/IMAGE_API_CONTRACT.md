# Product image analysis adapter

The V1 frontend can select and preview a real product image locally. It does not
send the file to this backend yet. Remote recognition must stay disabled until a
provider contract and privacy policy are confirmed.

## Required configuration

Keep provider credentials in `backend/.env` only. Never use a `VITE_*` variable
for a secret. The planned adapter reads:

- `IMAGE_ANALYSIS_ENABLED`
- `IMAGE_ANALYSIS_PROVIDER`
- `IMAGE_ANALYSIS_ENDPOINT`
- `IMAGE_ANALYSIS_API_KEY`

## Information needed before integration

1. Endpoint URL and HTTP method.
2. Authentication header format.
3. Request format: `multipart/form-data`, base64 JSON, or a temporary object URL.
4. A complete success and error response example.
5. Provider retention, training-use, deletion, and regional-processing policy.

## Normalized StyleOS result

The provider response will be normalized on the server before it reaches the
browser. The frontend should receive only structured product attributes:

```json
{
  "category": "outerwear",
  "colors": [{ "id": "charcoal", "confidence": 0.92 }],
  "fit": "relaxed",
  "fabricHints": ["wool-blend"],
  "styleKeywords": ["clean-fit", "minimal"],
  "confidence": 0.86,
  "warnings": []
}
```

The image must not be stored in decision history. When remote analysis is
enabled, the UI must ask the user to actively authorize that specific send,
name the receiving provider, and show the applicable retention period.
