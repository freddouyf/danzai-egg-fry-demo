# Generated game art

These files are the built-in visual set for the current demo:

- `events/`: 12 event-specific illustrations.
- `pans/`: iron, copper, golden, crystal, and legendary pans.
- `eggs/`: raw, normal, perfect, singed, burnt, and double-yolk eggs.
- `ui/`: event frame, goal frame, reward burst, ribbon, sparkles, coins,
  hearts, and scallion confetti.
- `source-atlases/`: original generated sprite atlases kept for future edits.

All individual gameplay assets are transparent 512 x 512 PNG files. The game
loads them through `src/assets.js`, so a future replacement only needs to keep
the mapped filename or update that single mapping file.
