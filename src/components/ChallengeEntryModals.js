import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NewChallengeModal from "./NewChallengeModal";
import SoloPlayModal from "./Solo/SoloPlayModal";
import { startSoloAndNavigate } from "../lib/soloPlay";

/**
 * Challenge entry flow: NewChallengeModal for multiplayer, with handoff to
 * SoloPlayModal when the user selects a solo-only game or chooses 1 player.
 */
function ChallengeEntryModals({
  show = false,
  handleClose,
  handleChallenge,
  fixedMetaGame,
  opponent,
  initialSoloSeed = "",
  showSolo = false,
  onSoloClose,
}) {
  const navigate = useNavigate();
  const [soloModalOpen, soloModalOpenSetter] = useState(false);
  const [soloMetaGame, soloMetaGameSetter] = useState(null);
  const [soloSeed, soloSeedSetter] = useState(initialSoloSeed);

  useEffect(() => {
    soloSeedSetter(initialSoloSeed ?? "");
  }, [initialSoloSeed]);

  useEffect(() => {
    if (showSolo && fixedMetaGame) {
      soloMetaGameSetter(fixedMetaGame);
      soloModalOpenSetter(true);
    }
  }, [showSolo, fixedMetaGame]);

  const closeSoloModal = useCallback(() => {
    soloModalOpenSetter(false);
    soloMetaGameSetter(null);
    onSoloClose?.();
  }, [onSoloClose]);

  const handleSoloHandoff = useCallback(
    (metaGame) => {
      handleClose?.();
      soloMetaGameSetter(metaGame);
      soloModalOpenSetter(true);
    },
    [handleClose]
  );

  const handleStartSolo = useCallback(
    async (pars) => {
      try {
        await startSoloAndNavigate(pars, navigate);
        soloModalOpenSetter(false);
        soloMetaGameSetter(null);
        onSoloClose?.();
        handleClose?.();
      } catch (error) {
        console.log(error);
      }
    },
    [navigate, onSoloClose, handleClose]
  );

  return (
    <>
      <NewChallengeModal
        show={show}
        handleClose={handleClose}
        handleChallenge={handleChallenge}
        fixedMetaGame={fixedMetaGame}
        opponent={opponent}
        onSoloHandoff={handleSoloHandoff}
      />
      <SoloPlayModal
        show={soloModalOpen}
        fixedMetaGame={soloMetaGame ?? fixedMetaGame}
        handleClose={closeSoloModal}
        initialChallengeSeed={soloSeed}
        handleStart={handleStartSolo}
      />
    </>
  );
}

export default ChallengeEntryModals;
