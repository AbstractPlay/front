# Change log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

* Added "info" button below the game board so players can quickly reference game information, including links to rules.
* Added "debug" button below the game board so players can easily get the developers the current game state for debugging purposes.
* Added "zoom" button that hides the game tree and maximizes SVG size. This change involved removing a `max-height` SVG rule. There may be unintended consequences. Will have to monitor.
* Added "Next game" button, which will take you immediately to the next game where it's your turn, or take you back to the dashboard if there are no games remaining. The list only refreshes when you visit the dashboard, though, so sometimes you will go back to the dashboard to find opponents have made moves in the meantime.
* Added "New chat" indicator at bottom of the play screen. Because of how the databases are designed, I can't tell for sure whether chat is "new" meaning you for sure haven't seen it before. So instead, it looks at the chat log and sees if (a) the most recent chat is from your opponent and (b) how many moves have been made since that chat.
* Added subtle colouring around the move entry box. Green is the default colour. Red means you've started a move but it's not done yet or there's a problem with the move. Yellow means the move is complete but not yet submitted.
* Added a "Download game record" button to completed games so you can download the official record for further analysis. This is a temporary solution. Eventually there will be a dedicated "data" area and functions.
* Better formatting of explored variations. See Feature Request #0017.
* Highlight current position in the moves list. Very useful when exploring.
* Added notification settings to the user settings screen. It has also been reformatted. Further optimization forthcoming.
* Added some text to the ToS to make it explicit that display names must comply with the terms and can be forcibly changed if deemed necessary.
* Implemented user controllable exploring. By default new users will be in "always ask" state. There is a new usersetiing where this can be changed to "never", "always" or "ask".
* Fix editing of partial moves that can be rendered: Instead of move.previous only keep previous partial move that was renderable. Needed for Chase click handling.
* Add a button to clear the move input text box.
* Give feedback when you make a game ending move while exploring. Also auto mark such a move as winning or losing.

### Fixed

* Challenges: Fixed bug where new challenges didn't *really* start with "Random" seating selected.
* Homeworlds: Fixed bug that stopped the click handler from working properly.
* Pikemen: Fixed bug that caused unnecessary reorientation to throw an error instead of being ignored.
* Blam!: Click handler now autoselects your smallest piece unless you select a different one from your stash first.
* Fixed bug where going directly to a game sometimes wouldn't load.
* Fix: When someone explores 2 winning moves from a particular position, the front end crashed.
* Marking a move as winning or losing didn't get saved to the DB (would only get saved on further exploration).
* Fix bug on merging exploration from 2 moves ago.
* When switching to a stackExpanding game (using "Next game") react loses track of the previous board svg. Remove explicitly.

## [v1.0.0-beta]

Initial beta launch of Abstract Play! We're happy with the core functionality, but we are looking for concrete feedback on how to make things better. Please be generous with your bug reports and suggestions, and please be patient with the bugs you will almost certainly encounter.
