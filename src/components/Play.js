import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import { addResource } from "@abstractplay/gameslib";
import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH } from "../config";
import { MyTurnContext } from "../pages/Skeleton";

/*
 * This component loads the "next game" data and immediately redirects you.
 */
function Play(props) {
  const [, myMoveSetter] = useContext(MyTurnContext);
  const navigate = useNavigate();
  //   const { t, i18n } = useTranslation();
  //   addResource(i18n.language);

  //   useEffect(() => {
  //     addResource(i18n.language);
  //   }, [i18n.language]);

  useEffect(() => {
    async function fetchData() {
      let token = null;
      try {
        const usr = await Auth.currentAuthenticatedUser();
        token = usr.signInUserSession.idToken.jwtToken;
      } catch (err) {
        // OK, non logged in user viewing the game
      }
      if (token !== null) {
        try {
          let status;
          const res = await fetch(API_ENDPOINT_AUTH, {
            method: "POST",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: "next_game",
            }),
          });
          status = res.status;
          if (status !== 200) {
            const result = await res.json();
            console.log(`An error occured:`, result.body);
            return [];
          } else {
            const result = await res.json();
            return JSON.parse(result.body);
          }
        } catch (error) {
          console.log(`An error was thrown:`, error);
        }
      } else {
        return [];
      }
    }
    fetchData().then((result) => {
      //   console.log(`Result:`, result);
      myMoveSetter(result);
      if (Array.isArray(result) && result.length > 0) {
        const next = result[0];
        navigate(`/move/${next.metaGame}/0/${next.id}`);
      } else {
        navigate("/");
      }
    });
  }, [myMoveSetter, navigate]);

  return;
}

export default Play;
