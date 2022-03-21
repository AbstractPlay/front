import React, {useEffect} from 'react';
import MetaItem from './MetaItem';
import { gameinfo } from '@abstractplay/gameslib';
import { useTranslation } from 'react-i18next';
import { addResource } from '@abstractplay/gameslib';

function MetaContainer(props) {
  const { t, i18n } = useTranslation();
  addResource(i18n.language);

  useEffect(() => {
    addResource(i18n.language);
  },[i18n.language]);

  console.log([...gameinfo.keys()]);
  return (
    <div>
      <h1 className="centered">{t("AvailableGames")}</h1>
      <div className="metaGames">
        {[...gameinfo.keys()].sort().filter(k => k !== "volcano").map(k =>
          <MetaItem key={gameinfo.get(k).uid} game={gameinfo.get(k)} />)
        }
      </div>
    </div>
  );
}

export default MetaContainer;
