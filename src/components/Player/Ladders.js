import React, { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { LadderContext } from "../Player";
import DataTable, { PROFILE_TABLE_PROPS } from "../shared/DataTable";
import { useTranslation } from "react-i18next";
import { ladderDetailPathActive } from "../../lib/ladderRoutes";
import { ladderUiDisabled } from "../../lib/ladderUiDisabled";
import { formatLadderPoints } from "../../lib/formatLadderPoints";

function Ladders() {
  const [ladders] = useContext(LadderContext);
  const { t } = useTranslation();

  const data = useMemo(
    () =>
      (ladders ?? []).map((row) => ({
        ladderId: row.ladderId,
        displayName: row.displayName,
        rank: row.rank,
        points: row.points,
      })),
    [ladders]
  );

  const columnHelper = createColumnHelper();
  const columns = useMemo(
    () => [
      columnHelper.accessor("displayName", {
        header: t("Ladder.name"),
        cell: (props) =>
          ladderUiDisabled() ? (
            props.getValue()
          ) : (
            <Link to={ladderDetailPathActive(props.row.original.ladderId)}>
              {props.getValue()}
            </Link>
          ),
      }),
      columnHelper.accessor("rank", {
        header: t("Ladder.rank"),
      }),
      columnHelper.accessor("points", {
        header: t("Ladder.points"),
        cell: (props) => formatLadderPoints(props.getValue()),
      }),
    ],
    [columnHelper, t]
  );

  if (!data.length) {
    return null;
  }

  return <DataTable {...PROFILE_TABLE_PROPS} data={data} columns={columns} />;
}

export default Ladders;
