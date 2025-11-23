import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
// import { useTranslation } from "react-i18next";
// import { addResource } from "@abstractplay/gameslib";
import { callAuthApi } from "../lib/api";
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
      try {
        const res = await callAuthApi("next_game", {});
        if (!res) {
          return [];
        }
        const status = res.status;
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
