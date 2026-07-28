import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import Plot from "react-plotly.js";
import Modal from "../Modal";
import TableSkeleton from "./TableSkeleton";
import { useStore } from "../../stores";
import { formatUserDisplayName } from "../Bots/botUtils";
import { useTranslation } from "react-i18next";

function PlayerStats({ nav }) {
  const summary = useStore((state) => state.summary);
  const globalMe = useStore((state) => state.globalMe);
  const userNames = useStore((state) => state.users);
  const [joined, joinedSetter] = useState([]);
  const [activeChartModal, activeChartModalSetter] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    const lst = [];
    for (const obj of summary.players.allPlays) {
      const eclectic = summary.players.eclectic.find(
        (u) => u.user === obj.user
      );
      const social = summary.players.social.find((u) => u.user === obj.user);
      const histogram = summary.histograms.players.find(
        (x) => x.user === obj.user
      ).value;
      let histShort = histogram.slice(-10);
      while (histShort.length < 10) {
        histShort = [0, ...histShort];
      }
      const h = summary.players.h.find((u) => u.user === obj.user).value;
      const hOpp = summary.players.hOpp.find((u) => u.user === obj.user).value;
      lst.push({
        user: obj.user,
        plays: obj.value,
        eclectic: eclectic.value,
        social: social.value,
        histogram,
        histShort,
        h,
        hOpp,
      });
      joinedSetter(lst);
    }
  }, [summary]);

  const openChartModal = (chart) => {
    activeChartModalSetter(chart);
    window.dispatchEvent(new Event("resize"));
  };

  const closeChartModal = () => {
    activeChartModalSetter("");
  };

  const data = useMemo(
    () =>
      joined
        .map(
          ({
            user: userid,
            plays,
            eclectic,
            social,
            histogram,
            histShort,
            h,
            hOpp,
          }) => {
            let name = "UNKNOWN";
            const user = userNames.find((u) => u.id === userid);
            if (user !== undefined) {
              name = user.name;
            }
            return {
              id: userid,
              name,
              plays,
              eclectic,
              social,
              histogram,
              histShort,
              h,
              hOpp,
            };
          }
        )
        .sort((a, b) => b.plays - a.plays),
    [joined, userNames]
  );

  useEffect(() => {
    console.log(data);
  }, [data]);

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: t("tables.player"),
        cell: (props) => {
          const displayName = formatUserDisplayName(
            userNames.find((u) => u.id === props.row.original.id) ?? {
              id: props.row.original.id,
              name: props.getValue(),
            },
            userNames
          );
          return globalMe !== null && globalMe.id === props.row.original.id ? (
            <Link to={`/player/${props.row.original.id}`}>
              <span className="bolder highlight">{displayName}</span>
            </Link>
          ) : (
            <Link to={`/player/${props.row.original.id}`}>{displayName}</Link>
          );
        },
      }),
      columnHelper.accessor("plays", {
        header: t("tables.totalPlays"),
      }),
      columnHelper.accessor("h", {
        header: t("tables.hIndex"),
      }),
      columnHelper.accessor("eclectic", {
        header: t("tables.differentGames"),
      }),
      columnHelper.accessor("hOpp", {
        header: t("tables.hIndexOpponents"),
      }),
      columnHelper.accessor("social", {
        header: t("tables.differentOpponents"),
      }),
      columnHelper.accessor("histogram", {
        header: t("tables.histogram"),
        cell: (props) => (
          <>
            <div
              style={{ width: "10em" }}
              onClick={() => openChartModal(props.row.original.id)}
            >
              <ul className="miniChart" key={props.row.original.id}>
                {props.row.original.histShort.map((n, i) => {
                  const histMax = Math.max(...props.row.original.histogram);
                  return (
                    <li key={`${props.row.original.id}|${i}`}>
                      <span
                        style={{ height: `${(n / histMax) * 100}%` }}
                      ></span>
                    </li>
                  );
                })}
              </ul>
            </div>
            <Modal
              buttons={[{ label: "Close", action: closeChartModal }]}
              show={
                activeChartModal !== "" &&
                activeChartModal === props.row.original.id
              }
              title={`Histogram for ${formatUserDisplayName(
                userNames.find((u) => u.id === props.row.original.id) ?? {
                  id: props.row.original.id,
                  name: props.row.original.name,
                },
                userNames
              )}`}
            >
              <div style={{ overflow: "hidden" }}>
                <Plot
                  data={[
                    {
                      y: [...props.getValue()],
                      type: "bar",
                    },
                  ]}
                  config={{
                    responsive: true,
                    displayModeBar: false,
                  }}
                  layout={{
                    xaxis: { title: "Week #" },
                    yaxis: { title: "Completed games" },
                    margin: {
                      r: 160,
                    },
                  }}
                />
              </div>
            </Modal>
          </>
        ),
        enableSorting: false,
      }),
    ],
    [columnHelper, globalMe, activeChartModal, userNames, t]
  );

  return (
    <TableSkeleton
      nav={nav}
      data={data}
      columns={columns}
      sort={[{ id: "plays", desc: true }]}
    />
  );
}

export default PlayerStats;
