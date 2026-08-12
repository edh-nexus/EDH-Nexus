# Shared-device MVP

## Game flow

1. Choose 2–6 seats.
2. Enter each player's display name.
3. Search Scryfall and select a primary commander for every seat.
4. Optionally select a second commander for Partner, Background, Friends
   Forever, Doctor's companion, or another allowed pairing.
5. Start the landscape tabletop board at 40 life.
6. Adjust life from any seat's large controls.
7. Tap **Finish**, choose the winner, and persist the result.
8. Review commander games, wins, losses, and win percentage.

The app stores both commanders in a pairing. The MVP statistics screen counts a
game and its outcome for each selected commander. Combination-specific stats
are a planned follow-up.

## Table layout

- 2 players: one panel on each side, with the far panel rotated 180 degrees.
- 3–4 players: a two-column board.
- 5–6 players: a three-column board.
- The first row faces players sitting across from the phone.
- Central **Cancel** and **Finish** controls remain neutral to every seat.

## Persistence model

- `games`: start/end timestamps and winning seat;
- `participants`: player name, seat, final life, and outcome;
- `commanders`: stable Oracle ID, display name, and pairing position.

Unfinished games are deliberately excluded from statistics.

## Next milestones

1. Persist active games so Android process death cannot lose a session.
2. Add commander damage, poison, experience, monarch, initiative, and tax.
3. Add commander art caching and offline recent/favorite selections.
4. Add combination-specific and player-specific statistics.
5. Add JSON/CSV backup and restore.
6. Produce a signed release APK and Play Store bundle.

