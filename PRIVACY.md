# TabDav Privacy Policy

Last updated: January 2025

## Data Collection

TabDav is a local-first browser extension that stores all data locally on your device. We do NOT collect, transmit, or store any personal data on external servers.

## Local Storage

- All tab data is stored locally in your browser's IndexedDB
- WebDav credentials (if configured) are stored locally using XOR encryption
- Settings and preferences are stored locally

## WebDav Sync (Optional)

When you enable WebDav synchronization:
- Your tab data is transmitted directly between your browser and your configured WebDav server
- We do not intercept, store, or process this data
- Your WebDav server's privacy policy applies to data stored there

## Permissions

TabDav requests the following permissions:

- **tabs**: To read tab information when you choose to collect tabs
- **storage**: To store your settings and tab data locally
- **alarms**: To schedule automatic synchronization
- **contextMenus**: To add right-click menu options
- **webRequest**: Required for WebDav HTTP requests
- **Host permissions**: To access all URLs for tab collection and WebDav sync

## Third-Party Services

TabDav does not use any third-party analytics, advertising, or tracking services.

## Changes to This Policy

We may update this privacy policy occasionally. Any changes will be reflected in the extension's documentation.

## Contact

For questions about this privacy policy, please open an issue at:
https://github.com/HatBoy/TabDav/issues
