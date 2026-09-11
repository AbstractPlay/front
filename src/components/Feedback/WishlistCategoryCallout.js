import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

function WishlistCategoryCallout({ category, note }) {
  const { t } = useTranslation();
  if (!category || category === "none") {
    return null;
  }

  const isPermissions = category === "permissions_required";
  const isDeclined = category === "declined";
  const className = isPermissions
    ? "feedback-wishlist-callout feedback-wishlist-callout-permissions"
    : isDeclined
      ? "feedback-wishlist-callout feedback-wishlist-callout-declined"
      : "feedback-wishlist-callout";

  return (
    <div className={className} role="note">
      <strong>{t(`feedback.wishlist.category.${category}`)}</strong>
      <p>
        {note || t(`feedback.wishlist.categoryHint.${category}`)}
      </p>
    </div>
  );
}

WishlistCategoryCallout.propTypes = {
  category: PropTypes.string,
  note: PropTypes.string,
};

export default WishlistCategoryCallout;
