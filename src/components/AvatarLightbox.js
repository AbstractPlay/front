import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import UserAvatar from "./UserAvatar";

const LIGHTBOX_AVATAR_SIZE = 320;

function AvatarLightbox({ show, onClose, user, userId }) {
  const { t } = useTranslation();
  const closeRef = useRef(null);

  useEffect(() => {
    if (!show) {
      return undefined;
    }
    closeRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [show, onClose]);

  if (!show) {
    return null;
  }

  return (
    <div
      className="modal is-active avatar-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={t("profile.avatar.title")}
    >
      <div className="modal-background" onClick={onClose} />
      <div className="modal-content avatar-lightbox-content">
        <button
          ref={closeRef}
          type="button"
          className="delete avatar-lightbox-close"
          onClick={onClose}
          aria-label={t("Close")}
        />
        <UserAvatar
          user={user}
          userId={userId}
          size={LIGHTBOX_AVATAR_SIZE}
          className="avatar-lightbox-avatar"
        />
      </div>
    </div>
  );
}

export function EnlargeableUserAvatar({
  user,
  userId,
  className = "",
  size,
  buttonClassName = "",
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const openLightbox = useCallback(() => {
    setOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setOpen(false);
  }, []);

  const buttonClasses = ["avatar-enlarge-btn", buttonClassName]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <button
        type="button"
        className={buttonClasses}
        onClick={openLightbox}
        aria-label={t("profile.avatar.viewLarge")}
      >
        <UserAvatar
          user={user}
          userId={userId}
          size={size}
          className={className}
        />
      </button>
      <AvatarLightbox
        show={open}
        onClose={closeLightbox}
        user={user}
        userId={userId}
      />
    </>
  );
}

export default AvatarLightbox;
