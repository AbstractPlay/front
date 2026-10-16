import { toast } from "react-toastify";

export default function DashboardAdminContent({
  genericInput,
  onGenericInputChange,
  onOneTimeFix,
  onFixGames,
  onEndTournament,
  onDeleteGames,
  onTestPush,
  onTestBotStatus,
  onUpdateMetaGameCounts,
}) {
  return (
    <div className="indentedContainer dashboard-admin-panel">
      <div className="control">
        <input
          id="genericInput"
          type="text"
          value={genericInput}
          onChange={(e) => onGenericInputChange(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="button is-small apButton"
        onClick={onOneTimeFix}
      >
        One time fix
      </button>
      <button
        type="button"
        className="button is-small apButton"
        onClick={onFixGames}
      >
        Fix user&apos;s games
      </button>
      <button
        type="button"
        className="button is-small apButton"
        onClick={onEndTournament}
      >
        End Tournament
      </button>
      <button
        type="button"
        className="button is-small apButton"
        onClick={onDeleteGames}
      >
        Delete games!
      </button>
      <button
        type="button"
        className="button is-small apButton"
        onClick={onTestPush}
      >
        Test push notifications
      </button>
      <button
        type="button"
        className="button is-small apButton"
        onClick={onTestBotStatus}
      >
        Test bot status
      </button>
      <button
        type="button"
        className="button is-small apButton"
        onClick={() => toast("Toast test!")}
      >
        Test toast
      </button>
      <button
        type="button"
        className="button is-small apButton"
        onClick={onUpdateMetaGameCounts}
      >
        Update meta game counts
      </button>
    </div>
  );
}
