import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import NavDropdownPanel from "./NavDropdownPanel";
import {
  buildGameBrowseEntries,
  filterGameOptions,
  rankGameSearchResults,
} from "../lib/gameOptions";

/** Navbar magnifying glass: find a game by title and jump to its page. */
function GameSearch({ closeBurger }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  // The navbar renders one instance for desktop and one for mobile.
  const listId = useId();
  const triggerRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const games = useMemo(
    () => (open ? buildGameBrowseEntries({ locale: i18n.language }) : []),
    [open, i18n.language]
  );
  const results = useMemo(
    () => rankGameSearchResults(filterGameOptions(games, { query }), query),
    [games, query]
  );
  const hasQuery = query.trim() !== "";

  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView?.({
      block: "nearest",
    });
  }, [activeIndex]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const toggle = () => {
    if (open) {
      close();
    } else {
      closeBurger();
      setOpen(true);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length > 0) {
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex(
          (index) => (index + step + results.length) % results.length
        );
      }
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      navigate(`/games/${results[activeIndex].id}`);
      close();
    } else if (event.key === "Escape") {
      close();
      triggerRef.current?.focus();
    }
  };

  return (
    <NavDropdownPanel open={open} onClose={close}>
      <button
        ref={triggerRef}
        type="button"
        className="nav-icon-btn"
        aria-label={t("a11y.searchGames")}
        aria-expanded={open}
        title={t("a11y.searchGames")}
        onClick={toggle}
      >
        <span className="icon">
          <i className="fa fa-search" aria-hidden="true"></i>
        </span>
      </button>
      {open ? (
        <div className="nav-dropdown-panel game-search-panel">
          <input
            className="input"
            type="search"
            role="combobox"
            aria-label={t("a11y.searchGames")}
            aria-autocomplete="list"
            aria-expanded={hasQuery && results.length > 0}
            aria-controls={listId}
            aria-activedescendant={
              results[activeIndex] ? `${listId}-${activeIndex}` : undefined
            }
            autoComplete="off"
            autoFocus
            placeholder={t("gameSearch.placeholder")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <ul
            ref={listRef}
            id={listId}
            className="game-search-results"
            role="listbox"
            aria-label={t("a11y.searchGames")}
          >
            {results.map((game, index) => (
              <li key={game.id} role="presentation">
                <Link
                  id={`${listId}-${index}`}
                  to={`/games/${game.id}`}
                  className={
                    index === activeIndex
                      ? "game-search-result is-active"
                      : "game-search-result"
                  }
                  role="option"
                  aria-selected={index === activeIndex}
                  tabIndex={-1}
                  onClick={close}
                  onMouseMove={() => setActiveIndex(index)}
                >
                  <span className="game-search-result-name">{game.name}</span>
                  {game.designers ? (
                    <span className="game-search-result-designers">
                      {game.designers}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          {hasQuery && results.length === 0 ? (
            <p className="game-search-empty">{t("gamePicker.noResults")}</p>
          ) : null}
        </div>
      ) : null}
    </NavDropdownPanel>
  );
}

export default GameSearch;
