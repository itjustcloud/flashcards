# 플래시카드 웹 앱

로컬 환경에서 동작하는 React + TypeScript 기반 플래시카드 앱입니다.

## 기능
- 덱/카드 CRUD (생성, 수정, 삭제)
- `localStorage` 자동 저장 및 복원
- 슬라이드쇼 수동 이동 / 자동재생 / 전체화면 / 키보드 조작
- 학습 모드: language, display, order, shuffle
- 테마: `light` / `dark` / `system` (설정 저장)
- JSON 가져오기/내보내기
  - 가져오기 모드: `merge` 또는 `overwrite`
  - 형식 검증 실패 시 오류 메시지
- 진행률 배지 및 모드 배지 표시
- 순수 큐 유틸 함수 + 테스트 포함

## 실행
```bash
npm install
npm run dev
```

## 품질 확인
```bash
npm run lint
npm test
npm run build
```

## 키보드 단축키
- `←`, `→`: 이전/다음 카드
- `Space`: 정답 보기/뒤집기
- `F`: 전체화면 토글

## JSON 포맷
```json
{
  "decks": [
    {
      "id": "deck-1",
      "name": "기본 덱",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "cards": [
        { "id": "card-1", "front": "안녕하세요", "back": "Hello" }
      ]
    }
  ]
}
```
