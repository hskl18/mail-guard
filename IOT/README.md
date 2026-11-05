# MailGuard Firmware

Firmware for a team course prototype that watches a physical mailbox and reports to the Next.js backend in [`stack/`](../stack).

**Status: archived prototype.** It compiles, but CI does not build it, and this version has not been tested on hardware or measured for power. The [known limits](#known-limits) below matter if you reuse it.

## Design

Two ESP32 boards split the work.
The main board reads the sensors and decides what happens, and the ESP32-CAM only takes and uploads photos.
The split keeps sensing and scheduling off the camera board, which has few free GPIO pins.

```text
reed switch ──┐
HX711 + load cell ──► main ESP32 ──  JSON over HTTPS ──► /api/iot/event, /api/iot/report
battery ADC ──┘          │  ▲
                'T'      │  │  'S' or 'F'
                (UART)   ▼  │
                      ESP32-CAM ──  multipart over HTTPS ──► /api/iot/upload
```

The boards talk over UART at 115200 baud with single-byte messages: `T` asks for a photo, and `S` or `F` reports whether the upload succeeded.

| Trigger | What the main board does |
| --- | --- |
| Door opens | Sends an `open` event and requests three photos, targeted at 0, 3 and 6 seconds |
| Door closes | Sends a `close` event and cancels the remaining photos |
| Weight rises by 15 g or more | Sends a `delivery` event |
| Weight falls by 15 g or more | Sends a `removal` event |
| Battery at 20% or below | Sends a `low_battery` event |
| Startup | Sends a status report |

A `millis()` loop aims to poll the reed switch every 2 seconds, the load cell every 60 seconds, and the battery every 5 minutes.
These are targets: HTTP requests, HX711 reads, and Wi-Fi waits block the loop, so a slow request delays the photos and the next checks.
Events share a 5-second cooldown.

The camera board uses VGA at JPEG quality 10 when PSRAM is present, and falls back to QQVGA at quality 20 with a single frame buffer in DRAM when it is not.

## Wiring

| Signal | Main ESP32 | ESP32-CAM |
| --- | --- | --- |
| Reed switch | GPIO 2 | |
| Status LED | GPIO 2 | |
| HX711 DOUT | GPIO 16 | |
| HX711 SCK | GPIO 4 | |
| Battery divider | A0 | |
| UART RX / TX | GPIO 12 / 13 | GPIO 13 / 12 |

## Build

Requires [PlatformIO](https://platformio.org/).

1. Set `WIFI_SSID`, `WIFI_USER` and `WIFI_PASSWORD` in `platformio.ini`, and leave `WIFI_USER` empty for a network without WPA2-Enterprise. Do not commit real values.
2. Replace `IOT_API_KEY` and `DEVICE_SERIAL` in both files under `src/`. The key must already exist in the backend's `api_keys` table for that serial, because the dashboard does not generate keys.
3. Create an empty `IOT/.env`, which git ignores. The main board's build script fails without this file, and `.env` is not otherwise needed here.
4. Build and flash each board:

```bash
cd IOT
touch .env
pio run -e main_esp32_env --target upload
pio run -e esp32_cam_env --target upload
```

The camera board connects with `WIFI_SSID` and `WIFI_PASSWORD` only.

## Known Limits

These come from reading the code, not from hardware testing.

- The reed switch and status LED share GPIO 2, and `setup()` leaves the pin as an output, so door detection may not work as written.
- Periodic reports and Wi-Fi reconnects test `millis() % N == 0` in a loop that sleeps 100 ms, so they can miss scheduled reports and reconnect attempts.
- There is no sleep mode, battery life has not been measured, and the battery reading assumes a divider.
- Polling at 2 seconds with no interrupt or debounce can miss a quick open and close.
- There is no retry or offline queue, and the 5-second cooldown drops events, so a close soon after an open can be lost.
- The camera board disables the brownout detector, which hides power problems.
- HTTPS requests do not configure a CA certificate, and each device's API key is compiled in.
- The firmware never calls `/api/iot/activate`, so server-side registration is not used.
- The report's `temperature_celsius` is a fixed value of 25, because there is no temperature sensor.
- There is no application-configured watchdog for the main loop, OTA update path, or firmware test suite.

## Credits

- `HX711.cpp` and `HX711.h` come from the [bogde/HX711](https://github.com/bogde/HX711) library, under the MIT license.
- `src/esp32_cam_main.cpp` is adapted from a [Random Nerd Tutorials](https://RandomNerdTutorials.com/esp32-cam-http-post-php-arduino/) example.
