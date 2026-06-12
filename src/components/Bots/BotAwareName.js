import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { formatDisplayName, isAnyBot } from "./botUtils";

function BotAwareName({ id, name, bot, users, link, className }) {
  const displayName = formatDisplayName(name, isAnyBot({ id, name, bot }, users));
  if (link && id) {
    return (
      <Link to={`/player/${id}`} className={className}>
        {displayName}
      </Link>
    );
  }
  return <span className={className}>{displayName}</span>;
}

BotAwareName.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  bot: PropTypes.bool,
  users: PropTypes.array,
  link: PropTypes.bool,
  className: PropTypes.string,
};

export default BotAwareName;
