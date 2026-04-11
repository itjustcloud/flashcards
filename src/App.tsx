import { useEffect, useMemo, useRef, useState } from 'react';
import type { Card, Deck, DisplayMode, LanguageMode, OrderMode } from './types';
import { buildQueue, clampIndex, nextIndex, prevIndex, progressLabel } from './utils/queue';
import { isImportPayload, loadAppState, mergeDecks, saveAppState } from './utils/storage';

const AUTOPLAY_MS = 3000;

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
  const [languageMode, setLanguageMode] = useState<LanguageMode>('front-to-back');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('front-only');
  const [orderMode, setOrderMode] = useState<OrderMode>('sequential');
  const [shuffleMode, setShuffleMode] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [queueIndex, setQueueIndex] = useState(0);
  const [deckNameInput, setDeckNameInput] = useState('');
  const [cardFrontInput, setCardFrontInput] = useState('');
  const [cardBackInput, setCardBackInput] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'overwrite'>('merge');
  const [statusMessage, setStatusMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const slideRef = useRef<HTMLDivElement | null>(null);

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
    const className = 'app-scroll-lock';
    if (isFocusMode) {
      document.body.classList.add(className);
    } else {
      document.body.classList.remove(className);
    }
    return () => document.body.classList.remove(className);
  }, [isFocusMode]);

  const selectedDeck = useMemo(
    () => state.decks.find((deck) => deck.id === state.selectedDeckId) ?? null,
    [state.decks, state.selectedDeckId]
  );

  const queue = useMemo(() => {
    if (!selectedDeck) return [];
    return buildQueue(selectedDeck.cards, orderMode, shuffleMode, selectedDeck.cards.length || 1);
  }, [selectedDeck, orderMode, shuffleMode]);

  const activeCard = queue[clampIndex(queueIndex, queue.length)] ?? null;

  useEffect(() => {
    setQueueIndex((current) => clampIndex(current, queue.length));
  }, [queue.length]);

  useEffect(() => {
    if (!autoplay || queue.length === 0) return;
    const id = window.setInterval(() => {
      setQueueIndex((current) => nextIndex(current, queue.length));
      setShowAnswer(false);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [autoplay, queue.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
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
      } else if (event.key.toLowerCase() === 'f') {
        void togglePresentationMode();
      } else if (event.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

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
  };

  const addCard = () => {
    if (!selectedDeck) return;
    const front = cardFrontInput.trim();
    const back = cardBackInput.trim();
    if (!front || !back) return;

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
  };

  const updateCard = (cardId: string, key: 'front' | 'back', value: string) => {
    if (!selectedDeck) return;
    updateDecks((decks) =>
      decks.map((deck) => {
        if (deck.id !== selectedDeck.id) return deck;
        return {
          ...deck,
          updatedAt: nowIso(),
          cards: deck.cards.map((card) => (card.id === cardId ? { ...card, [key]: value } : card))
        };
      })
    );
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

  async function togglePresentationMode() {
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
  }

  const questionText =
    activeCard && languageMode === 'front-to-back' ? activeCard.front : activeCard?.back ?? '';
  const answerText =
    activeCard && languageMode === 'front-to-back' ? activeCard.back : activeCard?.front ?? '';

  const mainText =
    displayMode === 'flip' ? (showAnswer ? answerText : questionText) : questionText;
  const secondaryText = displayMode === 'front-only' && showAnswer ? answerText : '';

  return (
    <main className={`app${isFocusMode ? ' focus-mode' : ''}`}>
      <h1 className="app-title">Flashcards Web App</h1>

      <section className="panel hero-panel" ref={slideRef} aria-label="슬라이드쇼 영역">
        <div className="slideshow-header">
          <h2>슬라이드쇼</h2>
          {(isFocusMode || isFullscreen) && (
            <button
              type="button"
              className="focus-exit"
              onClick={() => {
                void togglePresentationMode();
              }}
              aria-label="포커스 모드 또는 전체화면 종료"
            >
              종료
            </button>
          )}
        </div>

        <div className="row wrap deck-row">
          <label>
            빠른 덱 선택
            <select
              aria-label="슬라이드쇼 덱 선택"
              value={state.selectedDeckId ?? ''}
              onChange={(event) =>
                setState((current) => ({ ...current, selectedDeckId: event.target.value || null }))
              }
            >
              <option value="">덱 선택</option>
              {state.decks.map((deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name} ({deck.cards.length})
                </option>
              ))}
            </select>
          </label>
          <span className="badge">진행: {progressLabel(queueIndex, queue.length)}</span>
        </div>

        <div className="slide-stage" aria-live="polite">
          {!activeCard && <p className="empty-slide">카드를 추가하면 슬라이드가 시작됩니다.</p>}
          {activeCard && (
            <>
              <p className="slide-main">{mainText}</p>
              {secondaryText && <p className="slide-sub">{secondaryText}</p>}
            </>
          )}
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

        <div className="utility-controls" role="group" aria-label="슬라이드 보조 조작">
          <button onClick={() => setAutoplay((current) => !current)} disabled={queue.length === 0}>
            {autoplay ? '자동재생 정지' : `자동재생 ${AUTOPLAY_MS / 1000}초`}
          </button>
          <button onClick={() => void togglePresentationMode()} disabled={queue.length === 0}>
            {isFullscreen || isFocusMode ? '포커스/전체화면 종료' : '포커스/전체화면'}
          </button>
        </div>

        <p className="shortcut-help">⌨ ←/→ 이동 · Space 뒤집기 · F 포커스/전체화면 · Esc 종료</p>

        <details className="panel slideshow-settings">
          <summary>슬라이드 세부 설정</summary>
          <div className="panel-body">
            <div className="row wrap badges">
              <span className="badge">언어: {languageMode === 'front-to-back' ? '앞 → 뒤' : '뒤 → 앞'}</span>
              <span className="badge">표시: {displayMode === 'front-only' ? '앞면 + 정답' : '플립'}</span>
              <span className="badge">순서: {orderMode === 'sequential' ? '정순' : '역순'}</span>
              <span className="badge">셔플: {shuffleMode ? '켜짐' : '꺼짐'}</span>
              <span className="badge">자동재생: {autoplay ? '켜짐' : '꺼짐'}</span>
            </div>
            <div className="row wrap">
              <label>
                언어 방향
                <select
                  aria-label="언어 방향"
                  value={languageMode}
                  onChange={(event) => setLanguageMode(event.target.value as LanguageMode)}
                >
                  <option value="front-to-back">앞면 → 뒷면</option>
                  <option value="back-to-front">뒷면 → 앞면</option>
                </select>
              </label>
              <label>
                표시 방식
                <select
                  aria-label="표시 방식"
                  value={displayMode}
                  onChange={(event) => setDisplayMode(event.target.value as DisplayMode)}
                >
                  <option value="front-only">앞면 + 정답 보기</option>
                  <option value="flip">플립 카드</option>
                </select>
              </label>
              <label>
                카드 순서
                <select
                  aria-label="카드 순서"
                  value={orderMode}
                  onChange={(event) => setOrderMode(event.target.value as OrderMode)}
                >
                  <option value="sequential">정순</option>
                  <option value="reverse">역순</option>
                </select>
              </label>
              <label>
                <input
                  aria-label="셔플 모드"
                  type="checkbox"
                  checked={shuffleMode}
                  onChange={(event) => setShuffleMode(event.target.checked)}
                />
                셔플
              </label>
            </div>
          </div>
        </details>
      </section>

      <section className="advanced-panels">
        <h2>고급 관리</h2>

        <details className="panel advanced-panel">
          <summary>덱 관리 (Deck CRUD)</summary>
          <div className="panel-body">
            <div className="row wrap">
              <input
                placeholder="새 덱 이름"
                value={deckNameInput}
                onChange={(event) => setDeckNameInput(event.target.value)}
              />
              <button onClick={createDeck}>덱 생성</button>
            </div>

            <div className="row wrap">
              <select
                aria-label="관리용 덱 선택"
                value={state.selectedDeckId ?? ''}
                onChange={(event) =>
                  setState((current) => ({ ...current, selectedDeckId: event.target.value || null }))
                }
              >
                <option value="">덱 선택</option>
                {state.decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name} ({deck.cards.length})
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
          </div>
        </details>

        <details className="panel advanced-panel">
          <summary>카드 관리 (Card CRUD)</summary>
          <div className="panel-body">
            <div className="row wrap">
              <input
                placeholder="앞면"
                value={cardFrontInput}
                onChange={(event) => setCardFrontInput(event.target.value)}
                disabled={!selectedDeck}
              />
              <input
                placeholder="뒷면"
                value={cardBackInput}
                onChange={(event) => setCardBackInput(event.target.value)}
                disabled={!selectedDeck}
              />
              <button onClick={addCard} disabled={!selectedDeck}>
                카드 추가
              </button>
            </div>

            {selectedDeck && (
              <div className="cards-list">
                {selectedDeck.cards.map((card) => (
                  <div key={card.id} className="card-edit-row">
                    <input
                      aria-label="카드 앞면"
                      value={card.front}
                      onChange={(event) => updateCard(card.id, 'front', event.target.value)}
                    />
                    <input
                      aria-label="카드 뒷면"
                      value={card.back}
                      onChange={(event) => updateCard(card.id, 'back', event.target.value)}
                    />
                    <button onClick={() => deleteCard(card.id)} aria-label="카드 삭제">
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>

        <details className="panel advanced-panel">
          <summary>가져오기/내보내기 (Import / Export)</summary>
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
        </details>

        <details className="panel advanced-panel">
          <summary>테마</summary>
          <div className="panel-body">
            <div className="row">
              <button onClick={() => setTheme('light')}>라이트</button>
              <button onClick={() => setTheme('dark')}>다크</button>
              <button onClick={() => setTheme('system')}>시스템</button>
            </div>
          </div>
        </details>
      </section>

      {statusMessage && <p className="status">{statusMessage}</p>}
    </main>
  );
}
