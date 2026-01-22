# Weathercraft Guardian - Mission Control

**Operational Status:** ACTIVE
**Target:** Peterson SFB (Building 140) / Aspen ES Roof
**Version:** 1.0.0 (Guardian)

## Overview
Weathercraft Guardian is a lightweight, tactical command center for roofing operations. It replaces legacy spreadsheet logs with a real-time "Go/No-Go" compliance engine based on specific material manufacturer constraints.

## Features
- **Material Intelligence:** Hardcoded logic for Green-Lock, R-Mer Seal, and other critical materials based on Manufacturer Data Sheets.
- **Go/No-Go Gauge:** Instant visual feedback for the foreman based on current weather + material selection.
- **Forecast Compliance:** 3-Day lookahead showing exactly when windows of opportunity open or close.
- **Multi-Project:** Supports Peterson SFB (Default) and Aspen ES.

## Deployment (Vercel)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   # Add your remote
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Import the repository.
   - Framework Preset: Next.js.
   - **Environment Variables:**
     - None required for MVP (API Key is currently embedded in `lib/config.ts` for ease of use, but recommended to move to `OPENWEATHER_API_KEY` in Vercel settings for production security).

## Operational Instructions
1. Open the dashboard on mobile or tablet.
2. Select the **"Mission Task"** (e.g., "Green-Lock Plus").
3. View the **"Go/No-Go"** status.
4. If **"GO"**, proceed. If **"NO GO"**, review the "Violations Detected" list (e.g., "Temp 38°F is below min 40°F").

## Material Database (Hardcoded in `lib/materials.ts`)
- **Green-Lock Plus:** >40°F, Rising, No Precip.
- **R-Mer Seal:** >50°F, Rising, No Precip.
- **Garla-Block 2K:** >50°F (within 6h).
- **Tuff-Stuff MS:** Storage <80°F.