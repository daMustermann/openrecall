# OpenRecall - Your Open-Source Digital Memory


**Take Control of Your Digital Memory with OpenRecall, a fully open-source, privacy-first alternative to proprietary solutions like Microsoft's Windows Recall or Limitless' Rewind.ai.**

## What is OpenRecall?

OpenRecall captures your digital history through regular screenshots. The text and images within these screenshots are analyzed and made searchable, allowing you to quickly find specific information by typing relevant keywords. You can also manually scroll back through your history to revisit past activities.

## What's New?

This fork of OpenRecall introduces a host of new features and improvements, including:

*   **Modern UI/UX:** A complete redesign of the user interface, featuring a sleek, app-like design, dark mode, and improved timeline controls.
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

## Get Started

### Prerequisites

* Python 3.9–3.12
* macOS, Windows, or Linux with Git installed
* `pip` (bundled with modern Python installers)

### 1. Clone the repository

```bash
git clone https://github.com/daMustermann/openrecall.git
cd openrecall
```

### 2. Create a virtual environment

Using a virtual environment keeps dependencies isolated from the rest of your system.

```bash
# macOS / Linux
python3 -m venv .venv

# Windows
py -m venv .venv
```

### 3. Activate the environment

```bash
# macOS / Linux
source .venv/bin/activate

# Windows (PowerShell)
.\.venv\Scripts\Activate.ps1

# Windows (Command Prompt)
.\.venv\Scripts\activate.bat
```

You should now see `(.venv)` prefixed in your terminal prompt.

### 4. Install OpenRecall in editable mode

```bash
pip install -e .
```

This command installs OpenRecall and its dependencies into the active virtual environment, so any local code changes take effect immediately.

### 5. Run the application

```bash
python -m openrecall.app
```

Open your browser to `http://localhost:8082` to access OpenRecall.

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
