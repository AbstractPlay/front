import PageHelmet from "../../PageHelmet";
import Joyride from "react-joyride";
import { getGameDisplayName } from "../../../lib/gameOptions";

export default function GameMoveHelmetTour({ session }) {
  const {
    metaGame,
    gameID,
    tourState,
    startTour,
    showTour,
    showTourSetter,
    startTourSetter,
    handleJoyrideCallback,
    t,
  } = session;

  const pageTitle = `${getGameDisplayName(metaGame)}: Game ${gameID}`;

  return (
    <>
      <PageHelmet title={pageTitle}>
        <meta
          property="og:url"
          content={`https://play.abstractplay.com/move/${metaGame}/0/${gameID}`}
        />
        <meta
          property="og:description"
          content={`${getGameDisplayName(metaGame)} game ${gameID}`}
        />
      </PageHelmet>
      <Joyride
        steps={tourState}
        run={startTour}
        callback={handleJoyrideCallback}
        continuous
        showProgress
        showSkipButton
        styles={{
          options: {
            primaryColor: "#008ca8",
          },
        }}
      />
      {!showTour ? null : (
        <div className="has-text-centered">
          <div className="field">
            <div className="control">
              <button
                className="button apButton"
                onClick={() => startTourSetter(true)}
              >
                {t("tour.general.Take")}
              </button>
            </div>
            <div className="control">
              <label className="checkbox">
                <input
                  type="checkbox"
                  onClick={() => {
                    showTourSetter(false);
                    startTourSetter(false);
                  }}
                />
                {t("tour.general.Ignore")}
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
