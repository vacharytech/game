# Shory Insurance Game

A mobile-only HTML5/JavaScript mini-game built with vanilla web technologies.

## Features

- **Mobile-first design** - Optimized for portrait orientation on mobile devices
- **Touch controls** - Tap to move the car between lanes
- **Progressive difficulty** - Speed and spawn rate increase every 10 seconds
- **Lead capture** - Collect user information when they complete the game
- **Social sharing** - Share scores with friends
- **Responsive design** - Scales to fit different screen sizes while preserving aspect ratio

## Game Mechanics

- **Objective**: Avoid NPC cars while driving for 30 seconds
- **Controls**: Tap anywhere to move to the next lane
- **Scoring**: +1 point for each NPC car you successfully overtake
- **Collision**: Game ends immediately if you hit an NPC car
- **Success**: Complete 30 seconds without collision to access lead capture form

## Setup

1. **Download the game files**:
   - `index.html` - Main game file
   - `styles.css` - Game styling
   - `game.js` - Game logic

2. **Run the game**:
   - Open `index.html` in any web browser
   - The game is designed for mobile devices in portrait orientation
   - Works immediately with built-in placeholder assets

## File Structure

```
/
├── index.html          # Main game file
├── styles.css          # Game styling
├── game.js             # Game logic
└── README.md           # This file
```

## Game Flow

1. **Splash Screen**: Shows game title and "GET STARTED" button
2. **Gameplay**: 30-second driving challenge with increasing difficulty
3. **Game Over**: If collision occurs, shows share option
4. **Lead Capture**: If successful, shows form to collect user details
5. **Restart**: After sharing or form submission, game restarts

## Technical Details

- **Target Resolution**: 430×932 points (iPhone 14 Pro)
- **Framerate**: 60 FPS target
- **Input**: Touch-only (tap to change lanes)
- **Orientation**: Portrait only with rotation lock overlay
- **Dependencies**: None - pure HTML/CSS/JavaScript

## Browser Compatibility

- iOS Safari (recommended)
- Chrome Mobile
- Firefox Mobile
- Samsung Internet

## Customization

The game can be easily customized by modifying the `CONFIG` object in `game.js`:

- `GAME_DURATION`: Change game length (default: 30 seconds)
- `INITIAL_NPC_SPEED`: Starting speed of NPC cars
- `SPEED_INCREASE`: How much speed increases every 10 seconds
- `LANES`: Lane positions
- `COLLISION_FORGIVENESS`: Collision detection sensitivity

## Analytics

The game includes analytics hooks for tracking:
- Game start
- Lane changes
- Collisions
- Game completion
- Share attempts
- Lead form submissions

Analytics are logged to console by default but can be easily connected to your analytics service.

## License

This game is provided as-is for demonstration purposes.
