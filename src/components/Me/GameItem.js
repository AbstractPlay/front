import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { getGameDisplayName } from "../../lib/gameOptions";
import { useStore } from "../../stores";
import { formatPlayerDisplayName } from "../Bots/botUtils";

function GameItem(props) {
  const { t } = useTranslation();
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);

  const game = props.item;
  const currentGameBit = props.gameOver ? "1" : "0";
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
      <Link to={`/move/${game.metaGame}/${currentGameBit}/${game.id}`}>
        {desc}
      </Link>
    </li>
  );
}

export default GameItem;
