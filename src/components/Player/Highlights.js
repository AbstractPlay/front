import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { ProfileContext } from "../Player";
import { gameinfo } from "@abstractplay/gameslib";
import DataTable, { PROFILE_TABLE_PROPS } from "../shared/DataTable";
import ProfileModule from "./ProfileModule";
import { API_ENDPOINT_OPEN } from "../../config";
import { useStore } from "../../stores";
import BotAwareName from "../Bots/BotAwareName";
import { useTranslation } from "react-i18next";
import { unhighlightGame } from "../../lib/playerGameMarks";
import { toast } from "react-toastify";
import LocalizedTimeAgo from "../LocalizedTimeAgo";

/** Set true once player_highlights returns reliable gameEnded timestamps. */
const SHOW_HIGHLIGHTS_END_DATE = true;

function HighlightsTable({
  highlights,
  user,
  allUsers,
  isOwnProfile,
  onUnhighlight,
}) {
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      highlights.map((g) => {
        const ret = {
          id: g.id,
          metaGame: g.metaGame,
          gameName: "Unknown",
          opponents: (g.players ?? []).filter((p) => p.id !== user.id),
          gameEnded: g.gameEnded || 0,
        };
        if (gameinfo.get(g.metaGame) !== undefined) {
          ret.gameName = gameinfo.get(g.metaGame).name;
        }
        return ret;
      }),
    [highlights, user.id]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("gameName", {
        header: t("tables.game"),
        cell: (props) => (
          <Link
            to={`/move/${props.row.original.metaGame}/1/${props.row.original.id}`}
          >
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("opponents", {
        header: t("tables.opponents"),
        cell: (props) =>
          props
            .getValue()
            .map((u) => (
              <BotAwareName
                key={u.id}
                id={u.id}
                name={u.name}
                users={allUsers}
                link
              />
            ))
            .reduce(
              (acc, x) =>
                acc === null ? (
                  x
                ) : (
                  <>
                    {acc}, {x}
                  </>
                ),
              null
            ),
        sortingFn: (rowA, rowB, columnID) => {
          const nameA = rowA.getValue(columnID)[0]?.name ?? "";
          const nameB = rowB.getValue(columnID)[0]?.name ?? "";
          return nameA.localeCompare(nameB);
        },
      }),
      ...(SHOW_HIGHLIGHTS_END_DATE
        ? [
            columnHelper.accessor("gameEnded", {
              header: t("tables.endDate"),
              cell: (props) =>
                props.getValue() === 0 ? (
                  ""
                ) : (
                  <LocalizedTimeAgo
                    date={props.getValue()}
                    timeStyle="twitter-now"
                  />
                ),
            }),
          ]
        : []),
      ...(isOwnProfile
        ? [
            columnHelper.display({
              id: "unhighlight",
              cell: (props) => (
                <button
                  className="button is-small is-rounded apButtonNeutral"
                  onClick={() =>
                    onUnhighlight(
                      props.row.original.metaGame,
                      props.row.original.id
                    )
                  }
                  title={t("gameMarks.unhighlight")}
                >
                  <span className="icon is-small">
                    <i className="fa fa-bookmark"></i>
                  </span>
                </button>
              ),
            }),
          ]
        : []),
    ],
    [columnHelper, allUsers, isOwnProfile, onUnhighlight, t]
  );

  return (
    <DataTable
      {...PROFILE_TABLE_PROPS}
      data={data}
      columns={columns}
      sort={
        SHOW_HIGHLIGHTS_END_DATE
          ? [{ id: "gameEnded", desc: true }]
          : [{ id: "gameName", desc: false }]
      }
      key="Player|Highlights"
    />
  );
}

function Highlights({ pinned, onTogglePin }) {
  const [user] = useContext(ProfileContext);
  const globalMe = useStore((state) => state.globalMe);
  const allUsers = useStore((state) => state.users);
  const [highlights, highlightsSetter] = useState(null);
  const { t } = useTranslation();
  const isOwnProfile = globalMe?.id === user?.id;

  const fetchHighlights = useCallback(async () => {
    try {
      const url = new URL(API_ENDPOINT_OPEN);
      url.searchParams.append("query", "player_highlights");
      url.searchParams.append("userId", user.id);
      const res = await fetch(url);
      const result = await res.json();
      highlightsSetter(Array.isArray(result) ? result : []);
    } catch (error) {
      console.log(error);
      highlightsSetter([]);
    }
  }, [user.id]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  const handleUnhighlight = useCallback(
    async (metaGame, gameId) => {
      const res = await unhighlightGame({ metaGame, id: gameId });
      if (res.cancelled) return;
      if (!res.ok) {
        toast.error(res.error || t("Error"));
        return;
      }
      highlightsSetter((prev) =>
        prev ? prev.filter((g) => g.id !== gameId) : []
      );
    },
    [t]
  );

  if (highlights === null || highlights.length === 0) {
    return null;
  }

  return (
    <ProfileModule
      code="highlights"
      nameKey="player.modules.highlights"
      pinned={pinned}
      onTogglePin={onTogglePin}
      Component={HighlightsTable}
      componentProps={{
        highlights,
        user,
        allUsers,
        isOwnProfile,
        onUnhighlight: handleUnhighlight,
      }}
    />
  );
}

export default Highlights;
