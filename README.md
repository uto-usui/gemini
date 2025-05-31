# Gemini API Applications

This repository contains a collection of web applications built using the Gemini API. Each application demonstrates different capabilities of the Gemini API in various domains.

## Applications

### 1. Lo-Fi Loop Generator

Generate 8-bar lo-fi loops for background music in just three clicks. Uses Gemini API to configure music parameters for a browser-based audio engine.

### 2. Smaak & Wijn: AI Sommelier

AI suggests 5 wines that pair with your dish. You can filter by wine type or get dish suggestions from ingredients. Features and pairings are explained in Japanese. Amsterdam-style design.

### 3. 星詠み AI (Hoshiyomi AI)

Predicts your fortune for today based on your name and date of birth. AI delivers a special message just for you, resonating with women in their 30s and 40s, based on the Heart Sutra and Zen wisdom.

## Getting Started

Each application can be run independently. Follow these steps to run any of the applications:

### Prerequisites

- Node.js

### Running an Application

1. Navigate to the application directory:
   ```
   cd [application-directory]
   ```
   
   Where `[application-directory]` is one of:
   - `lo-fi-loop-generator`
   - `smaak-wijn_-ai-sommelier`
   - `星詠み-ai`

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the application directory and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Run the application:
   ```
   npm run dev
   ```

5. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173)

## Technologies

These applications are built with:
- React
- TypeScript
- Vite
- Gemini API

## License

This project is licensed under the MIT License - see the LICENSE file for details.
