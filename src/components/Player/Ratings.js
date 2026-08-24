import React, { useCallback, useContext, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { ProfileContext, SummaryContext } from "../Player";
import { gameinfo } from "@abstractplay/gameslib";
import DataTable, { PROFILE_TABLE_PROPS } from "../shared/DataTable";
import NewChallengeModal from "../NewChallengeModal";
import { useStore } from "../../stores";
import { useTranslation } from "react-i18next";

function Ratings({ handleChallenge }) {
  const [user] = useContext(ProfileContext);
  const [summary] = useContext(SummaryContext);
  const globalMe = useStore((state) => state.globalMe);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const { t } = useTranslation();

  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = useCallback(() => {
    activeChallengeModalSetter("");
  }, []);

  const data = useMemo(() => {
    if (summary == null || !summary.ratings?.highest) {
      return [];
    }
    return summary.ratings.highest
      .filter((r) => r.user === user.id)
      .map(({ rating: elo, game, wld, glicko, trueskill }) => {
        const inforec = [...gameinfo.values()].find((r) =>
          game.startsWith(r.name)
        );
        const gameRatings = summary.ratings.highest
          .filter((r) => r.game === game)
          .map((r) => r.rating)
          .sort((a, b) => b - a);
        const rank = gameRatings.findIndex((n) => n === elo) + 1;
        return {
          id: inforec.uid,
          name: game,
          elo,
          rank,
          wld,
          glicko,
          trueskill,
        };
      })
      .sort((a, b) => b.elo - a.elo);
  }, [summary, user]);

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("tables.game"),
        cell: (props) => (
          <Link to={`/games/${props.row.original.id}`}>{props.getValue()}</Link>
        ),
      }),
      columnHelper.accessor("wld", {
        header: t("tables.winLossDraw"),
        cell: (props) => {
          const sum = props.getValue().reduce((prev, curr) => prev + curr, 0);
          if (sum > 0) {
            const winrate =
              Math.trunc(
                ((props.getValue()[0] + props.getValue()[2] / 2) / sum) * 1000
              ) / 10;
            return `${winrate}% (${props.getValue()[0]}, ${
              props.getValue()[1]
            }, ${props.getValue()[2]})`;
          } else {
            return `---`;
          }
        },
        sortingFn: (rowA, rowB, columnID) => {
          const sumA = rowA
            .getValue(columnID)
            .reduce((prev, curr) => prev + curr, 0);
          const sumB = rowB
            .getValue(columnID)
            .reduce((prev, curr) => prev + curr, 0);
          const rateA =
            Math.trunc(
              ((rowA.getValue(columnID)[0] + rowA.getValue(columnID)[2] / 2) /
                sumA) *
                1000
            ) / 10;
          const rateB =
            Math.trunc(
              ((rowB.getValue(columnID)[0] + rowB.getValue(columnID)[2] / 2) /
                sumB) *
                1000
            ) / 10;
          // NaNs first
          if (isNaN(rateA) && isNaN(rateB)) {
            return 0;
          } else if (isNaN(rateA)) {
            return -1;
          } else if (isNaN(rateB)) {
            return 1;
          }
          return rateA < rateB ? -1 : rateA > rateB ? 1 : 0;
        },
      }),
      columnHelper.accessor("elo", {
        header: t("tables.elo"),
      }),
      columnHelper.accessor("rank", {
        header: t("tables.eloRank"),
      }),
      columnHelper.accessor("glicko", {
        header: t("tables.glicko"),
        cell: (props) => {
          const rating = props.getValue().rating;
          const rd = props.getValue().rd;
          const min = Math.round(rating - rd * 2);
          const max = Math.round(rating + rd * 2);
          return `${min}–${max}`;
        },
        sortingFn: (rowA, rowB, columnID) => {
          const ratingA = Math.round(rowA.getAllCells(columnID).rating);
          const ratingB = Math.round(rowB.getAllCells(columnID).rating);
          const rdA = Math.round(rowA.getAllCells(columnID).rd);
          const rdB = Math.round(rowB.getAllCells(columnID).rd);
          if (ratingA === ratingB) {
            return rdA - rdB;
          } else {
            return ratingA - ratingB;
          }
        },
      }),
      columnHelper.accessor("trueskill", {
        header: t("tables.trueskill"),
        cell: (props) => Math.round(props.getValue().mu * 10) / 10,
        sortingFn: (rowA, rowB, columnID) => {
          return rowA.getValue(columnID).mu - rowB.getValue(columnID).mu;
        },
      }),
      columnHelper.display({
        id: "challenge",
        cell: (props) =>
          globalMe === null || globalMe.id === user.id ? null : (
            <>
              <NewChallengeModal
                show={
                  activeChallengeModal !== "" &&
                  activeChallengeModal === props.row.original.id
                }
                handleClose={closeChallengeModal}
                handleChallenge={handleChallenge}
                fixedMetaGame={props.row.original.id}
                opponent={{
                  id: user.id,
                  name: user.name,
                }}
              />
              <button
                className="button is-small apButton"
                onClick={() => openChallengeModal(props.row.original.id)}
              >
                {t("IssueChallengeLabel")}
              </button>
            </>
          ),
      }),
    ],
    [
      columnHelper,
      globalMe,
      user,
      activeChallengeModal,
      handleChallenge,
      closeChallengeModal,
      t,
    ]
  );

  if (data.length === 0) {
    return null;
  }

  return (
    <DataTable
      {...PROFILE_TABLE_PROPS}
      data={data}
      columns={columns}
      sort={[{ id: "elo", desc: true }]}
      key="Player|Ratings"
    />
  );
}

export default Ratings;
