# 모험가의 서재

판타지 공부 타이머. 사이트: https://ahlxxs.github.io/yuseob/ (관리자: 주소 끝에 `#admin`)

기획서: [PLAN.md](PLAN.md)

## 로그인 서버 연결 (Google Apps Script)
지금은 `API_URL`이 비어 있어서 **테스트 모드**입니다. 계정이 각자 브라우저에만 저장되므로 친구 검색이 되지 않습니다.

1. 새 구글 시트를 만들고 **확장 프로그램 → Apps Script**를 엽니다.
2. [`apps-script/Code.gs`](apps-script/Code.gs) 내용을 붙여넣고 저장합니다.
3. **배포 → 새 배포 → 웹 앱**을 고르고, 실행 사용자는 **나**, 액세스 권한은 **모든 사용자**로 정한 뒤 배포합니다. 처음에는 권한 허용 창이 뜹니다.
4. 나온 주소(`https://script.google.com/macros/s/…/exec`)를 `index.html`의 `const API_URL = '';` 따옴표 안에 넣습니다.

서버 로직 점검: `node apps-script/test.js`
