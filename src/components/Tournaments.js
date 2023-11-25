import React, { useState, useEffect, createContext } from "react";
import NewTournamentModal from "./NewTournamentModal";
import { useTranslation } from "react-i18next";

function Tournaments(props) {
  const { t } = useTranslation();
  const [showNewTournamentModal, showNewTournamentModalSetter] = useState(false);

  const handleNewTournamentClick = () => {
    showNewTournamentModalSetter(true);
  };

  const handleNewTournamentClose = () => {
    showNewTournamentModalSetter(false);
  };

  const handleNewTournament = async (tournament) => {
    showNewTournamentModalSetter(false);
    // TODO: check for duplicate tournament
    try {
      const usr = await Auth.currentAuthenticatedUser();
      console.log("currentAuthenticatedUser", usr);
      await fetch(API_ENDPOINT_AUTH, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
        },
        body: JSON.stringify({
          query: "new_tournament",
          pars: tournament
        })});
    } catch (error) {
      errorSetter(error);
    }
  };

  return (
    <article>
      <h1 className="title has-text-centered">{t("Tournaments")}</h1>
      <p>Long description of how tournemants work.</p>
      <div className="columns">
        <div className="column content is-half is-offset-one-quarter">
          <p className="subtitle lined">
            <span>{t("TournamentsRecentlyCompleted")}</span>
          </p>
          <RecentTournamentsTable tournaments={recentTournaments} />
        </div>
        <div className="column content is-half is-offset-one-quarter">
          <p className="subtitle lined">
            <span>{t("TournamentsOpen")}</span>
          </p>
          <OpenTournamentsTable tournaments={openTournaments} />
        </div>
        <div className="column content is-half is-offset-one-quarter">
          <p className="subtitle lined">
            <span>{t("TournamentsCurrent")}</span>
          </p>
          <CurrentTournamentsTable tournaments={currentTournaments} />
        </div>
        <div className="column content is-half is-offset-one-quarter">
          <p className="subtitle lined">
            <span>{t("TournamentsNew")}</span>
          </p>
          <p>
            You can                 
            <button
              className="button is-small apButton"
              onClick={() => handleNewTournamentClick()}
            >
              {t("NewTournament")}
            </button>
            .
          </p>
        </div>
      </div>
      <NewTournamentModal
        show={showNewTournamentModal}
        handleClose={handleNewTournamentClose}
        handleNewTournament={handleNewTournament}
        users={users}
      />
    </article>
  );
}

export default Tournaments;
