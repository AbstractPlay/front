import React from "react";
import { useParams } from "react-router-dom";
import { getGameDisplayName } from "../../lib/gameOptions";
import { useTranslation } from "react-i18next";
import PageHelmet from "../PageHelmet";
import HistoricalTournamentsTable from "./HistoricalTournamentsTable";

function TournamentsOld(props) {
  const { t } = useTranslation();
  const { metaGame } = useParams();

  const metaGameName = getGameDisplayName(metaGame, "Unknown");

  return (
    <>
      <PageHelmet title={`${metaGameName}: Tournament History`}>
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/tournamenthistory/${metaGame}`}
        />
        <meta
          property="og:description"
          content={`Historical ${metaGameName} tournaments`}
        />
      </PageHelmet>
      <article className="content">
        <h1 className="title has-text-centered">{t("Tournament.OldTitle")}</h1>
        <div className="columns is-multiline">
          <div className="column content is-10 is-offset-1">
            <div className="card" key="old_tournaments">
              <header className="card-header">
                <p className="card-header-title">
                  {t("Tournament.Old", { metaGameName: metaGameName })}
                </p>
              </header>
              <div className="card-content">
                <HistoricalTournamentsTable filterMeta={metaGame} />
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}

export default TournamentsOld;
