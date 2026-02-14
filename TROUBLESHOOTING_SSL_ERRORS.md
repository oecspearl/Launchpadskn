# Troubleshooting SSL Certificate Errors (ERR_CERT_AUTHORITY_INVALID)

## Problem
You're seeing `ERR_CERT_AUTHORITY_INVALID` errors when trying to connect to Supabase. This prevents authentication, data fetching, and other Supabase operations.

## Common Causes

### 1. Corporate Firewall/Proxy
If you're on a corporate network, the firewall or proxy may be intercepting HTTPS connections and using its own certificate.

**Solutions:**
- Contact your IT department to whitelist `*.supabase.co` domains
- Ask for the corporate root certificate and install it in your browser
- Use a VPN or personal network if allowed by company policy

### 2. Local Development Proxy
If you're using a local proxy or development server that uses self-signed certificates.

**Solutions:**
- Disable the proxy for Supabase URLs
- Configure your proxy to use valid SSL certificates
- Use direct connection to Supabase (no proxy)

### 3. Browser Security Settings
Your browser may have strict SSL validation enabled.

**Solutions:**
- Check browser security settings
- Try a different browser
- Clear browser cache and cookies

### 4. Incorrect Supabase URL
The Supabase URL might be misconfigured.

**Check:**
1. Open `frontend/.env` or `frontend/.env.local`
2. Verify `VITE_SUPABASE_URL` is correct
3. Ensure it starts with `https://` (not `http://`)
4. The URL should be: `https://[your-project-id].supabase.co`

### 5. Network Security Software
Antivirus or security software may be blocking/intercepting connections.

**Solutions:**
- Temporarily disable to test
- Add Supabase domains to whitelist
- Configure security software to allow Supabase connections

## Quick Checks

1. **Verify Supabase URL:**
   ```bash
   # Check your .env file
   cat frontend/.env | grep VITE_SUPABASE_URL
   ```

2. **Test Supabase Connection:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to login
   - Check if requests to `*.supabase.co` are being blocked

3. **Check Browser Console:**
   - Look for specific error messages
   - Note which requests are failing

## Development Workaround (NOT for Production)

If you're in local development and need a temporary workaround:

**⚠️ WARNING: This is ONLY for local development. Never use in production!**

1. **Chrome/Edge:**
   - Type `chrome://flags/#allow-insecure-localhost` in address bar
   - Enable "Allow invalid certificates for resources loaded from localhost"

2. **Firefox:**
   - Go to `about:config`
   - Search for `security.tls.insecure_fallback_hosts`
   - Add your Supabase project URL

**Note:** These workarounds reduce security and should only be used in isolated development environments.

## Production Solutions

For production deployments:

1. **Verify Supabase Project:**
   - Check Supabase dashboard
   - Ensure project is active and not paused
   - Verify API keys are correct

2. **Check Deployment Platform:**
   - Heroku, Vercel, Netlify all use valid SSL certificates
   - If deploying, ensure environment variables are set correctly

3. **Network Configuration:**
   - Ensure production server can reach Supabase
   - Check firewall rules allow outbound HTTPS to `*.supabase.co`

## Getting Help

If none of these solutions work:

1. Check Supabase Status: https://status.supabase.com
2. Review Supabase Documentation: https://supabase.com/docs
3. Check Supabase Community: https://github.com/supabase/supabase/discussions

## Common Error Messages

- `ERR_CERT_AUTHORITY_INVALID` - Certificate authority not trusted
- `ERR_CERT_COMMON_NAME_INVALID` - Certificate doesn't match domain
- `ERR_SSL_PROTOCOL_ERROR` - SSL handshake failed
- `Failed to fetch` - Network error (often related to SSL)

All of these typically indicate SSL/certificate issues.

