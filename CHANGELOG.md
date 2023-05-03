# Change log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

* Added "info" button below the game board so players can quickly reference game information, including links to rules.
* Added "debug" button below the game board so players can easily get the developers the current game state for debugging purposes.
* Added "zoom" button that hides the game tree and maximizes SVG size. This change involved removing a `max-height` SVG rule. There may be unintended consequences. Will have to monitor.

### Fixed

* Challenges: Fixed bug where new challenges didn't *really* start with "Random" seating selected.
* Homeworlds: Fixed bug that stopped the click handler from working properly.
* Pikemen: Fixed bug that caused unnecessary reorientation to throw an error instead of being ignored.

## [v1.0.0-beta]

Initial beta launch of Abstract Play! We're happy with the core functionality, but we are looking for concrete feedback on how to make things better. Please be generous with your bug reports and suggestions, and please be patient with the bugs you will almost certainly encounter.
