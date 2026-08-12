# EDH Nexus

EDH Nexus is a shared-device Android life tracker for Commander/EDH. One phone
sits at the table and controls life totals for every player.

## MVP

- 2–6 players on one landscape game board;
- 40 starting life with large `-5`, `-1`, `+1`, and `+5` controls;
- player and commander selection before each game;
- optional Partner/Background commander selection;
- commander search backed by Scryfall;
- explicit winner selection when a game ends;
- offline SQLite history with commander games, wins, losses, and win rate;
- no accounts, server, ads, or rules engine.

The original web prototype and Rust rules-engine experiment were removed on the
Android pivot branch so the repository represents one focused product.

## Build

The project uses JDK 17, Gradle 8.13, Android Gradle Plugin 8.13.2, Kotlin
2.2.21, AndroidX Core 1.17.0, Activity 1.12.4, compile/target SDK 36, and the
stable Compose BOM 2026.06.01.

Open the repository in a compatible Android Studio release, or run:

```sh
gradle :app:testDebugUnitTest :app:assembleDebug
```

The debug APK is produced at `app/build/outputs/apk/debug/app-debug.apk`.

## Data and privacy

Completed games and aggregate statistics stay in the app's local SQLite
database. Commander searches send the entered card name to Scryfall. No player
names or game results are uploaded.

Commander records use Scryfall `oracle_id` values so statistics remain attached
to the same card across different printings.

Magic: The Gathering is owned by Wizards of the Coast. EDH Nexus is an
independent, unofficial project and is not endorsed by Wizards of the Coast.
