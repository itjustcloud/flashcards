import type { AppState, Card, Deck, ImportPayload, ThemeMode } from '../types';

export const APP_STORAGE_KEY = 'flashcards.app.v1';

const sampleDeck: Deck = {
  id: 'default-suneung-300',
  name: '수능 빈출 300단어',
  createdAt: '2026-04-13T00:00:00.000Z',
  updatedAt: '2026-04-13T00:00:00.000Z',
  cards: [
    { id: 's-001', front: 'abandon', back: '버리다' },
    { id: 's-002', front: 'abolish', back: '폐지하다' },
    { id: 's-003', front: 'abrupt', back: '갑작스러운' },
    { id: 's-004', front: 'absorb', back: '흡수하다' },
    { id: 's-005', front: 'abstract', back: '추상적인' },
    { id: 's-006', front: 'absurd', back: '터무니없는' },
    { id: 's-007', front: 'abundant', back: '풍부한' },
    { id: 's-008', front: 'accelerate', back: '가속하다' },
    { id: 's-009', front: 'access', back: '접근하다' },
    { id: 's-010', front: 'accompany', back: '동반하다' },
    { id: 's-011', front: 'accomplish', back: '성취하다' },
    { id: 's-012', front: 'accumulate', back: '축적하다' },
    { id: 's-013', front: 'accurate', back: '정확한' },
    { id: 's-014', front: 'adapt', back: '적응하다' },
    { id: 's-015', front: 'adequate', back: '충분한' },
    { id: 's-016', front: 'adjacent', back: '인접한' },
    { id: 's-017', front: 'adjust', back: '조절하다' },
    { id: 's-018', front: 'administer', back: '관리하다' },
    { id: 's-019', front: 'admire', back: '존경하다' },
    { id: 's-020', front: 'adopt', back: '채택하다' },
    { id: 's-021', front: 'adverse', back: '불리한' },
    { id: 's-022', front: 'advocate', back: '지지하다' },
    { id: 's-023', front: 'affect', back: '영향을 미치다' },
    { id: 's-024', front: 'aggregate', back: '총합의' },
    { id: 's-025', front: 'aid', back: '돕다' },
    { id: 's-026', front: 'allocate', back: '할당하다' },
    { id: 's-027', front: 'alter', back: '바꾸다' },
    { id: 's-028', front: 'alternative', back: '대안' },
    { id: 's-029', front: 'ambiguous', back: '모호한' },
    { id: 's-030', front: 'amend', back: '수정하다' },
    { id: 's-031', front: 'analyze', back: '분석하다' },
    { id: 's-032', front: 'anticipate', back: '예상하다' },
    { id: 's-033', front: 'apparent', back: '분명한' },
    { id: 's-034', front: 'appeal', back: '호소하다' },
    { id: 's-035', front: 'approach', back: '접근하다' },
    { id: 's-036', front: 'appropriate', back: '적절한' },
    { id: 's-037', front: 'arbitrary', back: '임의의' },
    { id: 's-038', front: 'arise', back: '발생하다' },
    { id: 's-039', front: 'aspect', back: '측면' },
    { id: 's-040', front: 'assemble', back: '모으다' },
    { id: 's-041', front: 'assert', back: '주장하다' },
    { id: 's-042', front: 'assess', back: '평가하다' },
    { id: 's-043', front: 'assign', back: '부여하다' },
    { id: 's-044', front: 'assume', back: '가정하다' },
    { id: 's-045', front: 'attain', back: '이루다' },
    { id: 's-046', front: 'attribute', back: '원인으로 보다' },
    { id: 's-047', front: 'authentic', back: '진정한' },
    { id: 's-048', front: 'aware', back: '알고 있는' },
    { id: 's-049', front: 'beneficial', back: '유익한' },
    { id: 's-050', front: 'bias', back: '편견' },
    { id: 's-051', front: 'bind', back: '묶다' },
    { id: 's-052', front: 'brief', back: '짧은' },
    { id: 's-053', front: 'capacity', back: '능력' },
    { id: 's-054', front: 'capture', back: '포착하다' },
    { id: 's-055', front: 'casual', back: '우연한' },
    { id: 's-056', front: 'cease', back: '중단하다' },
    { id: 's-057', front: 'challenge', back: '도전' },
    { id: 's-058', front: 'circumstance', back: '상황' },
    { id: 's-059', front: 'cite', back: '인용하다' },
    { id: 's-060', front: 'civil', back: '시민의' },
    { id: 's-061', front: 'clarify', back: '명확히 하다' },
    { id: 's-062', front: 'coincide', back: '동시에 일어나다' },
    { id: 's-063', front: 'collapse', back: '붕괴하다' },
    { id: 's-064', front: 'colleague', back: '동료' },
    { id: 's-065', front: 'combine', back: '결합하다' },
    { id: 's-066', front: 'commence', back: '시작하다' },
    { id: 's-067', front: 'commit', back: '헌신하다' },
    { id: 's-068', front: 'compel', back: '강요하다' },
    { id: 's-069', front: 'compensate', back: '보상하다' },
    { id: 's-070', front: 'competent', back: '유능한' },
    { id: 's-071', front: 'complex', back: '복잡한' },
    { id: 's-072', front: 'component', back: '구성 요소' },
    { id: 's-073', front: 'comprehensive', back: '포괄적인' },
    { id: 's-074', front: 'compromise', back: '타협하다' },
    { id: 's-075', front: 'conceive', back: '생각해내다' },
    { id: 's-076', front: 'concentrate', back: '집중하다' },
    { id: 's-077', front: 'conclude', back: '결론짓다' },
    { id: 's-078', front: 'concrete', back: '구체적인' },
    { id: 's-079', front: 'condemn', back: '비난하다' },
    { id: 's-080', front: 'conduct', back: '수행하다' },
    { id: 's-081', front: 'confer', back: '상의하다' },
    { id: 's-082', front: 'confine', back: '제한하다' },
    { id: 's-083', front: 'confirm', back: '확인하다' },
    { id: 's-084', front: 'conflict', back: '갈등' },
    { id: 's-085', front: 'conform', back: '따르다' },
    { id: 's-086', front: 'confront', back: '맞서다' },
    { id: 's-087', front: 'consent', back: '동의하다' },
    { id: 's-088', front: 'conserve', back: '보존하다' },
    { id: 's-089', front: 'considerable', back: '상당한' },
    { id: 's-090', front: 'consist', back: '이루어지다' },
    { id: 's-091', front: 'constant', back: '끊임없는' },
    { id: 's-092', front: 'constrain', back: '제약하다' },
    { id: 's-093', front: 'construct', back: '건설하다' },
    { id: 's-094', front: 'consult', back: '상담하다' },
    { id: 's-095', front: 'consume', back: '소비하다' },
    { id: 's-096', front: 'contact', back: '접촉하다' },
    { id: 's-097', front: 'contaminate', back: '오염시키다' },
    { id: 's-098', front: 'contemplate', back: '숙고하다' },
    { id: 's-099', front: 'contemporary', back: '현대의' },
    { id: 's-100', front: 'contend', back: '주장하다' },
    { id: 's-101', front: 'contract', back: '계약' },
    { id: 's-102', front: 'contradict', back: '모순되다' },
    { id: 's-103', front: 'contrary', back: '반대의' },
    { id: 's-104', front: 'contribute', back: '기여하다' },
    { id: 's-105', front: 'controversy', back: '논란' },
    { id: 's-106', front: 'conventional', back: '전통적인' },
    { id: 's-107', front: 'convert', back: '전환하다' },
    { id: 's-108', front: 'convey', back: '전달하다' },
    { id: 's-109', front: 'convince', back: '설득하다' },
    { id: 's-110', front: 'cooperate', back: '협력하다' },
    { id: 's-111', front: 'coordinate', back: '조정하다' },
    { id: 's-112', front: 'core', back: '핵심' },
    { id: 's-113', front: 'corporate', back: '기업의' },
    { id: 's-114', front: 'correspond', back: '일치하다' },
    { id: 's-115', front: 'crucial', back: '결정적인' },
    { id: 's-116', front: 'cultivate', back: '기르다' },
    { id: 's-117', front: 'cure', back: '치료하다' },
    { id: 's-118', front: 'curb', back: '억제하다' },
    { id: 's-119', front: 'currency', back: '통화' },
    { id: 's-120', front: 'decay', back: '부패하다' },
    { id: 's-121', front: 'decline', back: '감소하다' },
    { id: 's-122', front: 'dedicate', back: '전념하다' },
    { id: 's-123', front: 'deduct', back: '공제하다' },
    { id: 's-124', front: 'deem', back: '여기다' },
    { id: 's-125', front: 'define', back: '정의하다' },
    { id: 's-126', front: 'deliberate', back: '신중한' },
    { id: 's-127', front: 'demonstrate', back: '입증하다' },
    { id: 's-128', front: 'deny', back: '부인하다' },
    { id: 's-129', front: 'depart', back: '떠나다' },
    { id: 's-130', front: 'depend', back: '의존하다' },
    { id: 's-131', front: 'depict', back: '묘사하다' },
    { id: 's-132', front: 'derive', back: '얻다' },
    { id: 's-133', front: 'designate', back: '지정하다' },
    { id: 's-134', front: 'despite', back: '~에도 불구하고' },
    { id: 's-135', front: 'detect', back: '발견하다' },
    { id: 's-136', front: 'deteriorate', back: '악화되다' },
    { id: 's-137', front: 'devote', back: '바치다' },
    { id: 's-138', front: 'differ', back: '다르다' },
    { id: 's-139', front: 'diminish', back: '줄어들다' },
    { id: 's-140', front: 'discipline', back: '규율' },
    { id: 's-141', front: 'disclose', back: '밝히다' },
    { id: 's-142', front: 'discriminate', back: '차별하다' },
    { id: 's-143', front: 'dismiss', back: '일축하다' },
    { id: 's-144', front: 'dispute', back: '분쟁' },
    { id: 's-145', front: 'distinct', back: '뚜렷한' },
    { id: 's-146', front: 'distribute', back: '분배하다' },
    { id: 's-147', front: 'diverse', back: '다양한' },
    { id: 's-148', front: 'document', back: '문서' },
    { id: 's-149', front: 'domestic', back: '국내의' },
    { id: 's-150', front: 'dominate', back: '지배하다' },
    { id: 's-151', front: 'draft', back: '초안' },
    { id: 's-152', front: 'drastic', back: '과감한' },
    { id: 's-153', front: 'duration', back: '지속 기간' },
    { id: 's-154', front: 'dynamic', back: '역동적인' },
    { id: 's-155', front: 'economy', back: '경제' },
    { id: 's-156', front: 'elaborate', back: '정교한' },
    { id: 's-157', front: 'eliminate', back: '제거하다' },
    { id: 's-158', front: 'emerge', back: '나타나다' },
    { id: 's-159', front: 'emphasize', back: '강조하다' },
    { id: 's-160', front: 'employ', back: '고용하다' },
    { id: 's-161', front: 'enable', back: '가능하게 하다' },
    { id: 's-162', front: 'encounter', back: '마주치다' },
    { id: 's-163', front: 'endure', back: '견디다' },
    { id: 's-164', front: 'enhance', back: '향상시키다' },
    { id: 's-165', front: 'enormous', back: '막대한' },
    { id: 's-166', front: 'ensure', back: '보장하다' },
    { id: 's-167', front: 'entail', back: '수반하다' },
    { id: 's-168', front: 'enterprise', back: '기업' },
    { id: 's-169', front: 'equivalent', back: '동등한' },
    { id: 's-170', front: 'erode', back: '침식하다' },
    { id: 's-171', front: 'essential', back: '필수적인' },
    { id: 's-172', front: 'establish', back: '확립하다' },
    { id: 's-173', front: 'estimate', back: '추정하다' },
    { id: 's-174', front: 'ethics', back: '윤리' },
    { id: 's-175', front: 'evaluate', back: '평가하다' },
    { id: 's-176', front: 'eventual', back: '최종적인' },
    { id: 's-177', front: 'evident', back: '분명한' },
    { id: 's-178', front: 'evolve', back: '진화하다' },
    { id: 's-179', front: 'exceed', back: '초과하다' },
    { id: 's-180', front: 'exclude', back: '제외하다' },
    { id: 's-181', front: 'execute', back: '실행하다' },
    { id: 's-182', front: 'exhibit', back: '전시하다' },
    { id: 's-183', front: 'expand', back: '확장하다' },
    { id: 's-184', front: 'expert', back: '전문가' },
    { id: 's-185', front: 'explicit', back: '명백한' },
    { id: 's-186', front: 'exploit', back: '이용하다' },
    { id: 's-187', front: 'expose', back: '노출시키다' },
    { id: 's-188', front: 'external', back: '외부의' },
    { id: 's-189', front: 'extract', back: '추출하다' },
    { id: 's-190', front: 'facilitate', back: '촉진하다' },
    { id: 's-191', front: 'factor', back: '요인' },
    { id: 's-192', front: 'feasible', back: '실행 가능한' },
    { id: 's-193', front: 'feature', back: '특징' },
    { id: 's-194', front: 'federal', back: '연방의' },
    { id: 's-195', front: 'flexible', back: '유연한' },
    { id: 's-196', front: 'fluctuate', back: '변동하다' },
    { id: 's-197', front: 'focus', back: '초점' },
    { id: 's-198', front: 'forbid', back: '금지하다' },
    { id: 's-199', front: 'formulate', back: '공식화하다' },
    { id: 's-200', front: 'foster', back: '촉진하다' },
    { id: 's-201', front: 'fragment', back: '파편' },
    { id: 's-202', front: 'framework', back: '틀' },
    { id: 's-203', front: 'function', back: '기능하다' },
    { id: 's-204', front: 'fundamental', back: '근본적인' },
    { id: 's-205', front: 'generate', back: '생성하다' },
    { id: 's-206', front: 'genuine', back: '진정한' },
    { id: 's-207', front: 'global', back: '세계적인' },
    { id: 's-208', front: 'grant', back: '부여하다' },
    { id: 's-209', front: 'guarantee', back: '보장' },
    { id: 's-210', front: 'hypothesis', back: '가설' },
    { id: 's-211', front: 'identical', back: '동일한' },
    { id: 's-212', front: 'identify', back: '식별하다' },
    { id: 's-213', front: 'ideology', back: '이념' },
    { id: 's-214', front: 'illustrate', back: '설명하다' },
    { id: 's-215', front: 'impact', back: '영향' },
    { id: 's-216', front: 'implement', back: '시행하다' },
    { id: 's-217', front: 'imply', back: '암시하다' },
    { id: 's-218', front: 'impose', back: '부과하다' },
    { id: 's-219', front: 'incentive', back: '동기' },
    { id: 's-220', front: 'incorporate', back: '포함하다' },
    { id: 's-221', front: 'indicate', back: '나타내다' },
    { id: 's-222', front: 'inevitable', back: '불가피한' },
    { id: 's-223', front: 'infer', back: '추론하다' },
    { id: 's-224', front: 'influence', back: '영향력' },
    { id: 's-225', front: 'inhibit', back: '억제하다' },
    { id: 's-226', front: 'initial', back: '초기의' },
    { id: 's-227', front: 'innovate', back: '혁신하다' },
    { id: 's-228', front: 'inquiry', back: '탐구' },
    { id: 's-229', front: 'insert', back: '삽입하다' },
    { id: 's-230', front: 'insist', back: '주장하다' },
    { id: 's-231', front: 'inspect', back: '점검하다' },
    { id: 's-232', front: 'instance', back: '사례' },
    { id: 's-233', front: 'instruct', back: '지시하다' },
    { id: 's-234', front: 'integrate', back: '통합하다' },
    { id: 's-235', front: 'intellectual', back: '지적인' },
    { id: 's-236', front: 'intend', back: '의도하다' },
    { id: 's-237', front: 'interact', back: '상호작용하다' },
    { id: 's-238', front: 'internal', back: '내부의' },
    { id: 's-239', front: 'interpret', back: '해석하다' },
    { id: 's-240', front: 'interval', back: '간격' },
    { id: 's-241', front: 'intervene', back: '개입하다' },
    { id: 's-242', front: 'intrinsic', back: '본질적인' },
    { id: 's-243', front: 'invest', back: '투자하다' },
    { id: 's-244', front: 'isolate', back: '고립시키다' },
    { id: 's-245', front: 'issue', back: '쟁점' },
    { id: 's-246', front: 'justify', back: '정당화하다' },
    { id: 's-247', front: 'labor', back: '노동' },
    { id: 's-248', front: 'layer', back: '층' },
    { id: 's-249', front: 'legal', back: '법적인' },
    { id: 's-250', front: 'legitimate', back: '정당한' },
    { id: 's-251', front: 'liberal', back: '자유주의적인' },
    { id: 's-252', front: 'likewise', back: '마찬가지로' },
    { id: 's-253', front: 'limit', back: '제한하다' },
    { id: 's-254', front: 'locate', back: '위치시키다' },
    { id: 's-255', front: 'maintain', back: '유지하다' },
    { id: 's-256', front: 'mandatory', back: '의무적인' },
    { id: 's-257', front: 'margin', back: '차이' },
    { id: 's-258', front: 'mature', back: '성숙한' },
    { id: 's-259', front: 'maximize', back: '극대화하다' },
    { id: 's-260', front: 'mechanism', back: '메커니즘' },
    { id: 's-261', front: 'mediate', back: '중재하다' },
    { id: 's-262', front: 'mental', back: '정신의' },
    { id: 's-263', front: 'modify', back: '수정하다' },
    { id: 's-264', front: 'monitor', back: '감시하다' },
    { id: 's-265', front: 'motivate', back: '동기를 부여하다' },
    { id: 's-266', front: 'mutual', back: '상호의' },
    { id: 's-267', front: 'neutral', back: '중립적인' },
    { id: 's-268', front: 'notion', back: '개념' },
    { id: 's-269', front: 'objective', back: '객관적인' },
    { id: 's-270', front: 'obscure', back: '모호한' },
    { id: 's-271', front: 'obtain', back: '획득하다' },
    { id: 's-272', front: 'obvious', back: '명백한' },
    { id: 's-273', front: 'occupy', back: '차지하다' },
    { id: 's-274', front: 'occur', back: '발생하다' },
    { id: 's-275', front: 'orient', back: '방향을 맞추다' },
    { id: 's-276', front: 'outcome', back: '결과' },
    { id: 's-277', front: 'overall', back: '전반적인' },
    { id: 's-278', front: 'perceive', back: '인지하다' },
    { id: 's-279', front: 'persist', back: '지속하다' },
    { id: 's-280', front: 'perspective', back: '관점' },
    { id: 's-281', front: 'phase', back: '단계' },
    { id: 's-282', front: 'policy', back: '정책' },
    { id: 's-283', front: 'portion', back: '부분' },
    { id: 's-284', front: 'potential', back: '잠재적인' },
    { id: 's-285', front: 'precede', back: '앞서다' },
    { id: 's-286', front: 'precise', back: '정확한' },
    { id: 's-287', front: 'predict', back: '예측하다' },
    { id: 's-288', front: 'preserve', back: '보존하다' },
    { id: 's-289', front: 'primary', back: '주요한' },
    { id: 's-290', front: 'principle', back: '원칙' },
    { id: 's-291', front: 'prior', back: '이전의' },
    { id: 's-292', front: 'proceed', back: '진행하다' },
    { id: 's-293', front: 'process', back: '과정' },
    { id: 's-294', front: 'promote', back: '촉진하다' },
    { id: 's-295', front: 'proportion', back: '비율' },
    { id: 's-296', front: 'propose', back: '제안하다' },
    { id: 's-297', front: 'pursue', back: '추구하다' },
    { id: 's-298', front: 'rational', back: '합리적인' },
    { id: 's-299', front: 'react', back: '반응하다' },
    { id: 's-300', front: 'recover', back: '회복하다' },
  ]
};

const defaultState: AppState = {
  decks: [sampleDeck],
  selectedDeckId: sampleDeck.id,
  theme: 'system'
};

function isCard(value: unknown): value is Card {
  if (!value || typeof value !== 'object') return false;
  const card = value as Card;
  return (
    typeof card.id === 'string' &&
    typeof card.front === 'string' &&
    typeof card.back === 'string'
  );
}

function isDeck(value: unknown): value is Deck {
  if (!value || typeof value !== 'object') return false;
  const deck = value as Deck;
  return (
    typeof deck.id === 'string' &&
    typeof deck.name === 'string' &&
    typeof deck.createdAt === 'string' &&
    typeof deck.updatedAt === 'string' &&
    Array.isArray(deck.cards) &&
    deck.cards.every(isCard)
  );
}

function isTheme(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function isImportPayload(value: unknown): value is ImportPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as ImportPayload;
  return Array.isArray(payload.decks) && payload.decks.every(isDeck);
}

export function loadAppState(): AppState {
  if (typeof window === 'undefined') return defaultState;
  const raw = window.localStorage.getItem(APP_STORAGE_KEY);
  if (!raw) return defaultState;

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const decks = Array.isArray(parsed.decks) ? parsed.decks.filter(isDeck) : [];
    const selectedDeckId =
      typeof parsed.selectedDeckId === 'string' && decks.some((d) => d.id === parsed.selectedDeckId)
        ? parsed.selectedDeckId
        : decks[0]?.id ?? null;
    const theme = isTheme(parsed.theme) ? parsed.theme : 'system';

    if (decks.length === 0) {
      return defaultState;
    }

    return { decks, selectedDeckId, theme };
  } catch {
    return defaultState;
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
}

export function mergeDecks(current: Deck[], incoming: Deck[]): Deck[] {
  const byId = new Map<string, Deck>(current.map((deck) => [deck.id, deck]));

  for (const inDeck of incoming) {
    const existing = byId.get(inDeck.id);
    if (!existing) {
      byId.set(inDeck.id, inDeck);
      continue;
    }

    const cardsById = new Map<string, Card>(existing.cards.map((card) => [card.id, card]));
    for (const card of inDeck.cards) {
      cardsById.set(card.id, card);
    }

    byId.set(inDeck.id, {
      ...existing,
      name: inDeck.name,
      updatedAt: new Date().toISOString(),
      cards: Array.from(cardsById.values())
    });
  }

  return Array.from(byId.values());
}
