import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Maximize2, Minimize2, Pause, Play, Settings2 } from 'lucide-react';
import type { Card, Deck, DisplayMode, LanguageMode, OrderMode } from './types';
import { buildQueue, clampIndex, nextIndex, prevIndex, progressLabel } from './utils/queue';
import { isImportPayload, loadAppState, mergeDecks, saveAppState } from './utils/storage';

const DEFAULT_AUTOPLAY_INTERVAL_SEC = 3;
const ACTIVE_TAB_STORAGE_KEY = 'flashcards.ui.activeTab.v1';

type AppTab = 'play' | 'manage';

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function supportsNativeFullscreen(): boolean {
  return typeof document !== 'undefined' && document.fullscreenEnabled;
}

export default function App() {
  const [state, setState] = useState(loadAppState);
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (typeof window === 'undefined') return 'play';
    const stored = window.localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    return stored === 'manage' ? 'manage' : 'play';
  });
  const [languageMode, setLanguageMode] = useState<LanguageMode>('front-to-back');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('front-only');
  const [orderMode, setOrderMode] = useState<OrderMode>('sequential');
  const [shuffleMode, setShuffleMode] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [autoplayIntervalSec, setAutoplayIntervalSec] = useState<number>(DEFAULT_AUTOPLAY_INTERVAL_SEC);
  const [showAnswer, setShowAnswer] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [deckNameInput, setDeckNameInput] = useState('');
  const [cardFrontInput, setCardFrontInput] = useState('');
  const [cardBackInput, setCardBackInput] = useState('');
  const [cardFilterQuery, setCardFilterQuery] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFrontInput, setEditFrontInput] = useState('');
  const [editBackInput, setEditBackInput] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [statusMessage, setStatusMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isOptionsSheetOpen, setIsOptionsSheetOpen] = useState(false);
  const [autoplayRemainRatio, setAutoplayRemainRatio] = useState(1);
  const slideRef = useRef<HTMLDivElement | null>(null);
  const frontInputRef = useRef<HTMLInputElement | null>(null);
  const backInputRef = useRef<HTMLInputElement | null>(null);
  const autoplayCycleStartRef = useRef<number | null>(null);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.dataset.theme = prefersDark ? 'dark' : 'light';
    } else {
      root.dataset.theme = state.theme;
    }
  }, [state.theme]);

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) return;
      setIsFocusMode(false);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
    if (activeTab !== 'play') {
      setIsOptionsSheetOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const className = 'app-scroll-lock';
    if (isFocusMode || isOptionsSheetOpen) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }
    return () => document.body.classList.remove(className);
  }, [isFocusMode, isOptionsSheetOpen]);

  const selectedDeck = useMemo(
    () => state.decks.find((deck) => deck.id === state.selectedDeckId) ?? null,
    [state.decks, state.selectedDeckId]
  );
  const totalCardCount = useMemo(
    () => state.decks.reduce((sum, deck) => sum + deck.cards.length, 0),
    [state.decks]
  );
  const filteredCards = useMemo(() => {
    if (!selectedDeck) return [];
    const query = cardFilterQuery.trim().toLowerCase();
    if (!query) return selectedDeck.cards;
    return selectedDeck.cards.filter(
      (card) =>
        card.front.toLowerCase().includes(query) || card.back.toLowerCase().includes(query)
    );
  }, [cardFilterQuery, selectedDeck]);

  const queue = useMemo(() => {
    if (!selectedDeck) return [];
    return buildQueue(selectedDeck.cards, orderMode, shuffleMode, selectedDeck.cards.length || 1);
  }, [selectedDeck, orderMode, shuffleMode]);

  const activeCard = queue[clampIndex(queueIndex, queue.length)] ?? null;

  useEffect(() => {
    setQueueIndex((current) => clampIndex(current, queue.length));
  }, [queue.length]);

  useEffect(() => {
    setCardFilterQuery('');
    setEditingCardId(null);
    setEditFrontInput('');
    setEditBackInput('');
  }, [selectedDeck?.id]);

  useEffect(() => {
    if (!autoplay || queue.length === 0) {
      setAutoplayRemainRatio(1);
      autoplayCycleStartRef.current = null;
      return;
    }

    autoplayCycleStartRef.current = Date.now();
    setAutoplayRemainRatio(1);

    const id = window.setInterval(() => {
      setQueueIndex((current) => nextIndex(current, queue.length));
      setShowAnswer(false);
    }, autoplayIntervalSec * 1000);
    return () => window.clearInterval(id);
  }, [autoplay, autoplayIntervalSec, queue.length]);

  useEffect(() => {
    if (!autoplay || queue.length === 0) return;

    autoplayCycleStartRef.current = Date.now();
    setAutoplayRemainRatio(1);

    const tick = window.setInterval(() => {
      const startedAt = autoplayCycleStartRef.current;
      if (!startedAt) return;
      const elapsed = Date.now() - startedAt;
      const remain = Math.max(0, 1 - elapsed / (autoplayIntervalSec * 1000));
      setAutoplayRemainRatio(remain);
    }, 50);

    return () => window.clearInterval(tick);
  }, [autoplay, autoplayIntervalSec, queue.length, queueIndex]);

  const updateDecks = (updater: (decks: Deck[]) => Deck[], selectedDeckId?: string | null) => {
    setState((current) => {
      const decks = updater(current.decks);
      const fallbackSelected = decks[0]?.id ?? null;
      const nextSelected = selectedDeckId ?? current.selectedDeckId;
      const resolvedSelected = decks.some((deck) => deck.id === nextSelected)
        ? nextSelected
        : fallbackSelected;
      return { ...current, decks, selectedDeckId: resolvedSelected };
    });
  };

  const setSelectedDeck = (deckId: string | null) => {
    setState((current) => ({ ...current, selectedDeckId: deckId }));
    setQueueIndex(0);
    setShowAnswer(false);
    setAutoplay(false);
  };

  const createDeck = () => {
    const name = deckNameInput.trim();
    if (!name) return;
    const timestamp = nowIso();
    const deck: Deck = {
      id: uid(),
      name,
      cards: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    updateDecks((decks) => [...decks, deck], deck.id);
    setDeckNameInput('');
    setStatusMessage('덱이 생성되었습니다.');
  };

  const renameDeck = (name: string) => {
    if (!selectedDeck) return;
    updateDecks((decks) =>
      decks.map((deck) =>
        deck.id === selectedDeck.id ? { ...deck, name, updatedAt: nowIso() } : deck
      )
    );
  };

  const deleteDeck = () => {
    if (!selectedDeck) return;
    if (!window.confirm('현재 덱을 삭제할까요?')) return;
    updateDecks((decks) => decks.filter((deck) => deck.id !== selectedDeck.id));
    setStatusMessage('덱이 삭제되었습니다.');
    setQueueIndex(0);
    setShowAnswer(false);
    setAutoplay(false);
  };

  const addCard = (): boolean => {
    if (!selectedDeck) return false;
    const front = cardFrontInput.trim();
    const back = cardBackInput.trim();
    if (!front || !back) return false;

    const card: Card = { id: uid(), front, back };
    updateDecks((decks) =>
      decks.map((deck) =>
        deck.id === selectedDeck.id
          ? { ...deck, cards: [...deck.cards, card], updatedAt: nowIso() }
          : deck
      )
    );
    setCardFrontInput('');
    setCardBackInput('');
    setStatusMessage('카드가 추가되었습니다.');
    return true;
  };

  const handleFrontInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    backInputRef.current?.focus();
  };

  const handleBackInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const added = addCard();
    if (added) {
      window.setTimeout(() => frontInputRef.current?.focus(), 0);
    }
  };

  const handleAddCardClick = () => {
    const added = addCard();
    if (added) {
      window.setTimeout(() => frontInputRef.current?.focus(), 0);
    }
  };

  const clearCardInputs = () => {
    setCardFrontInput('');
    setCardBackInput('');
    window.setTimeout(() => frontInputRef.current?.focus(), 0);
  };

  const startEditCard = (card: Card) => {
    setEditingCardId(card.id);
    setEditFrontInput(card.front);
    setEditBackInput(card.back);
  };

  const cancelEditCard = () => {
    setEditingCardId(null);
    setEditFrontInput('');
    setEditBackInput('');
  };

  const saveEditCard = () => {
    if (!selectedDeck || !editingCardId) return;
    const front = editFrontInput.trim();
    const back = editBackInput.trim();
    if (!front || !back) return;

    updateDecks((decks) =>
      decks.map((deck) => {
        if (deck.id !== selectedDeck.id) return deck;
        return {
          ...deck,
          updatedAt: nowIso(),
          cards: deck.cards.map((card) =>
            card.id === editingCardId ? { ...card, front, back } : card
          )
        };
      })
    );

    setStatusMessage('카드가 수정되었습니다.');
    cancelEditCard();
  };

  const deleteCard = (cardId: string) => {
    if (!selectedDeck) return;
    updateDecks((decks) =>
      decks.map((deck) =>
        deck.id === selectedDeck.id
          ? {
              ...deck,
              updatedAt: nowIso(),
              cards: deck.cards.filter((card) => card.id !== cardId)
            }
          : deck
      )
    );
    setStatusMessage('카드가 삭제되었습니다.');
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setState((current) => ({ ...current, theme }));
  };

  const exportJson = () => {
    const payload = JSON.stringify({ decks: state.decks }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `flashcards-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage('JSON 내보내기 완료');
  };

  const importJson = async (file: File | null) => {
    if (!file) return;

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      if (!isImportPayload(parsed)) {
        setStatusMessage('JSON 형식이 올바르지 않습니다.');
        return;
      }

      setState((current) => {
        const decks = importMode === 'overwrite' ? parsed.decks : mergeDecks(current.decks, parsed.decks);
        return {
          ...current,
          decks,
          selectedDeckId: decks[0]?.id ?? null
        };
      });
      setStatusMessage(importMode === 'overwrite' ? '덮어쓰기 가져오기 완료' : '병합 가져오기 완료');
      setQueueIndex(0);
      setShowAnswer(false);
      setAutoplay(false);
    } catch {
      setStatusMessage('JSON 파싱 실패');
    }
  };

  const nextCard = () => {
    setQueueIndex((current) => nextIndex(current, queue.length));
    setShowAnswer(false);
  };

  const prevCard = () => {
    setQueueIndex((current) => prevIndex(current, queue.length));
    setShowAnswer(false);
  };

  const togglePresentationMode = useCallback(async () => {
    if (isFocusMode) {
      setIsFocusMode(false);
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    if (!slideRef.current || queue.length === 0) return;

    if (supportsNativeFullscreen()) {
      try {
        await slideRef.current.requestFullscreen();
        return;
      } catch {
        setIsFocusMode(true);
        setStatusMessage('브라우저 제한으로 포커스 모드로 전환했습니다.');
        return;
      }
    }

    setIsFocusMode(true);
  }, [isFocusMode, queue.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOptionsSheetOpen) {
        setIsOptionsSheetOpen(false);
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target) {
        const tagName = target.tagName;
        if (target.isContentEditable || tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
          return;
        }
      }

      if (event.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
        return;
      }

      if (event.key.toLowerCase() === 'f') {
        void togglePresentationMode();
        return;
      }

      if (!selectedDeck || queue.length === 0) return;

      if (event.key === 'ArrowRight') {
        setQueueIndex((current) => nextIndex(current, queue.length));
        setShowAnswer(false);
      } else if (event.key === 'ArrowLeft') {
        setQueueIndex((current) => prevIndex(current, queue.length));
        setShowAnswer(false);
      } else if (event.key === ' ') {
        event.preventDefault();
        setShowAnswer((current) => !current);
      } else if (event.key.toLowerCase() === 'p') {
        setAutoplay((current) => !current);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFocusMode, isOptionsSheetOpen, queue.length, selectedDeck, togglePresentationMode]);

  const questionText =
    activeCard && languageMode === 'front-to-back' ? activeCard.front : activeCard?.back ?? '';
  const answerText =
    activeCard && languageMode === 'front-to-back' ? activeCard.back : activeCard?.front ?? '';

  const mainText =
    displayMode === 'flip' ? (showAnswer ? answerText : questionText) : questionText;
  const secondaryText = displayMode === 'front-only' && showAnswer ? answerText : '';

  const fullscreenAriaLabel = isFullscreen || isFocusMode ? '포커스 모드 또는 전체화면 종료' : '포커스 모드 또는 전체화면 시작';
  const currentProgress = queue.length === 0 ? 0 : clampIndex(queueIndex, queue.length) + 1;
  const progressPercent = queue.length === 0 ? 0 : (currentProgress / queue.length) * 100;

  return (
    <main className={`app${isFocusMode ? ' focus-mode' : ''}`}>
      <header className="topbar">
        <nav className="top-tabs" aria-label="화면 전환">
          <button
            type="button"
            className={`tab-button${activeTab === 'play' ? ' active' : ''}`}
            onClick={() => setActiveTab('play')}
            aria-pressed={activeTab === 'play'}
          >
            플레이
          </button>
          <button
            type="button"
            className={`tab-button${activeTab === 'manage' ? ' active' : ''}`}
            onClick={() => setActiveTab('manage')}
            aria-pressed={activeTab === 'manage'}
          >
            설정
          </button>
        </nav>
      </header>

      {activeTab === 'play' && (
        <section className="panel hero-panel" ref={slideRef} aria-label="슬라이드쇼 영역">
          <div className="slide-stage" aria-live="polite">
            {!activeCard && <p className="empty-slide">카드를 추가하면 슬라이드가 시작됩니다.</p>}
            {activeCard && (
              <>
                <p className="slide-main">{mainText}</p>
                {secondaryText && <p className="slide-sub">{secondaryText}</p>}
              </>
            )}
          </div>

          <div className="progress-wrap" aria-label="학습 진행률">
            <div className="progress-head">
              <span>{selectedDeck?.name ?? '덱 없음'}</span>
              <span>{progressLabel(queueIndex, queue.length)}</span>
            </div>
            <div
              className="progress-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={Math.max(queue.length, 1)}
              aria-valuenow={currentProgress}
            >
              <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="thumb-controls" role="group" aria-label="슬라이드 기본 조작">
            <button onClick={prevCard} disabled={queue.length === 0} aria-label="이전 카드">
              이전
            </button>
            <button
              onClick={() => setShowAnswer((current) => !current)}
              disabled={queue.length === 0}
              aria-label="카드 뒤집기 또는 정답 보기"
            >
              뒤집기
            </button>
            <button onClick={nextCard} disabled={queue.length === 0} aria-label="다음 카드">
              다음
            </button>
          </div>

          <div className="control-strip" role="group" aria-label="옵션 및 재생 제어">
            <button
              type="button"
              className="sheet-open-button"
              onClick={() => setIsOptionsSheetOpen(true)}
              aria-label="옵션 열기"
            >
              <Settings2 size={16} />
              <span>옵션</span>
            </button>
            <button
              type="button"
              className={`icon-button autoplay-toggle${autoplay ? ' running' : ''}`}
              onClick={() => setAutoplay((current) => !current)}
              disabled={queue.length === 0}
              aria-label={autoplay ? '자동재생 정지 (단축키 P)' : '자동재생 시작 (단축키 P)'}
              title={autoplay ? '자동재생 정지 (P)' : '자동재생 시작 (P)'}
            >
              {autoplay ? <Pause size={18} strokeWidth={2.4} /> : <Play size={18} strokeWidth={2.4} />}
            </button>
            <button
              type="button"
              className="icon-button"
              onClick={() => void togglePresentationMode()}
              disabled={queue.length === 0}
              aria-label={fullscreenAriaLabel}
              title={fullscreenAriaLabel}
            >
              {isFullscreen || isFocusMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>

          {autoplay && queue.length > 0 && (
            <div className="autoplay-timer" aria-label="자동재생 남은 시간">
              <span className="autoplay-timer-fill" style={{ transform: `scaleX(${autoplayRemainRatio})` }} />
            </div>
          )}

          <section className="deck-selector panel" aria-label="플레이 덱 선택">
            <div className="deck-selector-head">
              <p className="deck-selector-title">현재 덱</p>
              <span className="badge">{selectedDeck ? `${selectedDeck.cards.length}단어` : '덱 없음'}</span>
            </div>
            <div className="deck-selector-controls">
              <select
                aria-label="슬라이드쇼 덱 선택"
                value={state.selectedDeckId ?? ''}
                onChange={(event) => setSelectedDeck(event.target.value || null)}
              >
                <option value="">덱 선택</option>
                {state.decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name} ({deck.cards.length}단어)
                  </option>
                ))}
              </select>
              <div className="deck-chips" role="group" aria-label="빠른 덱 전환">
                {state.decks.slice(0, 4).map((deck) => (
                  <button
                    key={deck.id}
                    type="button"
                    className={`chip${deck.id === state.selectedDeckId ? ' active' : ''}`}
                    onClick={() => setSelectedDeck(deck.id)}
                  >
                    {deck.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {isOptionsSheetOpen && (
            <div
              className="sheet-backdrop"
              onClick={() => setIsOptionsSheetOpen(false)}
            >
              <section
                className="settings-sheet"
                aria-label="플레이 옵션"
                role="dialog"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="settings-sheet-head">
                  <h2>플레이 옵션</h2>
                  <button
                    type="button"
                    className="icon-button close"
                    onClick={() => setIsOptionsSheetOpen(false)}
                    aria-label="옵션 닫기"
                  >
                    ✕
                  </button>
                </div>
                <div className="slide-options" role="group" aria-label="슬라이드 옵션">
                  <button
                    type="button"
                    className="option-toggle"
                    onClick={() =>
                      setLanguageMode((current) =>
                        current === 'front-to-back' ? 'back-to-front' : 'front-to-back'
                      )
                    }
                  >
                    <span className="option-icon">⇄</span>
                    <span>언어 {languageMode === 'front-to-back' ? '앞→뒤' : '뒤→앞'}</span>
                  </button>
                  <button
                    type="button"
                    className="option-toggle"
                    onClick={() =>
                      setDisplayMode((current) => (current === 'front-only' ? 'flip' : 'front-only'))
                    }
                  >
                    <span className="option-icon">◫</span>
                    <span>표시 {displayMode === 'front-only' ? '앞+정답' : '플립'}</span>
                  </button>
                  <button
                    type="button"
                    className="option-toggle"
                    onClick={() =>
                      setOrderMode((current) => (current === 'sequential' ? 'reverse' : 'sequential'))
                    }
                  >
                    <span className="option-icon">↕</span>
                    <span>순서 {orderMode === 'sequential' ? '정순' : '역순'}</span>
                  </button>
                  <button
                    type="button"
                    className={`option-toggle${shuffleMode ? ' active' : ''}`}
                    onClick={() => setShuffleMode((current) => !current)}
                    aria-pressed={shuffleMode}
                  >
                    <span className="option-icon">🔀</span>
                    <span>셔플 {shuffleMode ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                <div className="interval-options" role="group" aria-label="자동재생 간격">
                  <span className="interval-label">자동재생 간격</span>
                  {[3, 5, 7].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={`interval-chip${autoplayIntervalSec === sec ? ' active' : ''}`}
                      onClick={() => setAutoplayIntervalSec(sec)}
                      aria-pressed={autoplayIntervalSec === sec}
                    >
                      {sec}초
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          <p className="shortcut-help">⌨ ←/→ 이동 · Space 뒤집기 · P 재생/정지 · F 전체화면 · Esc 종료</p>
        </section>
      )}

      {activeTab === 'manage' && (
        <section className="manage-screen" aria-label="고급 관리">
          <section className="panel deck-shelf-panel" aria-label="덱 선택">
            <div className="manage-summary-head">
              <div>
                <p className="manage-summary-label">Step 1</p>
                <h2>먼저 덱을 선택하세요</h2>
              </div>
              <span className="badge">{state.decks.length}개 덱</span>
            </div>
            <div className="deck-list" role="listbox" aria-label="덱 목록 선택">
              {state.decks.map((deck) => (
                <button
                  key={deck.id}
                  type="button"
                  className={`deck-list-item${deck.id === state.selectedDeckId ? ' active' : ''}`}
                  onClick={() => setSelectedDeck(deck.id)}
                  aria-selected={deck.id === state.selectedDeckId}
                >
                  <strong>{deck.name}</strong>
                  <span>{deck.cards.length}단어</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel manage-summary-panel" aria-label="선택된 덱 요약">
            <div className="manage-summary-head">
              <div>
                <p className="manage-summary-label">현재 선택된 덱</p>
                <h2>{selectedDeck?.name ?? '덱을 선택해 주세요'}</h2>
              </div>
              <span className="badge">{selectedDeck ? `${selectedDeck.cards.length}단어` : '덱 없음'}</span>
            </div>
            <div className="manage-summary-stats">
              <div className="stat-tile">
                <span className="stat-label">전체 덱</span>
                <strong>{state.decks.length}</strong>
              </div>
              <div className="stat-tile">
                <span className="stat-label">전체 카드</span>
                <strong>{totalCardCount}</strong>
              </div>
              <div className="stat-tile">
                <span className="stat-label">현재 필터 결과</span>
                <strong>{selectedDeck ? filteredCards.length : 0}</strong>
              </div>
            </div>
          </section>

          <section className="panel advanced-panel">
            <h2>덱 관리</h2>
            <div className="panel-body deck-manage-body">
              <div className="manage-group">
                <p className="group-label">새 덱 만들기</p>
                <div className="row wrap">
                  <input
                    placeholder="새 덱 이름"
                    value={deckNameInput}
                    onChange={(event) => setDeckNameInput(event.target.value)}
                  />
                  <button onClick={createDeck}>덱 생성</button>
                </div>
              </div>

              <div className="manage-group">
                <p className="group-label">선택 및 수정</p>
                <div className="row wrap">
                  <select
                    aria-label="관리용 덱 선택"
                    value={state.selectedDeckId ?? ''}
                    onChange={(event) => setSelectedDeck(event.target.value || null)}
                  >
                    <option value="">덱 선택</option>
                    {state.decks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.name} ({deck.cards.length}단어)
                      </option>
                    ))}
                  </select>
                  <button onClick={deleteDeck} disabled={!selectedDeck}>
                    덱 삭제
                  </button>
                </div>

                {selectedDeck && (
                  <div className="row wrap">
                    <input
                      aria-label="선택된 덱 이름"
                      value={selectedDeck.name}
                      onChange={(event) => renameDeck(event.target.value)}
                    />
                  </div>
                )}
                {!selectedDeck && <p className="helper-text">수정하거나 카드를 추가하려면 먼저 덱을 선택하세요.</p>}
              </div>
            </div>
          </section>

          <section className="panel advanced-panel">
            <h2>카드 관리</h2>
            <div className="panel-body">
              {!selectedDeck && (
                <p className="empty-state">Step 1에서 덱을 먼저 고르면 카드 입력을 시작할 수 있어요.</p>
              )}

              {selectedDeck && (
                <>
                  <p className="group-label">Step 2 · 선택된 덱에 카드 추가</p>
                  <div className="row quick-add-row">
                    <input
                      ref={frontInputRef}
                      placeholder="앞면"
                      value={cardFrontInput}
                      onChange={(event) => setCardFrontInput(event.target.value)}
                      onKeyDown={handleFrontInputKeyDown}
                    />
                    <input
                      ref={backInputRef}
                      placeholder="뒷면"
                      value={cardBackInput}
                      onChange={(event) => setCardBackInput(event.target.value)}
                      onKeyDown={handleBackInputKeyDown}
                    />
                    <button onClick={handleAddCardClick}>카드 추가</button>
                    <button
                      type="button"
                      onClick={clearCardInputs}
                      disabled={!cardFrontInput && !cardBackInput}
                    >
                      입력 지우기
                    </button>
                  </div>
                  <p className="helper-text">Enter로 빠르게 이동/추가할 수 있습니다. 추가 후 앞면 입력칸에 자동 포커스됩니다.</p>

                  <div className="cards-toolbar">
                    <input
                      aria-label="카드 검색"
                      placeholder="카드 검색 (앞면/뒷면)"
                      value={cardFilterQuery}
                      onChange={(event) => setCardFilterQuery(event.target.value)}
                    />
                    <span className="badge">
                      {filteredCards.length}/{selectedDeck.cards.length}개 표시
                    </span>
                  </div>

                  <div className="cards-table-wrap">
                    {editingCardId && (
                      <div className="edit-card-panel">
                        <p className="group-label">선택 카드 수정</p>
                        <div className="row wrap">
                          <input
                            aria-label="수정 앞면"
                            value={editFrontInput}
                            onChange={(event) => setEditFrontInput(event.target.value)}
                          />
                          <input
                            aria-label="수정 뒷면"
                            value={editBackInput}
                            onChange={(event) => setEditBackInput(event.target.value)}
                          />
                        </div>
                        <div className="row wrap">
                          <button onClick={saveEditCard}>저장</button>
                          <button type="button" onClick={cancelEditCard}>취소</button>
                        </div>
                      </div>
                    )}

                    <div className="cards-table-body list-mode">
                      {filteredCards.length > 0 ? (
                        filteredCards.map((card) => (
                          <div key={card.id} className="card-list-item">
                            <div className="card-text">
                              <strong>{card.front}</strong>
                              <span>{card.back}</span>
                            </div>
                            <div className="card-actions">
                              <button type="button" onClick={() => startEditCard(card)}>수정</button>
                              <button
                                className="delete-icon-button"
                                onClick={() => deleteCard(card.id)}
                                aria-label="카드 삭제"
                                title="카드 삭제"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="empty-state">
                          {selectedDeck.cards.length === 0
                            ? '아직 카드가 없습니다. 위 입력창에서 첫 카드를 추가해 보세요.'
                            : '검색 결과가 없습니다. 검색어를 바꿔보세요.'}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="panel advanced-panel">
            <h2>가져오기/내보내기</h2>
            <div className="panel-body">
              <div className="row wrap">
                <label>
                  <input
                    type="radio"
                    name="import-mode"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                  />
                  병합
                </label>
                <label>
                  <input
                    type="radio"
                    name="import-mode"
                    checked={importMode === 'overwrite'}
                    onChange={() => setImportMode('overwrite')}
                  />
                  덮어쓰기
                </label>
                <input
                  type="file"
                  accept="application/json"
                  onChange={(event) => void importJson(event.target.files?.[0] ?? null)}
                />
                <button onClick={exportJson}>JSON 내보내기</button>
              </div>
            </div>
          </section>

          <section className="panel advanced-panel">
            <h2>테마</h2>
            <div className="panel-body">
              <div className="row wrap">
                <button onClick={() => setTheme('light')}>라이트</button>
                <button onClick={() => setTheme('dark')}>다크</button>
                <button onClick={() => setTheme('system')}>시스템</button>
              </div>
            </div>
          </section>
        </section>
      )}

      {statusMessage && <p className="status">{statusMessage}</p>}
    </main>
  );
}
