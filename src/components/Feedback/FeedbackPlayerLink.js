import PropTypes from "prop-types";
import BotAwareName from "../Bots/BotAwareName";

function FeedbackPlayerLink({ userId, name, className }) {
  if (!name) {
    return null;
  }
  return (
    <BotAwareName
      id={userId}
      name={name}
      link={Boolean(userId)}
      className={className}
    />
  );
}

FeedbackPlayerLink.propTypes = {
  userId: PropTypes.string,
  name: PropTypes.string,
  className: PropTypes.string,
};

export default FeedbackPlayerLink;
