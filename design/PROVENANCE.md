# PROVENANCE — design/claude-export

이 문서는 `design/claude-export/` 아래 반입한 외부 디자인 원본의 출처와 무결성을
기록한다. 원본은 byte-for-byte 사본이며 수정하지 않는다.

## 출처

- **출처:** Claude Design export (프로젝트에서 제공한 디자인 핸드오프 번들).
- **원본 ZIP 파일명:** `claude-design-export.zip`
- **ZIP SHA-256:** `2a9d0402eaba82637052737e41d329073fb2f7e51f875f539089c505a6fce90d`
- **반입 일자:** 2026-07-23
- **원본 ZIP은 저장소에 커밋하지 않는다.** 위 ZIP SHA-256과 아래 파일별 SHA-256으로
  재현·무결성을 검증한다.

## 경로명 차이 (기록용)

동일 대상을 세 곳에서 다르게 지칭한다. 혼동 방지를 위해 남긴다.

- 번들 자체 README(`design/claude-export/README.md`)는 내부 경로를 `ai/project/...`로
  지칭한다.
- ZIP에서 추출한 디렉터리명은 `claude-design/`이다.
- 저장소 반입 경로는 `design/claude-export/`다.

## 라이선스 / 소유권

- 프로젝트에서 제공한 디자인 export이며, 번들 내부에서 **별도 라이선스 파일을 확인하지
  못했다.** 그 이상의 소유권·라이선스 상태는 이 문서에서 단정하지 않는다.

## 파일별 SHA-256 인벤토리

반입한 각 파일의 SHA-256이다(`design/claude-export/` 기준 상대 경로). `.DS_Store` 등
OS 잔재는 반입하지 않았다.

| SHA-256                                                            | 파일                                       |
| ------------------------------------------------------------------ | ------------------------------------------ |
| `cd2577a8258d8c88752398277b049b0fa576ea3bd5e6de7092128d6ad57eee08` | `README.md`                                |
| `470ff916d055ed4eeffafcfe49f2d389c419b89e438033be7753e70a8944eb89` | `project/.thumbnail`                       |
| `42f3f0a7f2ae98f63c3f4d82e59f785e3c0ebba58097b274b888bd487a29275a` | `project/Ask 결과-print-ispnc.dc.html`     |
| `eb101703858cdf2ecb328b5a04819def3df6a7b11e0182c0cb4619b21a81801f` | `project/Ask 결과.dc.html`                 |
| `accb870bacb33975ed2acb976a7b49c3610ec713950caab1b5a47cb3f1e16d23` | `project/Home-print-fg5s8s.dc.html`        |
| `d83d79f71cd8139638b8fe966df8d360c369c23f9d4748b8ebcfdd38747e5079` | `project/Home.dc.html`                     |
| `e0650b109ec8f78ccc370fa27762b0c485cee4f208156a671f346e8544fc2214` | `project/support.js`                       |
| `253ae640518412b0efffa823a15fa46720751417b9a18dc213fc569e1fca0d24` | `project/공부 노트 저장.dc.html`           |
| `2332f0f1e4d2ad33dcebbd6c9571f157d265cd73714b201fa53217973a726be4` | `project/기록 목록 - 빈 상태.dc.html`      |
| `c5722a6e91df5827cdb8cec8052eb719d96ac964b7ba75d64fe5f2a9393b49c1` | `project/기록 목록.dc.html`                |
| `11991507aeead10241e28b327e1aa6c5b2f7e72622505373bacff80d00bd8759` | `project/디자인 시스템.dc.html`            |
| `14d7648f45cfc31f746fc1e61b95ea487203691de5972d6d7c58aab7e4952133` | `project/복기.dc.html`                     |
| `88333b325c0d80acb1eb41577c57f585d960e29980cab8c6a089769f9cef718e` | `project/온보딩.dc.html`                   |
| `0f18b0638f65eda4ba5bed51eb7a1d32cbd60a76740ee4ae30e6ddcca77e9298` | `project/일지 상세.dc.html`                |
| `c4a847caf98dc461a4aae646095f6a1ca005d3855f0589def675e6fe9fd37730` | `project/일지 저장.dc.html`                |
| `8e6b5c9863239fc178cc411fd5df83e6c48009e23dafae3a1f877e1cfb754a72` | `project/프로토타입 v2.dc.html`            |
| `2029c2cc62a49b452999c819d4f584da451d771eb932aefef2b6ab5cbe9dd5c9` | `project/프로토타입-print-1j2616q.dc.html` |
| `2bc74d73e59db148652d8edd4f1dd355f3b4310a2b7f9e0ab50b39770b049ce7` | `project/프로토타입.dc.html`               |

## 재검증 방법

```bash
# ZIP SHA-256 (staging 원본 보유 시)
shasum -a 256 claude-design-export.zip

# 반입 파일별 SHA-256
cd design/claude-export
find . -type f ! -name .DS_Store -exec shasum -a 256 {} \;
```
