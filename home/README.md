# My PWA Notes App

A Progressive Web App (PWA) for creating, viewing, and managing notes that work offline.

## Features
- ✍️ Create, view, edit, and delete notes
- 🌐 Works offline (PWA with service worker caching)
- 📱 Installable on mobile and desktop
- 🔄 Automatic updates with user prompt
- 📅 Tracks creation and last edit dates
- 🎯 Accessible modals and interactions

## Development

### Prerequisites
- A web server with HTTPS or use localhost for testing
- Modern browser (Chrome, Edge, Firefox) for PWA features

### Local Development
1. Clone the repository
```bash
git clone https://github.com/yourusername/pwa-notes.git
cd pwa-notes
```

2. Start a local server (choose one):
```bash
# Using Python (Python 3)
python -m http.server 8000

# Using Node.js
npx http-server
```

3. Open http://localhost:8000 in your browser

### Testing Service Worker Updates
1. Make changes to the app
2. Increment `CACHE_NAME` version in `sw.js`
3. Refresh the page - you'll see an update banner
4. Click "Refresh" to activate the new version

## Deployment

### GitHub Pages
This repository is configured to automatically deploy to GitHub Pages using GitHub Actions.

1. Fork this repository
2. Go to Settings → Pages
3. Set Source to "GitHub Actions"
4. The workflow in `.github/workflows/deploy.yml` will handle the rest

### Manual Deployment
You can deploy to any static hosting service that supports:
- HTTPS (required for service workers)
- Proper MIME types
- URL rewriting (for SPA support)

Popular options:
- Netlify
- Vercel
- Azure Static Web Apps

### Configuration Files
- `manifest.json`: PWA configuration and icons
- `sw.js`: Service Worker for offline support
- `offline.html`: Offline fallback page

## Security Considerations
When deploying, ensure:
1. HTTPS is enabled (required for service workers)
2. Proper security headers are set:
   ```
   Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   Strict-Transport-Security: max-age=31536000; includeSubDomains
   ```

## Browser Support
- Chrome/Edge/Opera: Full PWA support
- Firefox: PWA support (some features limited)
- Safari: Basic PWA support
- iOS Safari: Home screen installation supported

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License
MIT License - See LICENSE file for details
