# System Font Styles

[Grainery](https://github.com/jayrenteria/grainery) plugin that applies installed system font variants, common text sizes, and block alignment through Grainery's plugin UI.

## Capabilities

- Uses `ui:mount` for a bottom-bar button and side panel.
- Uses `system:fonts` to request installed font family and variant metadata.
- Uses `document:read` and `document:write` to apply marks to the selected text.
- Keeps the active custom font visible in the Matches list as the editor selection changes.
- Falls back to a platform sans-serif in the editor and built-in Helvetica in PDF when a custom font is unavailable.

The core app owns the TipTap schema marks and the permission-gated system font host call. This plugin owns the user-facing controls.

## Develop and package

This repository is checked out as `examples/plugins/system-font-styles` in the Grainery repository. Run these commands from the Grainery repository root:

```bash
npm run plugin:validate -- examples/plugins/system-font-styles --check-entry
npm run plugin:pack -- examples/plugins/system-font-styles
npm run plugin:check-archive -- examples/plugins/system-font-styles/system-font-styles.grainery-plugin.zip
```

Then sideload `system-font-styles.grainery-plugin.zip` from Settings > Plugins and grant `ui:mount` and `system:fonts`.
