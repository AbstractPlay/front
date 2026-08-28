import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { AllRecsContext, ProfileContext, SummaryContext } from "../Player";
import DataTable, { PROFILE_TABLE_PROPS } from "../shared/DataTable";
import ChallengeEntryModals from "../ChallengeEntryModals";
import ActivityMarker from "../ActivityMarker";
import { useStore } from "../../stores";
import { formatUserDisplayName } from "../Bots/botUtils";
import { useTranslation } from "react-i18next";

function Opponents({ handleChallenge }) {
  const [user] = useContext(ProfileContext);
  const [allRecs] = useContext(AllRecsContext);
  const allUsers = useStore((state) => state.users);
  const [summary] = useContext(SummaryContext);
  const [counts, countsSetter] = useState([]);
  const globalMe = useStore((state) => state.globalMe);
  const [activeChallengeModal, activeChallengeModalSetter] = useState("");
  const [hIndex, hIndexSetter] = useState(null);
  const [ptile, ptileSetter] = useState(null);
  const { t } = useTranslation();

  const openChallengeModal = (name) => {
    activeChallengeModalSetter(name);
  };
  const closeChallengeModal = useCallback(() => {
    activeChallengeModalSetter("");
  }, []);

  useEffect(() => {
    const hOpp = summary?.players?.hOpp;
    if (hOpp?.length && user !== null) {
      const rec = hOpp.find((r) => r.user === user.id);
      if (rec !== undefined) {
        hIndexSetter(rec.value);
        const countBelow = hOpp.filter(({ value }) => value < rec.value).length;
        ptileSetter(Math.round((countBelow / hOpp.length) * 100));
      } else {
        hIndexSetter(null);
        ptileSetter(null);
      }
    } else {
      hIndexSetter(null);
      ptileSetter(null);
    }
  }, [summary, user]);

  useEffect(() => {
    if (allRecs !== null && allRecs.length > 0) {
      const countMap = new Map();
      for (const rec of allRecs) {
        const myResult = rec.header.players.find(
          (p) => p.userid === user.id
        )?.result;
        if (myResult !== undefined) {
          for (const player of rec.header.players) {
            if (player.userid === user.id) {
              continue;
            }
            let rec = { id: player.userid, n: 1, wins: 0, draws: 0 };
            if (countMap.has(player.userid)) {
              rec = countMap.get(player.userid);
              rec.n++;
            }
            if (myResult > player.result) {
              rec.wins++;
            } else if (myResult === player.result) {
              rec.draws++;
            }
            countMap.set(player.userid, { ...rec });
          }
        }
      }
      const lst = [];
      for (const [id, rec] of countMap.entries()) {
        const losses = rec.n - (rec.wins + rec.draws);
        const winrate =
          Math.round(((rec.wins + rec.draws / 2) / rec.n) * 1000) / 10;
        lst.push({
          id,
          count: rec.n,
          winrate,
          wld: [rec.wins, losses, rec.draws],
        });
      }
      countsSetter(lst);
    } else {
      countsSetter([]);
    }
  }, [allRecs, user]);

  const data = useMemo(
    () =>
      counts
        .map(({ id, count, winrate, wld }) => {
          return {
            id,
            count,
            winrate,
            wld,
          };
        })
        .sort((a, b) => b.count - a.count),
    [counts]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () =>
      allUsers === null
        ? []
        : [
            columnHelper.accessor("id", {
              header: t("tables.player"),
              cell: (props) => (
                <>
                  <Link to={`/player/${props.getValue()}`}>
                    {formatUserDisplayName(
                      allUsers.find((u) => u.id === props.getValue()),
                      allUsers
                    )}
                  </Link>
                  &nbsp;
                  <ActivityMarker
                    lastSeen={
                      allUsers.find((u) => u.id === props.getValue())?.lastSeen
                    }
                    size="s"
                  />
                </>
              ),
              sortingFn: (rowA, rowB, columnID) => {
                const nameA = allUsers?.find(
                  (u) => u.id === rowA.getValue(columnID)
                ).name;
                const nameB = allUsers?.find(
                  (u) => u.id === rowB.getValue(columnID)
                ).name;
                return nameA.localeCompare(nameB);
              },
            }),
            columnHelper.accessor("count", {
              header: t("tables.playCount"),
            }),
            columnHelper.accessor("winrate", {
              header: t("tables.winLossDraw"),
              cell: (props) =>
                `${props.getValue()}% (${props.row.original.wld.join("/")})`,
            }),
            columnHelper.display({
              id: "challenge",
              cell: (props) =>
                globalMe === null ||
                props.row.original.id === undefined ? null : (
                  <>
                    <ChallengeEntryModals
                      show={
                        activeChallengeModal !== "" &&
                        activeChallengeModal === props.row.original.id
                      }
                      handleClose={closeChallengeModal}
                      handleChallenge={handleChallenge}
                      opponent={{
                        id: props.row.original.id,
                        name: allUsers?.find(
                          (u) => u.id === props.row.original.id
                        ).name,
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
      activeChallengeModal,
      handleChallenge,
      allUsers,
      closeChallengeModal,
      t,
    ]
  );

  if (data.length === 0 && hIndex === null) {
    return null;
  }

  return (
    <>
      {hIndex === null || ptile === null ? null : (
        <div className="content">
          <p>
            This player's "opponents" h-index is {hIndex} (p{ptile})
          </p>
        </div>
      )}
      {data.length === 0 ? null : (
        <DataTable
          {...PROFILE_TABLE_PROPS}
          data={data}
          columns={columns}
          sort={[{ id: "count", desc: true }]}
          key="Player|Opponent"
        />
      )}
    </>
  );
}

export default Opponents;
