import PropTypes from "prop-types";
import PageHelmet from "../PageHelmet";

function FeedbackPageHelmet({ title }) {
  return <PageHelmet title={title} noIndex />;
}

FeedbackPageHelmet.propTypes = {
  title: PropTypes.string.isRequired,
};

export default FeedbackPageHelmet;
