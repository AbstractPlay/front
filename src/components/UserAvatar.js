import { useEffect, useState } from "react";
import { resolveAvatarConfig } from "../lib/dicebear/avatarConfig";
import { createAvatarSvg } from "../lib/dicebear/createAvatarSvg";

const DEFAULT_SIZE = 40;

function UserAvatar({ user, userId, className = "", size = DEFAULT_SIZE }) {
  const resolvedUser =
    user ?? (userId ? { id: userId, userId } : null);
  const config = resolveAvatarConfig(resolvedUser);
  const [svg, setSvg] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!config) {
      setSvg("");
      setError(false);
      return undefined;
    }

    let cancelled = false;
    setError(false);

    createAvatarSvg({ ...config, size })
      .then((markup) => {
        if (!cancelled) {
          setSvg(markup);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSvg("");
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [config, size]);

  if (!config) {
    return null;
  }

  const classNames = ["user-avatar", className].filter(Boolean).join(" ");

  if (error) {
    return (
      <span
        className={classNames}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  if (!svg) {
    return (
      <span
        className={`${classNames} user-avatar-loading`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <span
      className={classNames}
      style={{ width: size, height: size }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

export default UserAvatar;
