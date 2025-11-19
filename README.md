# OpenRecall - Your Open-Source Digital Memory

![OpenRecall Logo](images/lisa_rewind.webp)

**Take Control of Your Digital Memory with OpenRecall, a fully open-source, privacy-first alternative to proprietary solutions like Microsoft's Windows Recall or Limitless' Rewind.ai.**

## What is OpenRecall?

OpenRecall captures your digital history through regular screenshots. The text and images within these screenshots are analyzed and made searchable, allowing you to quickly find specific information by typing relevant keywords. You can also manually scroll back through your history to revisit past activities.

## What's New?

This fork of OpenRecall introduces a host of new features and improvements, including:

*   **🚀 Complete Frontend Rewrite:** A stunning new React 18 + TypeScript frontend with cyberpunk aesthetics, intelligent event clustering, and magical search capabilities.
*   **🎨 Cyberpunk UI/UX:** Dark mode only with electric cyan, neon green, magenta, and orange accents. Glass morphism, particle effects, and buttery 120fps animations.
*   **🧠 Intelligent Event Clustering:** Screenshots are automatically grouped into meaningful "events" (coding sessions, gaming, meetings, etc.) using AI embeddings and heuristics.
*   **🔍 Magical Omnibar Search:** Semantic + keyword + fuzzy search with live previews, understanding natural language queries like "What did I code yesterday?".
*   **📊 Smart Dashboard:** Activity heatmaps, productivity scores, app usage stats, and AI-generated insights.
*   **🎬 Event Playback:** Watch your digital activity as a slideshow with smooth transitions.
*   **🤖 AI Integration:** Local Ollama integration for summaries, embeddings, and smart tagging.
*   **📱 PWA Ready:** Offline-capable, installable as a desktop app.
*   **Enhanced Search and Filtering:** Filter your search results by application, language, and date/time.
*   **"Incognito" or "Pause" Mode:** Temporarily pause screen recording for added privacy.
*   **Automatic Language Detection:** OpenRecall now automatically detects the language of the text in your screenshots.
*   **Activity Digest:** Get a summary of your digital activity, including your most used apps and most common words.
*   **API for External Integration:** A new API endpoint allows for integration with external desktop search tools.

## Why Choose OpenRecall?

*   **100% Open-Source:** Audit the source code for potential backdoors or privacy-invading features.
*   **Cross-Platform:** Works on Windows, macOS, and Linux.
*   **Privacy-Focused:** Your data is stored locally on your device. No internet connection or cloud is required.
*   **Hardware Compatibility:** Designed to work with a wide range of hardware.

## Comparison

| Feature | OpenRecall | Windows Recall | Rewind.ai |
| :--- | :--- | :--- | :--- |
| **Transparency** | Open-source | Closed-source | Closed-source |
| **Supported Hardware** | All | Copilot+ certified Windows hardware | M1/M2 Apple Silicon |
| **OS Support** | Windows, macOS, Linux | Windows | macOS |
| **Privacy** | On-device, self-hosted | Microsoft's privacy policy applies | Connected to ChatGPT |
| **Cost** | Free | Part of Windows 11 (requires specialized hardware) | Monthly subscription |

## 🚀 Quick Start

### Prerequisites

* **Python 3.9–3.12** (with `pip`)
* **Node.js 18+** and **npm** (for frontend development)
* **Git**
* **Windows, macOS, or Linux**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/daMustermann/openrecall.git
   cd openrecall
   ```

2. **Set up Python backend**
   ```bash
   # Create virtual environment
   python -m venv .venv

   # Activate it
   # Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # Windows (Command Prompt):
   .\venv\Scripts\activate.bat
   # macOS/Linux:
   source .venv/bin/activate

   # Install Python dependencies
   pip install -e .
   ```

3. **Set up modern frontend (optional - for development)**
   ```bash
   # Install Node.js dependencies
   npm install
   ```

### Running the Application

#### Option 1: Development Mode (Recommended for development)
```bash
# Terminal 1: Start Python backend
python -m openrecall.app

# Terminal 2: Start React frontend
npm run dev
```

- **Frontend:** http://localhost:5173 (modern React app)
- **Backend API:** http://localhost:8082/api (proxied through frontend)

#### Option 2: Production Mode (Recommended for regular use)
```bash
# Build the frontend
npm run build

# Start the all-in-one server
python -m openrecall.app
```

- **Everything served at:** http://localhost:8082
- Backend serves the built React frontend + API

#### Option 3: Windows Quick Launch
Create `start-openrecall.bat` in the project root:
```bat
@echo off
cd /d F:\Coding\openrecall
call .venv\Scripts\activate.bat
python -m openrecall.app
pause
```
Double-click to launch (update the path as needed).

## Frontend Architecture

The new frontend is built with:

* **React 18 + TypeScript** - Modern, type-safe React
* **Vite** - Lightning-fast development server and build tool
* **Tailwind CSS + shadcn/ui** - Beautiful, accessible UI components
* **Framer Motion** - Smooth animations and transitions
* **Zustand + TanStack Query** - State management and data fetching
* **Fuse.js** - Fuzzy search capabilities
* **Ollama Integration** - Local AI for embeddings and summaries

### Key Features

* **Cyberpunk Aesthetics** - Dark mode with neon accents and glass morphism
* **Intelligent Event Clustering** - Groups screenshots into meaningful activities
* **Magical Search** - Semantic search with live previews (⌘K / Ctrl+K)
* **Event Playback** - Watch your activity as a slideshow
* **Smart Dashboard** - Activity insights and productivity metrics
* **PWA Ready** - Installable as a desktop app

### Windows quick-launch batch file

Create a file named `start-openrecall.bat` inside the project root to activate the virtual environment and start the app with a double-click:

```bat
@echo off
REM Update the path below if you saved the project somewhere else
cd /d F:\Coding\openrecall
call .venv\Scripts\activate.bat
python -m openrecall.app
pause
```

* `cd /d` ensures the script switches drives if needed.
* `pause` keeps the window open so you can read log output; remove it if you prefer the window to close automatically.
* If you primarily use PowerShell, replace `activate.bat` with `Activate.ps1` and save the file as `.ps1` instead.

## New Features in Detail

### Modern UI/UX

The user interface has been completely redesigned with a modern, app-like feel. It includes a sidebar for easy navigation, a main content area for displaying your digital history, and a dark mode for comfortable viewing in low-light environments. The timeline controls have also been improved, with a play/pause button and a more intuitive slider.

### Enhanced Search and Filtering

You can now filter your search results by application and language, in addition to the existing time-based filters. This makes it easier than ever to find the information you're looking for.

### "Incognito" or "Pause" Mode

Need a moment of privacy? The new "Pause Recording" button allows you to temporarily stop OpenRecall from capturing your screen.

### Automatic Language Detection

OpenRecall now automatically detects the language of the text in your screenshots, making it easier to search for information in multiple languages.

### Activity Digest

The new Activity Digest page provides a summary of your digital activity, including your most used apps and most common words over the last day and week.

### API for External Integration

A new API endpoint at `/api/entries` allows you to access your OpenRecall data in JSON format, opening up the possibility of integrating with external desktop search tools and other applications.

## Contribute

As an open-source project, we welcome contributions from the community. If you'd like to help improve OpenRecall, please submit a pull request or open an issue on our GitHub repository.

## License

OpenRecall is released under the [AGPLv3](https://opensource.org/licenses/AGPL-3.0), ensuring that it remains open and accessible to everyone.
