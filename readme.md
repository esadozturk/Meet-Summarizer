*Read this in other languages: [Türkçe](README.tr.md)*

# Meet Summarizer
Add-on to summarize Google Meet meetings

## Features
- You can get the summary of your meeting.
- You can download the full transcript of your meeting as well.
- Transcript is captured by copying the text that is written in the captions. Therefore, you need to enable captions while having your meeting.
- Your Gemini API key is stored locally and not sent to third-party servers.

## Installation
1. Clone or download this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable developer mode using the toggle switch on the top right corner.
4. Click the "Load Unpacked" button (on the top left) and select the folder containing `manifest.json` and `content.js` files.
5. The extension is now active. Open Google Meet to see the buttons.

## Usage
1. Join a Google Meet call
2. Turn on captions and set the language to "Turkish"
3. You can see the summary and download the transcript of your meeting using buttons.

## Known Issues
- Captions must be enabled to capture the transcript, which can be distracting for the user.
- The `fetch` call to the Gemini API is executed within the content script. API logic needs to be migrated to a background service in order to fully comply with security policies.
- Transcript is captured with DOM Scraping (e.g. '.ygicle.VbkSUe'), which can be improved to be more resilient to UI changes.

## License
- This project is open-source and available under MIT License.

## Disclaimer
- Please ensure you have the explicit consent of all participants before transcribing or summarizing any meeting.
