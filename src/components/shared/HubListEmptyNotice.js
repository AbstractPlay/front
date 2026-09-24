import PropTypes from "prop-types";

/** Visible empty-state copy for indexable list hubs (SEO / soft 404). */
function HubListEmptyNotice({ children }) {
  return (
    <p className="content has-text-centered hub-list-empty" role="status">
      {children}
    </p>
  );
}

HubListEmptyNotice.propTypes = {
  children: PropTypes.node.isRequired,
};

export default HubListEmptyNotice;
