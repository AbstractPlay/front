import React, { useEffect, useState } from "react";

function NewChatMarker(props) {
  const [hideMe, hideMeSetter] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        hideMeSetter(true);
      } else {
        hideMeSetter(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div
      className="chevron-down has-text-centered"
      style={hideMe ? { display: "none" } : {}}
    >
      <p>
        <span className="icon">
          <i className="fa fa-chevron-down" aria-hidden="true"></i>
        </span>
        Possible new chat below
        <span className="icon">
          <i className="fa fa-chevron-down" aria-hidden="true"></i>
        </span>
      </p>
    </div>
  );
}

export default NewChatMarker;
