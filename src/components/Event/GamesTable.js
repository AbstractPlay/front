import { useMemo, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH } from "../../config";
import { useTranslation } from "react-i18next";
import { gameinfo } from "@abstractplay/gameslib";
import { UsersContext } from "../../pages/Skeleton";
import TableSkeleton from "../Events/TableSkeleton";
import Modal from "../Modal";

function GamesTable({ games, setRefresh, editor, eventid }) {
  const { t } = useTranslation();
  const [allUsers] = useContext(UsersContext);
  const [showModalArbitrate, showModalArbitrateSetter] = useState(false);
  const [arbRec, setArbRec] = useState(null);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (arbRec !== null) {
      if (arbRec.winner === undefined) {
        setWinner(null);
      } else if (arbRec.winner === null) {
        setWinner(0);
      } else if (arbRec.winner.id === arbRec.p1.id) {
        setWinner(1);
      } else {
        setWinner(2);
      }
    } else {
      setWinner(null);
    }
  }, [arbRec]);

  const data = useMemo(
    () =>
      games.map(
        ({
          metaGame,
          variants,
          round,
          gameid,
          player1,
          player2,
          winner,
          arbitrated,
        }) => {
          const p1 = allUsers.find((u) => u.id === player1);
          const p2 = allUsers.find((u) => u.id === player2);
          return {
            id: gameid,
            round,
            metagame: metaGame,
            gameName: gameinfo.get(metaGame)?.name,
            variants,
            p1,
            p2,
            gameover:
              winner === undefined || winner.length === 0 ? false : true,
            // null signals a draw
            winner:
              winner === undefined || winner.length === 0
                ? undefined
                : winner.length === 1
                ? winner[0] === 1
                  ? p1
                  : p2
                : null,
            arbitrated,
          };
        }
      ),
    [games, allUsers]
  );

  useEffect(() => {
    console.log(data);
  }, [data]);

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("id", {
        header: "Game",
        cell: (props) => (
          <Link
            to={`/move/${props.row.original.metagame}/${
              props.row.original.gameover ? 1 : 0
            }/${props.getValue()}`}
          >
            {props.row.original.gameName}
          </Link>
        ),
      }),
      columnHelper.accessor("variants", {
        header: "Variants",
        cell: (props) => props.getValue()?.join(", ") || null,
      }),
      columnHelper.accessor("round", {
        header: "Round",
      }),
      columnHelper.accessor("p1", {
        header: "Player 1",
        cell: (props) => (
          <Link to={`/player/${props.getValue().id}`}>
            {props.getValue().name}
          </Link>
        ),
      }),
      columnHelper.accessor("p2", {
        header: "Player 2",
        cell: (props) => (
          <Link to={`/player/${props.getValue().id}`}>
            {props.getValue().name}
          </Link>
        ),
      }),
      columnHelper.accessor("winner", {
        header: "Winner",
        cell: (props) =>
          props.getValue() === undefined ? null : props.getValue() === null ? (
            <>Draw{props.row.original.arbitrated ? <span>*</span> : null}</>
          ) : (
            <>
              <Link to={`/player/${props.getValue().id}`}>
                {props.getValue().name}
              </Link>
              {props.row.original.arbitrated ? <span>*</span> : null}
            </>
          ),
      }),
      columnHelper.display({
        id: "actions",
        cell: (props) =>
          !editor ? null : (
            <>
              <button
                className="button is-small apButton"
                onClick={() => {
                  setArbRec(props.row.original);
                  showModalArbitrateSetter(true);
                }}
              >
                Change result
              </button>
            </>
          ),
      }),
    ],
    [columnHelper, editor]
  );

  const changeResult = () => {
    console.log(`Rec:`, arbRec);
    console.log(`Winner: ${winner}`);
    async function saveChange(eventid, gameid, result) {
      try {
        const usr = await Auth.currentAuthenticatedUser();
        const res = await fetch(API_ENDPOINT_AUTH, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${usr.signInUserSession.idToken.jwtToken}`,
          },
          body: JSON.stringify({
            query: "event_update_result",
            pars: {
              eventid,
              gameid,
              result,
            },
          }),
        });
        if (res.status !== 200) {
          console.log(
            `An error occurred creating the games: ${JSON.stringify(res)}`
          );
          return false;
        } else {
          return true;
        }
      } catch (error) {
        console.log(
          `An error occurred creating the games: ${JSON.stringify(error)}`
        );
        return false;
      }
    }
    if (arbRec !== null && winner !== null) {
      saveChange(eventid, arbRec.id, winner).then((success) => {
        if (success) {
          setRefresh((val) => val + 1);
        }
      });
      setArbRec(null);
      setWinner(null);
      showModalArbitrateSetter(false);
    }
  };

  return (
    <>
      <TableSkeleton
        data={data}
        columns={columns}
        sort={[{ id: "round", desc: false }]}
      />
      <Modal
        show={showModalArbitrate}
        title={"Arbitrate result"}
        buttons={[
          {
            label: "Save result",
            action: changeResult,
          },
          {
            label: t("Cancel"),
            action: () => showModalArbitrateSetter(false),
          },
        ]}
      >
        <div className="content">
          <p>
            Please note that arbitrated results will not be visible in the
            auto-generated game reports. They only apply within the context of
            this event.
          </p>
        </div>
        <div className="field">
          <label className="label">
            Select the arbitrated winner of{" "}
            <Link to={`/move/${arbRec?.metagame}/1/${arbRec?.id}`}>
              {arbRec?.gameName} game
            </Link>
            :
          </label>
          <div className="control">
            <label className="radio">
              <input
                type="radio"
                name="winner"
                checked={winner === 1}
                onClick={() => setWinner(1)}
                readOnly
              />
              {arbRec?.p1.name}
            </label>
            <label className="radio">
              <input
                type="radio"
                name="winner"
                checked={winner === 2}
                onClick={() => setWinner(2)}
                readOnly
              />
              {arbRec?.p2.name}
            </label>
            <label className="radio">
              <input
                type="radio"
                name="winner"
                checked={winner === 0}
                onClick={() => setWinner(0)}
                readOnly
              />
              Draw
            </label>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default GamesTable;
