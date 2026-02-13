# Twilio Configuration for Vercel

## Copy these values to Vercel Environment Variables

1. Go to: <https://vercel.com/rene-marrero-s-projects/bo/settings/environment-variables>

2. Add these environment variables:

### TWILIO_ACCOUNT_SID

```
US106bb0c2103e683e1613dc5f3bed74a3
```

### TWILIO_AUTH_TOKEN

```
[PASTE YOUR AUTH TOKEN HERE]
```

## Important Notes

- Set these for **Production**, **Preview**, and **Development** environments
- After adding, redeploy the app for changes to take effect
- Keep Auth Token secret - never commit to git

## Testing

Once deployed, your webhook URL will be:

```
https://bo-9yga6fi5d-rene-marrero-s-projects.vercel.app/api/webhooks/twilio
```

You'll configure this URL in your Twilio console.
