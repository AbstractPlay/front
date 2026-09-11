import { Link } from "react-router-dom";
import { gameinfo } from "@abstractplay/gameslib";
import { Trans } from "react-i18next";
import i18n from "i18next";
import { getGameDisplayName } from "./gameOptions";
import { expandVariants } from "./expandVariants";
import { isSoloOnlyGame } from "./soloPlay";

function metaGameLabel(metaGame) {
  return getGameDisplayName(metaGame);
}

function variantsLabel(metaGame, variants) {
  if (!variants?.length || gameinfo.get(metaGame) === undefined) {
    return "";
  }
  try {
    const names = expandVariants(metaGame, variants);
    return names.length > 0 ? names.join(", ") : "";
  } catch {
    return "";
  }
}

function variantsSuffix(metaGame, variants) {
  const label = variantsLabel(metaGame, variants);
  return label ? ` (${label})` : "";
}

function ratingWithRd(rating, rd) {
  const rounded = Math.round(rating);
  if (rd === undefined || rd === null || rd === "") {
    return `${rounded}`;
  }
  return `${rounded} (${Math.round(rd)})`;
}

function challengeNotificationMessage(i18nKey, metaGame, values) {
  return (
    <Trans
      i18nKey={i18nKey}
      values={{ ...values, metaGame: metaGameLabel(metaGame) }}
      components={{
        gameLink: <Link to={`/games/${metaGame}`} />,
      }}
    />
  );
}

function gameEndScoresSuffix(body) {
  if (!Array.isArray(body.scores) || body.scores.length === 0) {
    return null;
  }
  return (
    <>
      {" "}
      <Trans
        i18nKey="me.notifications.message.gameEnd_scores"
        values={{ scores: body.scores.map(String).join(", ") }}
      />
    </>
  );
}

function gameEndNotificationMessage(body) {
  const metaGame = metaGameLabel(body.metaGame);
  const gameLinkTo = `/move/${body.metaGame}/1/${body.gameId}`;
  const hasOpponent = body.opponentId && body.opponentName;
  const soloEnded =
    !hasOpponent &&
    (isSoloOnlyGame(body.metaGame) || body.numPlayers === 1);

  if (soloEnded) {
    return (
      <>
        <Trans
          i18nKey="me.notifications.message.gameEnd_solo"
          values={{ metaGame }}
          components={{
            gameLink: <Link to={gameLinkTo} />,
          }}
        />
        {variantsSuffix(body.metaGame, body.variants)}
        {gameEndScoresSuffix(body)}
      </>
    );
  }

  const i18nKey = hasOpponent
    ? `me.notifications.message.gameEnd_${body.result}_vsOpponent`
    : "me.notifications.message.gameEnd";
  const transComponents = {
    gameLink: <Link to={gameLinkTo} />,
    ...(hasOpponent
      ? { opponentLink: <Link to={`/player/${body.opponentId}`} /> }
      : {}),
  };

  return (
    <>
      <Trans
        i18nKey={i18nKey}
        context={hasOpponent ? undefined : body.result}
        values={{
          metaGame,
          ...(hasOpponent ? { opponentName: body.opponentName } : {}),
        }}
        components={transComponents}
      />
      {variantsSuffix(body.metaGame, body.variants)}
      {gameEndScoresSuffix(body)}
    </>
  );
}

export function NotificationMessage({ body }) {
  const metaGame = metaGameLabel(body.metaGame);

  switch (body.type) {
    case "gameStart":
      return (
        <>
          <Trans
            i18nKey="me.notifications.message.gameStart"
            values={{ opponentName: body.opponentName, metaGame }}
            components={{
              gameLink: <Link to={`/move/${body.metaGame}/0/${body.gameId}`} />,
            }}
          />
          {variantsSuffix(body.metaGame, body.variants)}
        </>
      );
    case "gameEnd":
      return gameEndNotificationMessage(body);
    case "ratingChange":
      return (
        <Trans
          i18nKey="me.notifications.message.ratingChange"
          values={{
            metaGame,
            variantsInline: variantsSuffix(body.metaGame, body.variants),
            delta: body.delta > 0 ? `+${body.delta}` : `${body.delta}`,
            oldRatingDisplay: ratingWithRd(body.oldRating, body.oldRd),
            newRatingDisplay: ratingWithRd(body.newRating, body.newRd),
          }}
          components={{
            gameLink: <Link to={`/ratings/${body.metaGame}`} />,
          }}
        />
      );
    case "challengeIssued":
      return challengeNotificationMessage(
        "me.notifications.message.challengeIssued",
        body.metaGame,
        { challengerName: body.challengerName }
      );
    case "challengeDeclined":
      return challengeNotificationMessage(
        "me.notifications.message.challengeDeclined",
        body.metaGame,
        { declinerName: body.declinerName }
      );
    case "challengeRevoked":
      return challengeNotificationMessage(
        "me.notifications.message.challengeRevoked",
        body.metaGame,
        { revokerName: body.revokerName }
      );
    case "eventInvitation":
      return (
        <Trans
          i18nKey="me.notifications.message.eventInvitation"
          values={{
            organizerName: body.organizerName,
            eventName: body.eventName,
          }}
          components={{
            eventLink: <Link to={`/event/${body.eventId}`} />,
          }}
        />
      );
    case "tournamentStart":
      return (
        <>
          <Trans
            i18nKey="me.notifications.message.tournamentStart"
            values={{ number: body.number, metaGame }}
            components={{
              tournamentLink: <Link to={`/tournament/${body.tournamentId}`} />,
            }}
          />
          {variantsSuffix(body.metaGame, body.variants)}
        </>
      );
    case "tournamentEnd":
      return (
        <>
          <Trans
            i18nKey={
              body.winnerName
                ? "me.notifications.message.tournamentEnd_withWinner"
                : "me.notifications.message.tournamentEnd"
            }
            values={{
              number: body.number,
              metaGame,
              winnerName: body.winnerName,
            }}
            components={{
              tournamentLink: <Link to={`/tournament/${body.tournamentId}`} />,
            }}
          />
          {variantsSuffix(body.metaGame, body.variants)}
        </>
      );
    case "completedGameChat":
      return (
        <>
          <Trans
            i18nKey={
              body.backfill
                ? "me.notifications.message.completedGameChat_backfill"
                : "me.notifications.message.completedGameChat"
            }
            values={{ commenterName: body.commenterName, metaGame }}
            components={{
              gameLink: <Link to={`/move/${body.metaGame}/1/${body.gameId}`} />,
            }}
          />
          {variantsSuffix(body.metaGame, body.variants)}
        </>
      );
    case "feedbackReply":
      return (
        <Trans
          i18nKey="me.notifications.message.feedbackReply"
          values={{ title: body.title, preview: body.commentPreview ?? "" }}
          components={{
            feedbackLink: <Link to={`/feedback/${body.postId}`} />,
          }}
        />
      );
    case "feedbackStatus":
      return (
        <Trans
          i18nKey="me.notifications.message.feedbackStatus"
          values={{
            title: body.title,
            status: i18n.t(`feedback.status.${body.status}`, { defaultValue: body.status }),
          }}
          components={{
            feedbackLink: <Link to={`/feedback/${body.postId}`} />,
          }}
        />
      );
    case "feedbackDeleted":
      return (
        <Trans
          i18nKey="me.notifications.message.feedbackDeleted"
          values={{ title: body.title, reason: body.reason ?? "" }}
          components={{
            wishlistLink: <Link to="/wishlist" />,
          }}
        />
      );
    case "feedbackReviewRequested":
      return (
        <Trans
          i18nKey="me.notifications.message.feedbackReviewRequested"
          values={{ title: body.title }}
          components={{
            feedbackLink: <Link to={`/feedback/${body.postId}`} />,
          }}
        />
      );
    default:
      return "";
  }
}
