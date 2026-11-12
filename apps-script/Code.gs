/**
 * 모험가의 서재 서버 (Google Apps Script + 구글 시트)
 *
 * 배포 방법
 * 1. 새 구글 시트 만들기 → 확장 프로그램 → Apps Script
 * 2. 이 파일 내용을 Code.gs 에 붙여넣고 저장
 * 3. 배포 → 새 배포 → 유형: 웹 앱 / 실행 사용자: 나 / 액세스 권한: 모든 사용자 → 배포
 * 4. 나온 웹 앱 URL(…/exec)을 index.html 의 API_URL 에 붙여넣기
 * 코드를 고친 뒤에는 배포 → 배포 관리 → 수정 → 새 버전 으로 다시 배포해야 반영됩니다.
 *
 * 시트 'users' 열: name | salt | hash | token | data(JSON) | updated
 * 비밀번호는 원문을 저장하지 않고 salt + SHA-256 1000회 해시만 저장합니다.
 */
const NAME_RE = /^[가-힣a-zA-Z0-9_]{2,12}$/;

function doPost(e) {
  let out;
  try {
    const r = JSON.parse(e.postData.contents);
    const fn = API[r.action];
    if (!fn) throw new Error('알 수 없는 요청');
    out = fn(r);
  } catch (err) {
    out = { error: err.message || String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName('users');
  if (!sh) {
    sh = ss.insertSheet('users');
    sh.getRange('A:A').setNumberFormat('@'); // 숫자 닉네임(예: 0012)이 숫자로 바뀌지 않게
    sh.appendRow(['name', 'salt', 'hash', 'token', 'data', 'updated']);
  }
  return sh;
}
const rows_ = () => sheet_().getDataRange().getValues().slice(1);

function hash_(pw, salt) {
  let h = salt + pw;
  for (let i = 0; i < 1000; i++) {
    h = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h, Utilities.Charset.UTF_8)
      .map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
  }
  return h;
}

function byToken_(t) {
  const rs = rows_();
  const i = t ? rs.findIndex(r => r[3] === t) : -1;
  if (i < 0) throw new Error('다시 로그인해 주세요.');
  return { row: i + 2, r: rs[i] };
}

// 남에게 보여줄 항목만 (비밀번호·토큰·모험 일지 제외)
const pub_ = d => ({ name: d.name, gender: d.gender, genre: d.genre, classId: d.classId, study: d.study || {}, items: d.items || {} });

function userJson_(u, name) {
  const s = JSON.stringify(Object.assign({}, u, { name: name }));
  if (s.length > 45000) throw new Error('기록이 너무 큽니다.');
  return s;
}

const API = {
  signup(r) {
    if (!NAME_RE.test(r.name || '')) throw new Error('닉네임은 한글·영문·숫자·_ 2~12자입니다.');
    if (!r.pw || r.pw.length < 6) throw new Error('비밀번호는 6자 이상입니다.');
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      if (rows_().some(x => String(x[0]) === r.name)) throw new Error('이미 사용 중인 닉네임입니다.');
      const salt = Utilities.getUuid(), token = Utilities.getUuid(), data = userJson_(r.user || {}, r.name);
      sheet_().appendRow([r.name, salt, hash_(r.pw, salt), token, data, new Date()]);
      return { token: token, user: JSON.parse(data) };
    } finally {
      lock.releaseLock();
    }
  },

  login(r) {
    const cache = CacheService.getScriptCache(), key = 'fail_' + r.name, fails = Number(cache.get(key)) || 0;
    if (fails >= 5) throw new Error('로그인에 5번 실패했습니다. 10분 뒤 다시 시도해 주세요.');
    const x = rows_().find(x => String(x[0]) === r.name);
    if (!x || hash_(r.pw || '', x[1]) !== x[2]) {
      cache.put(key, String(fails + 1), 600);
      throw new Error('닉네임 또는 비밀번호가 맞지 않습니다.');
    }
    cache.remove(key);
    return { token: x[3], user: JSON.parse(x[4]) };
  },

  me(r) {
    return { user: JSON.parse(byToken_(r.token).r[4]) };
  },

  save(r) {
    const t = byToken_(r.token);
    sheet_().getRange(t.row, 5, 1, 2).setValues([[userJson_(r.user || {}, String(t.r[0])), new Date()]]);
    return { ok: true };
  },

  search(r) {
    const q = String(r.q || '').trim();
    if (!q) return { users: [] };
    return { users: rows_().filter(x => String(x[0]).includes(q)).slice(0, 20).map(x => pub_(JSON.parse(x[4]))) };
  }
};
