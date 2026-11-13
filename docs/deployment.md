# 배포와 모니터링

## 서버 구성

서버는 두 대다. staging 서버(zizon-tomato.cloud)는 staging 배포 환경이면서 모니터링 서버를 겸해 Prometheus, Loki, Grafana가 이곳에만 있다. 운영 서버(wannabe-ketchup.com)에는 앱과 nginx, 로그를 보내는 Promtail만 둔다.

| 서버       | 저장소 위치                                                                                              | 컨테이너                                         |
| ---------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| staging    | 루트의 `app-compose.yml`, `infra-compose.yml`, `nginx/`, `prometheus/`, `loki/`, `promtail/`, `grafana/` | nest, nginx, prometheus, loki, promtail, grafana |
| production | `production/` 아래 전부                                                                                  | nest, nginx, promtail                            |

compose 파일은 두 개로 나뉜다. `app-compose.yml`은 Nest 하나이고 GitHub Actions가 배포할 때마다 갱신한다. `infra-compose.yml`은 nginx와 모니터링 구성요소이며 자동 배포에 포함되지 않아 서버에서 직접 반영한다. infra가 `ketchup-network`를 만들고 app이 그 네트워크에 붙으므로 서버를 처음 띄울 때는 infra를 먼저 올린다. 두 파일이 같은 디렉터리에 있어 compose는 둘을 한 프로젝트로 보고, infra를 실행할 때 nest를 "orphan container"라고 경고한다. 이 경고는 무시하며, `--remove-orphans`를 붙이면 nest가 삭제되므로 쓰지 않는다.

## 자동 배포 흐름

staging 브랜치에 push하면 `Deploy Staging` 워크플로가 lint, build, test를 거친 뒤 API 이미지를 빌드해 `ghcr.io/wannabe-ketchup/pomodoro-api:<커밋 SHA>`와 `:staging` 태그로 올리고, staging 서버에서 새 이미지로 Nest를 다시 띄운 다음 web 빌드 결과를 복사한다.

staging을 main에 머지하면 `Deploy Production` 워크플로가 같은 검증을 거친다. 이미지는 새로 빌드하지 않고 staging에서 이미 검증한 이미지를 재사용한다. main의 머지 커밋은 두 번째 부모가 staging의 마지막 커밋이므로, 그 커밋과 머지 커밋의 코드가 완전히 같고 그 SHA의 이미지가 GHCR에 있으면 같은 이미지에 `:<머지 커밋 SHA>`와 `:production` 태그만 더한다. main에 staging에 없는 커밋이 섞여 코드가 다르거나 staging 이미지 빌드가 아직 끝나지 않았다면 main 코드로 새로 빌드한다. 어느 경우든 운영에는 main 코드와 같은 이미지가 올라간다.

이미지에는 환경별 설정이 들어가지 않는다. `SESSION_SECRET`, `AWS_*`, `CDN_DOMAIN` 같은 값은 컨테이너가 시작할 때 각 서버의 `.env`에서 읽기 때문에 같은 이미지가 staging과 운영에서 각자의 설정으로 동작한다. 따라서 `.env`가 잘못돼 배포가 실패하면 다시 빌드해도 소용없고, 서버의 `.env`를 고친 뒤 워크플로를 다시 실행해야 한다.

배포 단계에서는 `production/app-compose.yml`을 운영 서버 `APP_DIR`에 복사하고 `TAG=<커밋 SHA>`로 이미지를 받아 Nest를 다시 띄운다. 헬스체크가 통과할 때까지 기다린 뒤 서버 안에서 `/health`가 200인지 한 번 더 확인하며, 실패하면 Nest 로그 50줄을 남기고 워크플로를 실패로 끝낸다. 이 경우 web 빌드는 복사하지 않는다. 마지막으로 web 빌드 결과를 `WEB_DIR`에 덮어쓴다.

세션과 방 상태는 Nest 메모리에 있으므로 배포나 롤백으로 Nest가 다시 뜨면 진행 중인 방과 로그인 세션이 초기화된다.

## 롤백

운영에 올린 버전에 문제가 있으면 GitHub Actions에서 이전 버전으로 되돌린다. 저장소의 Actions 탭에서 `Deploy Production`을 고르고 `Run workflow`를 누른 뒤, 브랜치는 main 그대로 두고 `sha` 칸에 되돌릴 커밋 SHA 40자 전체를 넣어 실행한다. 되돌릴 SHA는 Actions의 `Deploy Production` 실행 목록에서 마지막으로 정상이던 실행의 커밋을 열어 복사하거나, `git log --first-parent --format='%H %s' upstream/main`으로 찾는다.

롤백 실행은 lint와 test를 건너뛰고 해당 커밋의 web을 다시 빌드한다. 그 SHA의 이미지가 GHCR에 있는지 확인한 뒤 `:production` 태그를 그 이미지로 옮기고, 평소 배포와 같은 방식으로 Nest와 web을 그 버전으로 되돌린다. 운영에 한 번 배포됐던 main 커밋은 이미지가 항상 남아 있으므로 그 SHA를 쓰면 된다. 이미지가 없는 SHA를 넣으면 배포 전에 실패한다.

롤백은 서버만 되돌리고 main 브랜치는 그대로 둔다. 다음에 main에 머지하면 그 시점의 main이 다시 배포되므로, 롤백한 뒤에는 문제 커밋을 revert하거나 고친 PR을 staging에서 검증하고 main에 머지해야 한다.

GitHub Actions를 쓸 수 없는 급한 상황이면 운영 서버에 접속해 `APP_DIR`에서 `TAG=<되돌릴 SHA> docker compose -f app-compose.yml up -d --wait`를 실행하면 API만 즉시 되돌아간다. web은 되돌아가지 않으므로 Actions를 쓸 수 있게 되면 위 방법으로 다시 롤백해 둘을 맞춘다.

롤백은 `app-compose.yml`로 띄우는 Nest와 web만 대상이다. nginx, Promtail, Loki, Prometheus 설정은 git에서 이전 파일을 꺼내 서버에서 직접 되돌린다.

## 모니터링

메트릭은 staging Prometheus가 15초마다 가져간다. staging Nest는 도커 네트워크 안에서 `nest:3000/metrics`로, 운영 Nest는 `https://wannabe-ketchup.com/api/metrics`로 수집한다. 운영 nginx는 이 경로를 staging 서버 IP에만 열고 다른 곳에서 오면 403을 돌려준다. 운영 데이터에는 `env="production"`, staging 데이터에는 `env="staging"` 라벨이 붙고, Grafana의 API와 Nest Runtime 대시보드 상단 `환경` 변수로 둘을 고른다.

로그는 각 서버의 Promtail이 Nest 로그 파일(`logs/*.log`)을 읽어 staging Loki로 보낸다. staging Promtail은 도커 네트워크 안에서 `loki:3100`으로 바로 보내고, 운영 Promtail은 staging nginx를 거친다. staging nginx는 `/loki/api/v1/push` 한 경로만 운영 서버 IP에 열며, Loki의 조회 API는 밖으로 열지 않는다. 메트릭과 같이 운영 로그에는 `env="production"`, staging 로그에는 `env="staging"` 라벨이 붙는다. Promtail은 어디까지 보냈는지 기록해 두므로 재시작해도 이어서 보내고, Loki가 잠시 멈추면 재시도한다. 원본 로그 파일은 각 서버에 30일 동안 남는다. Grafana에서는 Explore에서 Loki를 고르고 `{env="production", job="nest"}`처럼 조회하며, `level`은 라벨로, `traceId`는 `trace_id` structured metadata로 들어 있어 `{env="production"} | trace_id="<값>"`으로 한 요청의 로그를 모아 볼 수 있다. 평소에는 Logs 대시보드에서 레벨별 로그 수와 에러 로그를 보고, 상단 `env` 변수로 환경을 고른 뒤 `레벨`·`traceId`·`검색어` 변수로 전체 로그를 거른다. 로그를 펼쳐 `trace_id`의 "이 요청의 로그 보기"를 누르면 그 요청의 로그만 남는다. 이 링크는 `grafana/provisioning/datasources/datasource.yml`의 Loki `derivedFields`에 정의돼 있어, 대시보드와 함께 이 파일도 서버에 반영해야 한다. nginx 로그는 Loki로 보내지 않는다.

메트릭과 로그는 모두 90일 동안 보관한다. Prometheus는 90일 전이라도 3GB를 넘으면 오래된 데이터부터 지운다. Loki는 용량 기준 삭제가 없으므로 staging 디스크 사용량(`df -h`)을 가끔 확인한다. Grafana는 `https://monitoring.zizon-tomato.cloud`로 접속하며, staging nginx가 같은 서버의 Grafana로 넘긴다. 회원가입은 막혀 있고 `grafana/.env`의 관리자 비밀번호로 로그인한다.

운영 서버 알림은 Grafana가 디스코드 채널 하나로 보낸다. 규칙은 `grafana/provisioning/alerting/`에 파일로 있고, Grafana 화면에서는 고칠 수 없다. 디스코드 webhook 주소는 알면 누구나 채널에 글을 쓸 수 있으므로 저장소에 두지 않고 staging 서버의 `grafana/.env`에 `DISCORD_WEBHOOK_URL`로 넣는다. 이 값이 비어 있으면 Grafana가 알림 설정을 읽지 못해 시작하지 않는다. 로컬에서는 가짜 주소를 넣는다. 로컬 Prometheus는 운영 서버를 수집하지 못해(운영 nginx가 staging IP에만 연다) 서버 응답 없음이 울리므로, 진짜 주소를 넣으면 팀 채널로 간다. 알림 메시지에는 지금 값과 할 일이 함께 온다.

| 알림                | 조건                                       | 확인 간격 |
| ------------------- | ------------------------------------------ | --------- |
| 서버 응답 없음      | `up{env="production"}`이 30초 넘게 0       | 10초      |
| 동시 접속 상한 임박 | SSE 연결 1900 이상 (nginx가 2000부터 거절) | 10초      |
| 서버 느려짐         | 이벤트 루프 지연 p99가 1분 넘게 100ms 초과 | 10초      |
| 증설 준비           | 하루 최대 SSE 연결 1400 이상               | 1시간     |

서버가 죽으면 나머지 알림은 값이 없어지는데, 이때는 직전 상태를 유지하고 서버 응답 없음 하나만 울린다. 알림은 조건이 풀리면 해제 메시지와 함께 저절로 꺼지고, 계속 울리는 동안에는 4시간마다 다시 보낸다. 증설 준비는 한 번 넘으면 하루 동안 울린 상태로 남으므로 하루에 한 번만 다시 보낸다. 동시 접속 상한 임박과 증설 준비 기준은 운영 nginx의 SSE 상한 2000에서 정했으므로, 상한을 바꾸면 두 기준도 함께 바꾼다. 운영 서버에서 부하 테스트를 할 때는 미리 Grafana의 Alerting > Silences에서 `env=production`으로 테스트 시간 동안 알림을 끈다.

처음 반영할 때는 `.env`에 값을 먼저 넣고 파일을 복사한다. 알림 파일을 바꾸면 서버에 복사한 뒤 `docker compose -f infra-compose.yml restart grafana`로 다시 읽힌다. `grafana/.env`를 바꿨을 때는 `restart`로는 반영되지 않으므로 `docker compose -f infra-compose.yml up -d --force-recreate grafana`로 컨테이너를 다시 만든다.

## 검색 노출과 캐시

검색에 나오는 페이지는 운영의 메인(`/`) 하나다. web 빌드의 `index.html`에 title, description, canonical, 공유 미리보기(OG, 이미지 `public/og-image.jpg`), JSON-LD가 있고 `robots.txt`와 `sitemap.xml`이 함께 배포된다. 메인이 아닌 주소(방 링크, 없는 페이지)는 앱이 처음 그릴 때 `<meta name="robots" content="noindex">`를 넣어 검색에서 뺀다. 화면 크기 안내가 나오는 경우도 같다. nginx는 모든 화면 주소에 `index.html`을 200으로 돌려주므로 없는 페이지도 HTTP 상태는 200이다.

카카오톡 등은 한 번 가져간 공유 카드를 캐시한다. OG 이미지를 바꿀 때는 파일 이름을 바꾸고 `index.html`의 `og:image`와 JSON-LD `image`를 함께 고치거나, 카카오 공유 디버거에서 캐시를 지운다.

staging은 운영과 같은 빌드를 쓰므로 nginx에서 검색을 막는다. 모든 응답에 `X-Robots-Tag: noindex, nofollow`를 붙이고, `robots.txt`는 전체 차단으로 바꿔 돌려주며, `sitemap.xml`은 404다. nginx는 location에 `add_header`가 하나라도 있으면 server의 `add_header`를 물려받지 않으므로, staging에서 헤더를 다는 location을 추가할 때는 `X-Robots-Tag`도 함께 적는다.

두 서버 모두 `/assets/` 빌드 파일은 1년 동안 캐시하게 하고(`immutable`), 그 밖의 응답(`index.html`, `public` 파일, 화면 주소)은 매번 서버에 확인하게 한다(`no-cache`). 빌드 파일은 이름에 해시가 있어 배포하면 새 이름이 되고, `index.html`은 매번 확인하므로 배포 직후에도 새 버전을 받는다.

nginx 설정은 자동 배포되지 않는다. 설정 파일을 서버에 복사한 뒤 `docker exec nginx nginx -t`로 문법을 확인하고 `docker exec nginx nginx -s reload`로 반영한다. `infra-compose.yml`은 `nginx.conf` 파일 하나를 컨테이너에 마운트하므로, 서버에서 파일을 `mv`로 바꾸거나 새 파일로 저장하는 편집기로 고치면 컨테이너는 옛 파일을 계속 본다. 이때는 `cp`로 덮어쓰거나 `docker compose -f infra-compose.yml restart nginx`로 다시 읽힌다. staging에 먼저 반영해 확인한 뒤 운영에 반영한다. 반영 후 아래를 확인한다.

| 요청                                           | 운영                                                 | staging                                                           |
| ---------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------- |
| `curl -sI https://<도메인>/`                   | 200, `cache-control: no-cache`, `x-robots-tag` 없음  | 200, `cache-control: no-cache`, `x-robots-tag: noindex, nofollow` |
| `curl -sI https://<도메인>/assets/<빌드 파일>` | `cache-control: public, max-age=31536000, immutable` | 같음 + `x-robots-tag`                                             |
| `curl -sI https://<도메인>/og-image.jpg`       | 200, `content-type: image/jpeg`                      | 같음 + `x-robots-tag`                                             |
| `curl -s https://<도메인>/robots.txt`          | `Allow: /`와 `Sitemap:`                              | `Disallow: /`                                                     |
| `curl -sI https://<도메인>/sitemap.xml`        | 200                                                  | 404                                                               |
| `curl -sI https://<도메인>/api/health`         | 기존과 같음                                          | 기존과 같음 + `x-robots-tag`                                      |

방 링크가 검색에서 빠지는지는 브라우저 개발자 도구에서 `/pomodoro/<아무 값>`을 열고 `<head>`에 `<meta name="robots" content="noindex">`가 있는지로 확인한다. 공유 카드는 운영 배포 후 카카오 공유 디버거와 X·슬랙에 링크를 붙여 확인한다.

## 인증서

두 서버 모두 certbot `--standalone`으로 Let's Encrypt 인증서를 받는다. staging 인증서 하나(`/etc/letsencrypt/live/zizon-tomato.cloud/`)에 `zizon-tomato.cloud`와 `monitoring.zizon-tomato.cloud`가 함께 들어 있다. standalone 방식은 발급·갱신 때 certbot이 80번 포트를 직접 열어야 하는데, 평소에는 nginx 컨테이너가 80번을 쓰고 있다. 그래서 발급할 때 `--pre-hook "docker stop nginx" --post-hook "docker start nginx"`를 함께 넘겨 renewal 설정에 저장해 두고, 자동 갱신 때도 nginx를 잠깐 내렸다가 올리게 한다. 갱신 중 몇 초 동안 사이트가 끊긴다. 훅이 저장됐는지는 `/etc/letsencrypt/renewal/<도메인>.conf`의 `pre_hook`, `post_hook` 줄로 확인하고, `sudo certbot renew --dry-run`으로 갱신을 미리 시험한다.

## 서버 IP

두 서버는 서로의 공인 IP만 허용한다. IP는 각 서버의 nginx 설정에 직접 적는다. staging의 `nginx/nginx.conf`에는 운영 서버 IP가 Loki 수신 경로의 `allow`로, 운영의 `production/nginx/nginx.conf`에는 staging 서버 IP가 `/api/metrics`의 `allow`로 들어 있다.

두 서버 모두 Elastic IP가 아니어서 인스턴스를 중지했다가 시작하면 공인 IP가 바뀐다. 재부팅으로는 바뀌지 않는다. IP가 바뀌면 그 서버 도메인의 DNS A 레코드를 고치고, 상대 서버 nginx 설정의 `allow` IP를 바꿔 커밋한 뒤 그 파일을 상대 서버에 복사하고 `docker exec nginx nginx -s reload`로 반영한다.

## 처음 설정

### GitHub

저장소 Settings의 Environments에 `production`을 만들고 secrets로 `SSH_HOST`, `SSH_USER`, `SSH_KEY`, `APP_DIR`, `WEB_DIR`을 등록한다. 이름은 staging environment와 같고 값만 운영 서버 것이다. `WEB_DIR`은 운영 nginx의 `root`인 `/home/ubuntu/wannabe-ketchup/dist`이고, 경로를 바꾸면 `production/nginx/nginx.conf`의 `root`와 `production/infra-compose.yml`의 `dist` 마운트도 함께 바꾼다.

### staging 서버

staging 서버의 `/home/ubuntu/wannabe-ketchup`은 git clone이 아니라 필요한 파일만 복사해 둔 디렉터리다. `app-compose.yml`은 워크플로가 복사하고, 나머지 infra 파일은 저장소에서 직접 복사한다. 복사할 것은 `infra-compose.yml`, `nginx/nginx.conf`, `prometheus/`, `loki/`, `promtail/`, `grafana/provisioning/`, `grafana/dashboards/`이다. 저장소에 없는 `grafana/.env`는 서버에서 만들어 `GF_SECURITY_ADMIN_PASSWORD`에 긴 비밀번호를, `DISCORD_WEBHOOK_URL`에 알림 채널의 webhook 주소를 넣는다. Grafana가 인터넷에 공개되므로 이 비밀번호가 유일한 보호 수단이다.

파일을 올리기 전에 `monitoring.zizon-tomato.cloud`의 DNS A 레코드를 staging 서버 IP로 추가하고, 기존 인증서에 서브도메인을 더한다. 인증서가 서브도메인을 담고 있지 않으면 새 nginx 설정의 Grafana 블록은 인증서 경고를 낸다.

```bash
sudo certbot certonly --standalone --expand \
  -d zizon-tomato.cloud -d monitoring.zizon-tomato.cloud \
  --pre-hook "docker stop nginx" --post-hook "docker start nginx"
```

그다음 `docker compose -f infra-compose.yml up -d`로 Prometheus, Loki, Promtail, Grafana를 띄우고, 바뀐 nginx 설정을 읽도록 `docker compose -f infra-compose.yml up -d --force-recreate nginx`로 nginx를 다시 만든다. 이후 설정 파일만 바꿨을 때는 compose 정의가 그대로라 컨테이너가 다시 만들어지지 않으므로 `docker compose -f infra-compose.yml restart <서비스 이름>`으로 다시 읽힌다.

### 운영 서버

운영 서버의 `APP_DIR`에 `production/` 아래 파일을 그대로 둔다. `app-compose.yml`과 `infra-compose.yml`이 같은 `./logs`를 공유해야 Promtail이 Nest 로그를 읽을 수 있으므로 두 파일은 같은 디렉터리에 있어야 한다. 인증서는 nginx를 띄우기 전에 `sudo certbot certonly --standalone -d wannabe-ketchup.com --pre-hook "docker stop nginx" --post-hook "docker start nginx"`로 받는다. nginx 컨테이너가 아직 없을 때는 훅이 실패해도 발급은 진행되며, 훅은 renewal 설정에 저장돼 이후 자동 갱신에 쓰인다.

비밀값은 커밋하지 않는 `.env`에 두고, 루트 `.env.example`의 항목을 운영 값으로 채운다.

`docker compose -f infra-compose.yml up -d`로 nginx와 Promtail을 먼저 띄운다. Nest는 main에 머지하면 워크플로가 띄우고, 그 전에 직접 띄우려면 staging에서 검증한 커밋 SHA로 `TAG=<SHA> docker compose -f app-compose.yml up -d --wait`를 실행한다. 운영 `app-compose.yml`은 `TAG`가 없으면 실행을 거부한다.

### 적용 확인

staging Grafana에서 `up{env="production"}`이 1인지, Explore의 Loki에서 `{env="production"}`과 `{env="staging"}` 로그가 들어오는지 확인한다. staging 로그가 들어오지 않으면 staging 서버에서 `docker logs promtail`을 확인한다. 운영 로그가 들어오지 않으면 운영 서버에서 `docker logs promtail`을, staging 서버에서 nginx 로그의 403 기록을 확인한다. 403이 보이면 nginx 설정의 `allow` IP가 실제 서버 IP와 다른 것이다.
