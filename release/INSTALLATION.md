# DevForge Extension Installation Guide

## Quick Start

This folder contains the **devforge-extension-0.0.1.vsix** file — a packaged VS Code extension ready for installation.

### Installation Steps

1. **Download** `devforge-extension-0.0.1.vsix` from this folder

2. **Open VS Code**

3. **Open the Extensions panel**
   - Windows/Linux: `Ctrl+Shift+X`
   - macOS: `Cmd+Shift+X`

4. **Click the three-dot menu** (⋯) at the top of the Extensions panel

5. **Select "Install from VSIX"**

6. **Browse and select** the `devforge-extension-0.0.1.vsix` file

7. **Reload VS Code** when prompted

### Verify Installation

After installation, you should see:
- **DevForge** extension listed in your Extensions panel
- A **rocket icon** in the VS Code Activity Bar (left sidebar)
- The DevForge panel opens when you click the icon

### First Steps

1. Open the `sample-project/index.js` file from the repository
2. Click the DevForge icon in the Activity Bar
3. The extension will automatically analyze the code
4. Explore the different tabs:
   - **Developer Mode**: Live Map, Drift Detection, Scale Predictor, Cost Analysis
   - **Student Mode**: Mentor Chat, Pattern Detection, Skills Tracking

### Troubleshooting

**Extension doesn't appear after installation:**
- Reload VS Code (Cmd+R / Ctrl+R)
- Check that VS Code version is 1.109.0 or higher

**API features not working:**
- Configure API keys in VS Code settings or `.env` file
- See main README.md for configuration details

### File Information

- **Filename**: `devforge-extension-0.0.1.vsix`
- **Size**: ~656 KB
- **Publisher**: devforge
- **Minimum VS Code Version**: 1.109.0
- **Build Date**: March 8, 2026

---

For more information, see the main [README.md](../README.md) in the repository root.
