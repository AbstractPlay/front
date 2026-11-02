import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useStorageState } from "react-use-storage-state";

export const MIN_NUM_RECORDS_STORAGE_KEY = "stats-min-num-records";

export function parseMinNumRecords(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.floor(n);
}

export function rowMeetsMinNumRecords(row, minNumRecords) {
  if (minNumRecords <= 0) {
    return true;
  }
  return (row.n ?? 0) >= minNumRecords;
}

export function useMinNumRecordsFilter() {
  const [stored, setter] = useStorageState(MIN_NUM_RECORDS_STORAGE_KEY, 0);
  const minNumRecords = parseMinNumRecords(stored);
  const setMinNumRecords = useCallback(
    (value) => {
      setter(parseMinNumRecords(value));
    },
    [setter]
  );
  return { minNumRecords, setMinNumRecords };
}

const DEFAULT_MIN_RECORDS_INPUT_ID = "stats-min-num-records";

export function MinNumRecordsNavControl({
  value,
  onChange,
  inputId = DEFAULT_MIN_RECORDS_INPUT_ID,
}) {
  const { t } = useTranslation();
  return (
    <div className="level-item data-table-nav-min-records">
      <div className="field">
        <label className="label is-small" htmlFor={inputId}>
          {t("stats.table.minNumRecordsLabel")}
        </label>
        <div className="control">
          <input
            className="input is-small stats-min-num-records-input"
            id={inputId}
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={value === 0 ? "" : value}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                onChange(0);
                return;
              }
              onChange(parseMinNumRecords(raw));
            }}
            placeholder="0"
          />
        </div>
      </div>
    </div>
  );
}

export function useMinNumRecordsNavEnd(minNumRecords, setMinNumRecords, inputId) {
  return useCallback(
    () => (
      <MinNumRecordsNavControl
        value={minNumRecords}
        onChange={setMinNumRecords}
        inputId={inputId}
      />
    ),
    [minNumRecords, setMinNumRecords, inputId]
  );
}
