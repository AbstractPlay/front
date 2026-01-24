import React, { useState, useContext } from "react";
import ReactDom from "react-dom";
import { useTranslation } from "react-i18next";
import { gameinfo, GameFactory } from "@abstractplay/gameslib";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Modal from "../Modal";
import { MeContext } from "../../pages/Skeleton";

const ChallengeViewModal = React.memo(function ChallengeViewModal({ revoke, challenge, show, close }) {
  const { t } = useTranslation();
  const [comment, commentSetter] = useState("");
  const [globalMe] = useContext(MeContext);

  function handleCommentChange(event) {
    commentSetter(event.target.value);
  }

  function handleChallengeRevoke() {
    revoke(challenge, comment);
    commentSetter("");
  }

  const amChallenger = globalMe?.id === challenge?.challenger?.id;
  if (show) {
    const game = gameinfo.get(challenge.metaGame);
    const numVariants =
      challenge.variants === undefined ? 0 : challenge.variants.length;
    let variantMap = new Map();
    if (numVariants > 0) {
      const info = gameinfo.get(challenge.metaGame);
      let gameEngine;
      if (info.playercounts.length > 1) {
        gameEngine = GameFactory(info.uid, 2);
      } else {
        gameEngine = GameFactory(info.uid);
      }
      variantMap = new Map(
        gameEngine.allvariants().map((rec) => [rec.uid, rec.name])
      );
    }
    const variants =
      numVariants > 0
        ? challenge.variants
            .map((id) => (variantMap.has(id) ? variantMap.get(id) : id))
            .join("; ")
        : null;
    var challengeDesc = "";
    var players = "";
    const otherplayers = challenge.players
      .filter((item) => !amChallenger || item.id !== challenge.challenger.id)
      .map((item) => item.name);
    var seating = t("seatingRandom");
    if (challenge.numPlayers > 2) {
      if (amChallenger) {
        challengeDesc =
          t("ChallengeDescription", { game: game.name }) +
          t("WithVariants", {
            count: numVariants,
            context: `${numVariants}`,
            variants: variants,
          });
      } else {
        challengeDesc =
          t("ChallengeDescriptionAccepter", {
            challenger: challenge.challenger.name,
            game: game.name,
          }) +
          t("WithVariants", {
            count: numVariants,
            context: `${numVariants}`,
            variants: variants,
          });
      }
      if (otherplayers.length === 0) {
        players = t("NoOtherPlayersAccepted");
      } else {
        if (amChallenger)
          players = t("OtherPlayers", {
            others: otherplayers.join(", "),
          });
        else
          players = t("PlayersAccepted", {
            others: otherplayers.join(", "),
          });
      }
    } else {
      // two player game
      if (challenge.standing) {
        challengeDesc =
          t("StandingChallengeDescription", { game: game.name }) +
          t("WithVariants", {
            count: numVariants,
            context: `${numVariants}`,
            variants: variants,
          });
      } else {
        challengeDesc =
          t("TwoPlayersChallengeDescription", {
            other: challenge.challengees[0].name,
            game: game.name,
            meta: challenge.metaGame,
          }) +
          t("WithVariants", {
            count: numVariants,
            context: `${numVariants}`,
            variants: variants,
          });
      }
      players = "";
      if (challenge.seating === "s1") seating = t("seatingMeFirst");
      else if (challenge.seating === "s2") seating = t("seatingMeSecond");
    }
    if (challenge.standing) {
      if (
        "duration" in challenge &&
        typeof challenge.duration === "number" &&
        challenge.duration > 0
      ) {
        challengeDesc += " " + t("DurationHelp", { count: challenge.duration });
      } else {
        challengeDesc += " " + t("DurationHelpPersistent");
      }
    }
    const all = challenge.players
      .map((item) => item.name)
      .concat(
        challenge.standing ? [] : challenge.challengees.map((item) => item.name)
      );
    var allPlayers =
      all.slice(0, -1).join(", ") + " " + t("and") + " " + all[all.length - 1];
    var notes = "";
    if (challenge.comment !== undefined && challenge.comment.length > 0)
      notes = t("Notes") + challenge.comment;
  }
  return show ? ReactDom.createPortal((
    <Modal
      show={show}
      title={t("Challenge Details")}
      buttons={[
        {
          label: amChallenger ? t("RevokeChallenge") : t("RevokeAcceptance"),
          action: handleChallengeRevoke,
        },
        { label: t("Close"), action: close },
      ]}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        className="content"
      >
        {challengeDesc}
      </ReactMarkdown>
      <div className="content">
        <p>
          {challenge.numPlayers === 2
            ? t("NumChallenge2") + " " + seating
            : challenge.standing === true
            ? t("NumStandingChallenge", { num: challenge.numPlayers })
            : t("NumChallenge", {
                num: challenge.numPlayers,
                players: allPlayers,
              })}
        </p>
        <p>
          {t("ChallengeClock", {
            start: challenge.clockStart,
            inc: challenge.clockInc,
            max: challenge.clockMax,
          })}
        </p>
        <p>{challenge.clockHard ? t("HardTime") : t("SoftTime")}</p>
        <p>{challenge.rated ? t("RatedGame") : t("UnratedGame")}</p>
        <p>
          <strong>{challenge.noExplore ? t("NoExploreTrue") : ""}</strong>
        </p>
        <p>{players}</p>
        <p>{notes}</p>
        {challenge.standing ? null : (
          <div className="field">
            <label className="label" htmlFor="comment">
              {t("ChallengeResponseComment")}
            </label>
            <div className="control">
              <textarea
                className="textarea is-small"
                id="comment"
                name="comment"
                rows="2"
                maxLength="128"
                value={comment}
                onChange={handleCommentChange}
              ></textarea>
            </div>
            <p className="help">
              {amChallenger
                ? t("ChallengeRevokeCommentHelp")
                : t("ChallengeRevokeCommentHelp2")}
            </p>
          </div>
        )}
      </div>
    </Modal>
  ), document.getElementById('modal-root')) : null;
});

export default ChallengeViewModal;
