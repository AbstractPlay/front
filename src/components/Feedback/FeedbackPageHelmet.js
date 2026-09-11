import PropTypes from "prop-types";
import PageHelmet from "../PageHelmet";

function FeedbackPageHelmet({ title }) {
  return (
    <PageHelmet title={title}>
      <meta name="robots" content="noindex, nofollow" />
    </PageHelmet>
  );
}

FeedbackPageHelmet.propTypes = {
  title: PropTypes.string.isRequired,
};

export default FeedbackPageHelmet;
