import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import { MeContext } from "../../pages/Skeleton";
import Modal from "../Modal";

function ChallengeResponseModal(props) {
  const { t } = useTranslation();
  const [comment, commentSetter] = useState("");
  const [globalMe] = useContext(MeContext);

  function handleCommentChange(event) {
    commentSetter(event.target.value);
  }

  function handleChallengeAccept() {
    props.respond(true, comment);
    commentSetter("");
  }

  function handleChallengeReject() {
    props.respond(false, comment);
    commentSetter("");
  }

  const challenge = props.challenge;
  if (props.show) {
    var players = "";
    const game = gameinfo.get(challenge.metaGame);
    const otherPlayers = challenge.players
      .filter((x) => x.id !== globalMe.id)
      .map((x) => x.name);
    const all = challenge.players
      .map((item) => item.name)
      .concat(challenge.challengees.map((item) => item.name));
    var allPlayers =
      all.slice(0, -1).join(", ") + " " + t("and") + " " + all[all.length - 1];
    var seating = t("seatingRandom");
    if (challenge.numPlayers > 2) {
      if (otherPlayers.length === 0) players = t("NoOtherPlayersAccepted");
      else
        players = t("OtherPlayersAccepted", {
          others: otherPlayers.join(", "),
        });
    } else {
      if (challenge.seating === "s2") seating = t("seatingMeFirst");
      else if (challenge.seating === "s1") seating = t("seatingMeSecond");
    }
    var desc = "";
    const numVariants =
      challenge.variants === undefined ? 0 : challenge.variants.length;
    const variants = numVariants > 0 ? challenge.variants.join(", ") : null;
    desc =
      t("ChallengeResponseDesc", {
        opp: challenge.challenger.name,
        game: game.name,
      }) +
      t("WithVariants", {
        count: numVariants,
        context: `${numVariants}`,
        variants: variants,
      });
    var notes = "";
    if (challenge.comment !== undefined && challenge.comment.length > 0)
      notes = t("Notes") + challenge.comment;
  }
  return (
    <Modal
      show={props.show}
      title={t("Challenge Details")}
      buttons={[
        {
          label: t("Accept"),
          action: handleChallengeAccept,
        },
        {
          label: t("Reject"),
          action: handleChallengeReject,
        },
        {
          label: t("Close"),
          action: props.close,
        },
      ]}
    >
      <div className="content">
        <p>{desc}</p>
        <p>
          {challenge.numPlayers === 2
            ? t("NumChallenge2") + " " + seating
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
          <p className="help">{t("ChallengeResponseCommentHelp")}</p>
        </div>
      </div>
    </Modal>
  );
}

export default ChallengeResponseModal;
