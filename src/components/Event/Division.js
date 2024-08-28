import { useState, useEffect, useContext, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Auth } from "aws-amplify";
import { API_ENDPOINT_AUTH } from "../../config";
import { cloneDeep } from "lodash";
import invariant from "tiny-invariant";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { UsersContext } from "../../pages/Skeleton";

function Division({ event, setRefresh }) {
  const { t } = useTranslation();
  const [allUsers] = useContext(UsersContext);
  const [unassigned, setUnassigned] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [canSave, setCanSave] = useState(false);

  // set prop-dependent state
  useEffect(() => {
    if (event !== null && event !== undefined) {
      // get list of players, initially sorted by display name
      const playerids = event.players.map((p) => p.playerid);
      const players = allUsers
        ?.filter((u) => playerids.includes(u.id))
        .sort((a, b) => a.name.localeCompare(b.name));
      setUnassigned(players);
    }
  }, [event, allUsers]);

  const addDivision = () => {
    setDivisions((val) => [...val, []]);
  };

  const delDivision = (idx) => {
    const toAdd = [];
    for (const entry of divisions[idx]) {
      if (unassigned.find((u) => u.id === entry.id) === undefined) {
        toAdd.push(entry);
      }
    }
    setUnassigned((val) => [...val, ...toAdd]);
    setDivisions((val) => [...val.slice(0, idx), ...val.slice(idx + 1)]);
  };

  useEffect(() => {
    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) {
          // if dropped outside of any drop targets
          return;
        }
        const destinationIndex = destination.data.index;
        const sourceId = source.data.id;
        const sourceName = source.data.name;

        // if the target does not already have this name
        let canDrop = false;
        if (destinationIndex === null) {
          if (unassigned.find((u) => u.id === sourceId) === undefined) {
            canDrop = true;
          }
        } else {
          const division = divisions[destinationIndex];
          if (division.find((u) => u.id === sourceId) === undefined) {
            canDrop = true;
          }
        }

        if (canDrop) {
          let tmpUnassigned = cloneDeep(unassigned);
          let tmpDivisions = cloneDeep(divisions);
          // remove this player from all lists
          tmpUnassigned = tmpUnassigned.filter((u) => u.id !== sourceId);
          tmpDivisions = tmpDivisions.map((div) => [
            ...div.filter((u) => u.id !== sourceId),
          ]);
          // now add them where they belongs
          if (destinationIndex === null) {
            tmpUnassigned.push({ id: sourceId, name: sourceName });
          } else {
            tmpDivisions[destinationIndex].push({
              id: sourceId,
              name: sourceName,
            });
          }
          setUnassigned(tmpUnassigned);
          setDivisions(tmpDivisions);
        }
      },
    });
  }, [divisions, unassigned]);

  useEffect(() => {
    if (
      divisions.length >= 2 &&
      Math.min(...divisions.map((d) => d.length)) > 1 &&
      unassigned.length === 0
    ) {
      setCanSave(true);
    } else {
      setCanSave(false);
    }
  }, [divisions, unassigned]);

  const saveDivisions = () => {
    const payload = divisions.map((d) => d.map((u) => u.id));
    console.log(`About to save the following divisions:`, payload);
    async function assignDivisions(pairings) {
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
            query: "event_update_divisions",
            pars: {
              eventid: event.event.sk,
              divisions: payload,
            },
          }),
        });
        if (res.status !== 200) {
          console.log(
            `An error occurred assigning divisions: ${JSON.stringify(res)}`
          );
          return false;
        } else {
          return true;
        }
      } catch (error) {
        console.log(
          `An error occurred assigning divisions: ${JSON.stringify(error)}`
        );
        return false;
      }
    }
    if (payload.length > 1) {
      assignDivisions(payload).then((success) => {
        if (success) {
          setRefresh((val) => val + 1);
        }
      });
    }
  };

  return (
    <>
      <h2 className="subtitle lined">
        <span>Divisions</span>
      </h2>
      <div className="container">
        <div className="content">
          <p>
            Unless you have a large number of players (typically more than 16),
            divisions are not necessary. In which case, you can simply ignore
            this screen, and once you pair your games, this screen will stop
            appearing.
          </p>
          <p>
            But if you want to create divisions, click the Add or Remove
            Division buttons and then click and drag players to assign them. You
            must save the division assignments before pairing. Once you create
            games, changing division assignments is not possible.
          </p>
        </div>
        <div className="field">
          <div className="control">
            <button className="button is-small apButton" onClick={addDivision}>
              Add division
            </button>
          </div>
        </div>
        <div className="columns is-multiline">
          {/* Unassigned players */}
          <DivisionTarget
            num={null}
            players={unassigned}
            noRemove={true}
            key={`division|unassigned`}
          />
          {/* Actual divisions */}
          {divisions.map((div, idx) => (
            <DivisionTarget
              num={idx}
              players={div}
              delDivision={delDivision}
              key={`division|${idx}`}
            />
          ))}
        </div>
        <div className="field">
          <div className="control">
            <button
              className="button is-small apButton"
              onClick={saveDivisions}
              disabled={!canSave}
            >
              Save divisions
            </button>
            {canSave ? null : (
              <p className="help is-danger">
                To save divisions, you must have at least two, each division
                must have at least two players, and all players must be
                assigned.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Division;

function NameEntry({ name, userid }) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    invariant(el);

    return draggable({
      element: el,
      getInitialData: () => ({ id: userid, name }),
      onDragStart: () => setDragging(true),
      onDrop: () => setDragging(false),
    });
  }, [name, userid]);

  return (
    <div
      className={dragging ? "sortableItemDragged" : "sortableItem"}
      ref={ref}
    >
      {name}
    </div>
  );
}

function DivisionTarget({ num, players, delDivision, noRemove = false }) {
  const ref = useRef(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    invariant(el);

    return dropTargetForElements({
      element: el,
      getData: () => ({ index: num }),
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: () => setIsDraggedOver(false),
    });
  }, [num]);

  const style = { minHeight: "5em" };

  return (
    <div className="column" ref={ref}>
      <h3 className="subtitle">
        {num === null ? "Unassigned" : `Division ${num + 1}`}
      </h3>
      <div
        style={
          isDraggedOver ? { ...style, backgroundColor: "#eee" } : { ...style }
        }
      >
        {players
          .map((u) => (
            <NameEntry name={u.name} userid={u.id} key={`nameEntry|${u.id}`} />
          ))
          .reduce(
            (acc, x) =>
              acc === null ? (
                x
              ) : (
                <>
                  {acc} {x}
                </>
              ),
            null
          )}
      </div>
      {noRemove ? null : (
        <div className="control">
          <button
            className="button is-small apButtonAlert"
            onClick={() => delDivision(num)}
          >
            Remove division
          </button>
        </div>
      )}
    </div>
  );
}
