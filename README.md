# 중학 시험 공부방

공개 GitHub Pages에서 운영하는 정적 웹앱입니다.

## 첫 배포

1. 이 폴더의 소스를 공개 GitHub 저장소의 `main` 브랜치에 올립니다.
2. 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다.
3. **Actions → Deploy study room to GitHub Pages → Run workflow**를 실행합니다. 성공하면 실행 결과에서 홈페이지 주소를 확인할 수 있습니다.

`main`에 변경을 올리면 테스트와 빌드를 실행한 뒤 `build/`를 배포합니다.

## 내용 수정

- 공부방의 화면과 학습 자료는 `dist/`에 있습니다.
- 버전 번호와 변경 내역은 `releases.json`에서 관리합니다.
- Node.js 22에서 `npm test`로 동작을 확인하고 `npm run build`로 배포 파일을 생성합니다.
- 오답 기록은 각 브라우저의 사이트 주소에 저장됩니다. 기존 주소에서 새 주소로 바뀌면 기록은 기존 브라우저의 기존 주소에 남습니다.

