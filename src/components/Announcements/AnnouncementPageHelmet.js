import PropTypes from "prop-types";
import PageHelmet from "../PageHelmet";

function AnnouncementPageHelmet({ title }) {
  return (
    <PageHelmet title={title}>
      <meta name="robots" content="noindex, nofollow" />
    </PageHelmet>
  );
}

AnnouncementPageHelmet.propTypes = {
  title: PropTypes.string.isRequired,
};

export default AnnouncementPageHelmet;
