import {
  EXPLORATION_OUTCOME_DRAW,
  isPlayerWinExplorationOutcome,
  showsExplorationOutcomeMarker,
} from "../../lib/GameMove/explorationOutcome.js";

function PlayerWinOutcomeIndicator({ game, outcome }) {
  if (game.colors[outcome].isImage) {
    return (
      <img
        className="winnerImage"
        src={`data:image/svg+xml;utf8,${encodeURIComponent(
          game.colors[outcome].value
        )}`}
        alt=""
      />
    );
  }
  return (
    <svg className="winnerImage2" viewBox="0 0 44 44" aria-hidden="true">
      <circle
        cx="22"
        cy="22"
        r="18"
        stroke="black"
        strokeWidth="4"
        fill="white"
      />
      <text
        x="12"
        y="32"
        fill="black"
        fontFamily="monospace"
        fontSize="35"
        fontWeight="bold"
      >
        {outcome + 1}
      </text>
    </svg>
  );
}

function DrawOutcomeIndicator() {
  return (
    <svg className="winnerImage2" viewBox="0 0 44 44" aria-hidden="true">
      <circle
        cx="22"
        cy="22"
        r="18"
        stroke="black"
        strokeWidth="4"
        fill="white"
      />
      <text
        x="9"
        y="32"
        fill="black"
        fontFamily="serif"
        fontSize="32"
        fontWeight="bold"
      >
        ½
      </text>
    </svg>
  );
}

export function ExplorationOutcomeIndicator({ game, outcome }) {
  if (!showsExplorationOutcomeMarker(outcome)) {
    return null;
  }
  if (outcome === EXPLORATION_OUTCOME_DRAW) {
    return <DrawOutcomeIndicator />;
  }
  if (isPlayerWinExplorationOutcome(outcome)) {
    return <PlayerWinOutcomeIndicator game={game} outcome={outcome} />;
  }
  return null;
}

export function ExplorationPlayerNumberMarkSvg({ n }) {
  return (
    <svg className="winnerButtonImage" viewBox="0 0 44 44" aria-hidden="true">
      <circle
        cx="22"
        cy="22"
        r="18"
        stroke="black"
        strokeWidth="4"
        fill="white"
      />
      <text
        x="12"
        y="32"
        fill="black"
        fontFamily="monospace"
        fontSize="35"
        fontWeight="bold"
      >
        {n}
      </text>
    </svg>
  );
}

export function ExplorationPlayerWinMarkButton({ game, playerIndex, t, onClick }) {
  const color = game.colors[playerIndex];
  return (
    <div className="winningColorButton tooltipped" onClick={onClick}>
      {color.isImage ? (
        <img
          className="winnerButtonImage"
          src={`data:image/svg+xml;utf8,${encodeURIComponent(color.value)}`}
          alt=""
        />
      ) : (
        <ExplorationPlayerNumberMarkSvg n={playerIndex + 1} />
      )}
      <span className="tooltiptext">{t("Winning")}</span>
    </div>
  );
}

function ExplorationCircledMarkSvg({ children }) {
  return (
    <svg className="winnerButtonImage" viewBox="0 0 44 44" aria-hidden="true">
      <circle
        cx="22"
        cy="22"
        r="18"
        stroke="black"
        strokeWidth="4"
        fill="white"
      />
      {children}
    </svg>
  );
}

function ExplorationGlyphMarkButton({ t, tooltipKey, glyphSvg, onClick }) {
  const tooltip = <span className="tooltiptext">{t(tooltipKey)}</span>;
  return (
    <div className="winningColorButton tooltipped" onClick={onClick}>
      <ExplorationCircledMarkSvg>{glyphSvg}</ExplorationCircledMarkSvg>
      {tooltip}
    </div>
  );
}

const drawGlyphSvg = (
  <text
    x="9"
    y="32"
    fill="black"
    fontFamily="serif"
    fontSize="32"
    fontWeight="bold"
  >
    ½
  </text>
);

const undecidedGlyphSvg = (
  <text
    x="14"
    y="32"
    fill="black"
    fontFamily="serif"
    fontSize="32"
    fontWeight="bold"
  >
    ?
  </text>
);

export function ExplorationDrawMarkButton(props) {
  return (
    <ExplorationGlyphMarkButton
      {...props}
      tooltipKey="MarkDraw"
      glyphSvg={drawGlyphSvg}
    />
  );
}

export function ExplorationUndecidedMarkButton(props) {
  return (
    <ExplorationGlyphMarkButton
      {...props}
      tooltipKey="MarkUndecided"
      glyphSvg={undecidedGlyphSvg}
    />
  );
}
