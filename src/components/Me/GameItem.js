import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getGameDisplayName } from "../../lib/gameOptions";
import { useStore } from "../../stores";
import { formatPlayerDisplayName } from "../Bots/botUtils";
import { canonicalGamePlayPathForActiveRow } from "../../lib/gamePlayLinks";

function GameItem(props) {
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);

  const game = props.item;
  var desc = t("GameAgainst", {
    game: getGameDisplayName(game.metaGame),
    opp: game.players
      .filter((item) => item.id !== globalMe.id)
      .map((item) => formatPlayerDisplayName(item, allUsers))
      .join(", "),
  });
  return (
    <li>
      <i className="fa fa-circle apBullet"></i>
      <Link to={canonicalGamePlayPathForActiveRow(game)}>
        {desc}
      </Link>
    </li>
  );
}

export default GameItem;
