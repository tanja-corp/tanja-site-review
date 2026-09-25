/* TANJA object map: the single source of truth for the design, concept and ER views.
   Edit here (or in the explorer, then save back to this file). Verify against the site with:  node architecture/check.js */
window.OBJECT_MODEL = {
  "meta": {
    "title": "TANJA オブジェクトマップ",
    "version": "2026-09-25",
    "slotEntity": "photo-slot",
    "i18nEntity": "translation",
    "site": "index.html",
    "notes": "デザインデータ・概念図・ER図は、このファイル1つから毎回描き直される。座標は保存しない。2026-09-25のWeb Development Meetingの決定を反映（Our Staffの独立、Vision/Missionの一時休止、What We Doの3系統再編）。"
  },
  "tokens": [
    {"name":"--c-surface","value":"#faf8f2","group":"color","ja":"背景（紙）"},
    {"name":"--c-surface-2","value":"#f2eee4","group":"color","ja":"背景（薄い面）＝M3 surface-container。奇数番目のセクションが自動でこの色"},
    {"name":"--c-surface-3","value":"#e7e1d2","group":"color","ja":"背景（濃い面）＝M3 surface-container-highest"},
    {"name":"--c-on-surface","value":"#1d201b","group":"color","ja":"本文"},
    {"name":"--c-on-surface-2","value":"#474b41","group":"color","ja":"本文（補助）＝M3 on-surface-variant"},
    {"name":"--c-on-surface-3","value":"#5f6357","group":"color","ja":"注記・淡い文字（TANJA独自の3段目。13px以上のみ）"},
    {"name":"--c-outline","value":"#7c7a6c","group":"color","ja":"枠線＝M3 outline（見える必要のある境界）"},
    {"name":"--c-outline-2","value":"#d5cfbf","group":"color","ja":"罫線＝M3 outline-variant（飾りの細線のみ）"},
    {"name":"--c-primary","value":"#24402f","group":"color","ja":"森の緑（主色）＝M3 primary。VM帯とお問い合わせの面にも使う"},
    {"name":"--c-on-primary","value":"#ffffff","group":"color","ja":"緑の上の文字"},
    {"name":"--c-primary-2","value":"#dde7d8","group":"color","ja":"薄い緑＝M3 primary-container"},
    {"name":"--c-on-primary-2","value":"#16301f","group":"color","ja":"薄い緑の上の文字＝M3 on-primary-container"},
    {"name":"--c-accent","value":"#9c3a2d","group":"color","ja":"コーヒーチェリー赤（モバイルメニューの現在地のみ。状態表示には使わない）"},
    {"name":"--c-inverse","value":"#19231c","group":"color","ja":"フッター背景＝M3 inverse-surface"},
    {"name":"--c-on-inverse","value":"#ece9de","group":"color","ja":"フッター文字"},
    {"name":"--c-on-inverse-2","value":"#b9bdaf","group":"color","ja":"フッター補助文字"},
    {
      "name": "--fs-display",
      "value": "clamp(3.5rem, 1.6rem + 8.5vw, 8rem)",
      "group": "type",
      "ja": "ヒーローのワードマーク"
    },
    {
      "name": "--fs-headline",
      "value": "clamp(2.25rem, 1.45rem + 3.2vw, 4rem)",
      "group": "type",
      "ja": "セクション見出し（1440pxで64px）"
    },
    {"name":"--fs-lede","value":"clamp(1.375rem, 1.05rem + 1.3vw, 1.875rem)","group":"type","ja":"導入の大きい一文（会社紹介・キャリア）"},
    {
      "name": "--fs-title-l",
      "value": "clamp(1.5rem, 1.2rem + 1.3vw, 2.125rem)",
      "group": "type",
      "ja": "ブロック見出し"
    },
    {"name":"--fs-title","value":"1.25rem","group":"type","ja":"小見出し"},
    {"name":"--fs-body-l","value":"clamp(1.0625rem, 1.0417rem + 0.0926vw, 1.125rem)","group":"type","ja":"本文（スマホ17px・デスクトップ18px）"},
    {"name":"--fs-body","value":"1rem","group":"type","ja":"補助本文"},
    {"name":"--fs-label","value":"0.8125rem","group":"type","ja":"ラベル"},
    {"name":"--sp-1","value":"0.25rem","group":"space","ja":"4px"},
    {"name":"--sp-2","value":"0.5rem","group":"space","ja":"8px"},
    {"name":"--sp-3","value":"0.75rem","group":"space","ja":"12px"},
    {"name":"--sp-4","value":"1rem","group":"space","ja":"16px"},
    {"name":"--sp-5","value":"1.5rem","group":"space","ja":"24px"},
    {"name":"--sp-6","value":"2rem","group":"space","ja":"32px"},
    {"name":"--sp-7","value":"3rem","group":"space","ja":"48px"},
    {"name":"--sp-8","value":"4rem","group":"space","ja":"64px"},
    {"name":"--sp-9","value":"6rem","group":"space","ja":"96px"},
    {"name":"--section-y","value":"clamp(4.5rem, 3rem + 5vw, 8.5rem)","group":"layout","ja":"セクションの上下余白"},
    {"name":"--gutter","value":"clamp(1rem, 0.4rem + 3vw, 2.5rem)","group":"layout","ja":"左右の余白"},
    {"name":"--col-gap","value":"clamp(1rem, 0.4rem + 2vw, 1.75rem)","group":"layout","ja":"12列グリッドの列間（768px以上）"},
    {"name":"--container","value":"82rem","group":"layout","ja":"文字が乗る最大幅（1312px）。写真はこの外の窓の端まで出せる"},
    {"name":"--measure","value":"33.5rem","group":"layout","ja":"本文の行長（ラテン文字で約54字。M3は40〜60）"},
    {"name":"--header-h","value":"4rem","group":"layout","ja":"ヘッダー高さ（≥960pxで4.75rem）"},
    {"name":"--touch","value":"44px","group":"layout","ja":"タッチターゲット最小"},
    {"name":"--radius-s","value":"4px","group":"shape","ja":"内側に置く写真の角（窓の端まで出す写真は0）"},
    {"name":"--radius-pill","value":"999px","group":"shape","ja":"ピル形"},
    {"name":"--ease","value":"cubic-bezier(0.2, 0, 0, 1)","group":"motion","ja":"イージング（M3 standard）"},
    {"name":"--ease-out","value":"cubic-bezier(0.05, 0.7, 0.1, 1)","group":"motion","ja":"入ってくる動き（M3 emphasized decelerate）"},
    {"name":"--ease-in","value":"cubic-bezier(0.3, 0, 0.8, 0.15)","group":"motion","ja":"出ていく動き（M3 emphasized accelerate）"},
    {"name":"--dur-s","value":"150ms","group":"motion","ja":"短い遷移（M3 short3）"},
    {"name":"--dur-m","value":"300ms","group":"motion","ja":"標準の遷移（M3 medium2）"},
    {"name":"--dur-l","value":"400ms","group":"motion","ja":"メニューが開く（M3 medium4）。閉じるのは200ms"}
  ],
  "breakpoints": [
    {"query":"(max-width: 22.5em)","ja":"小型スマホ：ヘッダー要素を詰める"},
    {"query":"(min-width: 37.5em)","ja":"600px：スタッフ4列"},
    {"query":"(min-width: 48em)","ja":"768px：12列グリッドに切替。ヒーロー約88%。VM・作物・プロジェクトが2列、スタッフは見出し｜写真列"},
    {"query":"(max-width: 59.99em)","ja":"<960px：メニューボタン＋全画面シート"},
    {"query":"(min-width: 60em)","ja":"960px：インラインナビ（文字だけのヘッダー）"},
    {"query":"(min-width: 64em)","ja":"1024px：デスクトップの非対称構図（会社紹介｜大写真、コーヒー大写真、プロジェクト3列、キャリア分割）"},
    {"query":"(min-width: 75em)","ja":"1200px：写真の比率をさらに横長に"},
    {"query":"(max-width: 700px)","ja":"ヒーロー画像を縦切り出しに差し替え（HTMLの<picture>）","html":true}
  ],
  "domains": [
    {"id":"site","ja":"サイトの構造","en":"Site","color":"#24402f"},
    {"id":"company","ja":"会社と事業","en":"Company & business","color":"#9c3a2d"},
    {"id":"content","ja":"写真・言語","en":"Media & language","color":"#3f6472"},
    {"id":"governance","ja":"出典と承認","en":"Sources & approval","color":"#5b4b7a"},
    {"id":"people","ja":"人と採用","en":"People","color":"#8a6420"}
  ],
  "objects": [
    {
      "id": "site",
      "kind": "entity",
      "ja": "サイト（1ページ）",
      "en": "Site (one page)",
      "status": "built",
      "summary": "ロングスクロールの1ページ。表示セクションは6つ（Hero／About／Our Staff／What We Do／Career／Contact）とヘッダー・フッター。Our Staffは2026-09-25にAboutから独立。News は将来挿入（2か所の編集）。",
      "design": {
        "root": true,
        "layout": "stack",
        "gap": 14,
        "inset": [30,14,14,14],
        "component": "body › main",
        "tokens": ["--container","--section-y","--gutter"],
        "note": "デスクトップ1440pxを主画面に設計。12列グリッド（.wrap）、文字の最大幅1312px、写真は窓の端まで出せる。JS無効でも英語版とナビは読める。"
      },
      "concept": {"domain":"site","order":0},
      "er": {
        "table": "SiteSettings",
        "col": 0,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"default_language","type":"enum","req":true,"note":"en（既定）／sw／ja"},
          {"name":"copyright_line","type":"text","placeholder":true,"note":"文言・年は TANJA が確認"},
          {"name":"logo","type":"image","placeholder":true,"note":"公式ロゴ未提供（文字のワードマークで代用）"}
        ]
      }
    },
    {
      "id": "header",
      "kind": "element",
      "ja": "ヘッダー",
      "en": "Header",
      "status": "built",
      "summary": "ブランド、4つのナビ、EN|SW|JP、メニューボタン。ヒーロー上は透明、スクロールで不透明。デスクトップは箱のない文字だけの1行。",
      "design": {
        "parent": "site",
        "order": 0,
        "layout": "row",
        "mock": "bar",
        "inset": [26,64,6,118],
        "component": ".site-header",
        "placeholders": ["logo"],
        "tokens": ["--header-h","--touch"],
        "note": "≥960px：文字だけのインラインナビ／<960px：ピル形の言語切替＋メニューボタン＋全画面シート"
      }
    },
    {
      "id": "nav-item",
      "kind": "entity",
      "ja": "ナビ項目",
      "en": "Nav item",
      "status": "built",
      "summary": "ヘッダーの項目が正。フッターは script.js がヘッダーの一覧を写す（JS無効時は静的な一覧）。各項目は1つのセクションへ移動する。2026-09-25にOur Staffを追加（5項目）。",
      "design": {
        "parent": "header",
        "order": 0,
        "weight": 3,
        "mock": "chips",
        "h": 44,
        "repeat": {"shown":5,"min":4,"max":6},
        "component": ".site-nav a",
        "alsoIn": ["footer"]
      },
      "concept": {"domain":"site","order":1},
      "er": {
        "table": "NavItem",
        "col": 0,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"label","type":"text","req":true,"i18n":true},
          {"name":"target","type":"text","req":true,"note":"移動先のアンカーID（#about など）"},
          {"name":"sort_order","type":"int"},
          {"name":"visible","type":"bool"}
        ]
      }
    },
    {
      "id": "language",
      "kind": "entity",
      "ja": "言語",
      "en": "Language",
      "status": "provisional",
      "summary": "EN（既定）／SW／JP。言語ごとの一括の「下書き」は持たず、文言（翻訳）ごとに確認状態を持つ。",
      "design": {
        "parent": "header",
        "order": 1,
        "weight": 1.6,
        "mock": "chips",
        "h": 44,
        "repeat": {"shown":3,"min":3,"max":3},
        "component": ".lang（セグメントコントロール）",
        "alsoIn": ["footer"]
      },
      "concept": {"domain":"content","order":2},
      "er": {
        "table": "Language",
        "col": 0,
        "fields": [
          {"name":"code","type":"text","pk":true},
          {"name":"autonym","type":"text","note":"English / Kiswahili / 日本語"},
          {"name":"is_default","type":"bool"},
          {"name":"review_owner","type":"text","note":"EN 社内英語担当／SW ネイティブ／JP AI下書き→日本語話者"},
          {"name":"review_state","type":"enum","note":"言語全体の状態ではなく、公開判断の目安。表示の根拠は各 Translation の状態"}
        ]
      }
    },
    {
      "id": "hero",
      "kind": "entity",
      "ja": "ホーム（ヒーロー）",
      "en": "Hero",
      "status": "provisional",
      "summary": "静止画1枚とワードマークと場所の1行（Karatu, Tanzania。仮置き・要承認）。高さは窓の約88%（スマホは窓いっぱい）。スライダー・動画・CTAなし。",
      "design": {
        "parent": "site",
        "order": 1,
        "mock": "hero",
        "h": 300,
        "htmlId": "home",
        "placeholders": ["hero-line"],
        "component": ".hero",
        "slot": "01",
        "slotField": "image",
        "tokens": ["--fs-display","--c-on-primary"],
        "note": "≤700pxは縦切り出し画像に差し替え。上部に暗いスクリムを重ねる。"
      },
      "concept": {"domain":"site","order":2},
      "er": {
        "table": "Hero",
        "col": 1,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"image","type":"image","req":true},
          {"name":"mobile_crop","type":"image","nullable":true,"note":"縦切り出し（任意）"},
          {"name":"location_line","type":"text","i18n":true,"nullable":true,"note":"場所の1行（Farms in Karatu, Tanzania）。所在地の住所は出さない。空なら表示しない"},
          {"name":"wordmark","type":"text"}
        ]
      }
    },
    {
      "id": "about",
      "kind": "element",
      "ja": "About（会社概要）",
      "en": "About",
      "status": "built",
      "summary": "会社そのものの説明。2026-09-25からOur Companyのみ（TANJAとは何か／名前の意味／始まり）。Our Staffは独立セクションへ、Vision・Missionは非表示（planned）へ移した。Karatu は独立セクションにしない。デスクトップは見出し・導入・事実を左、写真を右の窓の端まで。",
      "design": {
        "parent": "site",
        "order": 2,
        "layout": "stack",
        "htmlId": "about",
        "component": ".section",
        "inset": [28,12,12,12]
      },
      "concept": {"domain":"site","order":5}
    },
    {
      "id": "our-company",
      "kind": "entity",
      "ja": "Our Company（会社紹介）",
      "en": "Our company",
      "status": "provisional",
      "summary": "大きい導入の一文、本文、事実4つ（会社名・名前の意味・開始・所在地）、写真1枚。名前の意味は未確認のためplaceholder（絶対に推測で作らない）。数値・面積・人数は載せない。",
      "design": {
        "parent": "about",
        "order": 0,
        "mock": "company",
        "h": 200,
        "htmlId": "our-company",
        "component": ".about（本文｜写真の非対称）＋ .facts",
        "slot": "02",
        "slotField": "photo",
        "placeholders": ["name-meaning"],
        "note": "≥1024pxで本文（5列）｜写真（右の窓の端まで）。<1024pxは本文の下に写真。導入の一文を大きく、残りを本文に。事実は表でなく注記の並び（会社名・名前の意味・開始・所在地）"
      },
      "concept": {"domain":"company","order":0},
      "er": {
        "table": "CompanyProfile",
        "col": 1,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"legal_name","type":"text","req":true},
          {"name":"started_year","type":"int","note":"2023（要確認）"},
          {"name":"location","type":"text","i18n":true},
          {"name":"summary","type":"text","i18n":true},
          {"name":"photo","type":"image"}
        ]
      }
    },
    {
      "id": "staff",
      "kind": "entity",
      "ja": "スタッフ",
      "en": "Staff",
      "status": "placeholder",
      "summary": "人物は創作しない。承認済みの名簿・肩書・顔写真が届くまで「Staff Member／Role」の枠。2026-09-25にAboutから独立したtop-levelセクションへ（ヘッダーnavにも項目を追加）。",
      "design": {
        "parent": "site",
        "order": 2.5,
        "mock": "cards",
        "h": 190,
        "repeat": {"shown":4,"min":3,"max":6},
        "htmlId": "our-staff",
        "component": ".staff-grid > .person",
        "slot": "03",
        "slotField": "portrait",
        "placeholders": ["staff-roster"],
        "note": "独立セクション（About と What We Do の間）。<600px：2列／≥600px：4列／≥1024px：見出しの右8列に自動で並ぶ（3〜6人）。枠は小さく、画面の主役にしない"
      },
      "concept": {"domain":"people","order":0},
      "er": {
        "table": "Staff",
        "col": 2,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"name","type":"text","req":true,"placeholder":true},
          {"name":"role","type":"text","req":true,"i18n":true,"placeholder":true},
          {"name":"portrait","type":"image"},
          {"name":"sort_order","type":"int"},
          {"name":"public","type":"bool","note":"承認前は false"}
        ]
      }
    },
    {
      "id": "vision-mission",
      "kind": "entity",
      "ja": "ビジョン／ミッション",
      "en": "Vision / Mission",
      "status": "planned",
      "summary": "正式な文言は未確定。Smart Village の使命や OSTI の価値観を混ぜて創作しない。2026-09-25のホワイトボードから外れたため、visible buildからは一時的に非表示（ghost）。過去の検討は破棄しない — docs/WEB_V2_WORKING_BRIEF.md参照。再表示する場合はdesignのghostを外し、index.htmlに.bandを戻す。",
      "design": {
        "parent": "about",
        "order": 2,
        "mock": "band",
        "h": 120,
        "htmlId": "vision-mission",
        "ghost": true,
        "component": ".band > .vm",
        "tokens": ["--c-primary","--c-on-primary"],
        "note": "DEFERRED 2026-09-25：現在is not renderedのghost。全幅の緑の帯（CSSは styles.css に残置）。≥768pxでVisionとMissionを左右2列、大きい文字。"
      },
      "concept": {"domain":"company","order":1},
      "er": {
        "table": "VisionMission",
        "col": 1,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"vision","type":"text","i18n":true,"placeholder":true},
          {"name":"mission","type":"text","i18n":true,"placeholder":true}
        ]
      }
    },
    {
      "id": "what-we-do",
      "kind": "element",
      "ja": "What We Do（事業内容）",
      "en": "What We Do",
      "status": "built",
      "summary": "2026-09-25に3系統へ再編：Farm（Coffee／Avocado／Macadamia／Beekeeping）、Sustainability（Carbon Credit／Lunch／Cattle。増やせる）、Cafe（単独のfeature block）。",
      "design": {
        "parent": "site",
        "order": 3,
        "layout": "stack",
        "htmlId": "what-we-do",
        "component": ".section（背景は奇数番目が自動で薄い面）",
        "inset": [28,12,12,12]
      },
      "concept": {"domain":"site","order":6}
    },
    {
      "id": "farm",
      "kind": "entity",
      "ja": "ファーム（作物）",
      "en": "Farm",
      "status": "provisional",
      "summary": "コーヒーは確立した中核、アボカド・マカダミア・養蜂は新しい／付随する分野。段階を断定しない。2026-09-25に4項目の均等グリッドへ再編（旧：コーヒーだけ大写真＋ペア）。",
      "design": {
        "parent": "what-we-do",
        "order": 0,
        "layout": "grid",
        "cols": 2,
        "htmlId": "farm",
        "component": ".group > .farm-grid",
        "inset": [28,12,12,12],
        "note": "4項目（Coffee／Avocado／Macadamia／Beekeeping）を同じ大きさのカードで2×2（≥768px）／1列（phone）に。Coffeeはchipラベルのみで少し強調、構造は均等。"
      },
      "concept": {"domain":"company","order":2},
      "er": {
        "table": "Crop",
        "col": 2,
        "fields": [
          {"name":"key","type":"enum","pk":true},
          {"name":"title","type":"text","i18n":true},
          {"name":"stage_chip","type":"text","i18n":true,"note":"確立した中核／新しい分野"},
          {"name":"text","type":"text","i18n":true},
          {"name":"details","type":"text","i18n":true,"placeholder":true},
          {"name":"photo","type":"image"},
          {"name":"featured","type":"bool"}
        ]
      }
    },
    {
      "id": "coffee",
      "kind": "row",
      "ja": "コーヒー",
      "en": "Coffee",
      "status": "provisional",
      "design": {
        "parent": "farm",
        "order": 0,
        "mock": "crop",
        "h": 230,
        "htmlId": "coffee",
        "component": ".crop",
        "slot": "04",
        "slotField": "photo",
        "placeholders": ["coffee-details"],
        "note": "確立した中核事業。farm-grid内の1枚（他の3枚と同じ大きさ、chipラベルのみ強調）。写真の撮影時期は出典で確認済み（台帳スロット04）。ページ上には日付を出さない。"
      },
      "concept": {"domain":"company","order":5},
      "er": {"rowOf":"farm","values":{"key":"coffee"}}
    },
    {
      "id": "avocado",
      "kind": "row",
      "ja": "アボカド",
      "en": "Avocado",
      "status": "placeholder",
      "design": {
        "parent": "farm",
        "order": 1,
        "mock": "crop",
        "h": 230,
        "htmlId": "avocado",
        "component": ".crop",
        "slot": "06",
        "slotField": "photo",
        "placeholders": ["avocado-details"]
      },
      "concept": {"domain":"company","order":6},
      "er": {"rowOf":"farm","values":{"key":"avocado"}}
    },
    {
      "id": "macadamia",
      "kind": "row",
      "ja": "マカダミア",
      "en": "Macadamia",
      "status": "placeholder",
      "design": {
        "parent": "farm",
        "order": 2,
        "mock": "crop",
        "h": 230,
        "htmlId": "macadamia",
        "component": ".crop",
        "slot": "05",
        "slotField": "photo",
        "placeholders": ["macadamia-details"]
      },
      "concept": {"domain":"company","order":7},
      "er": {"rowOf":"farm","values":{"key":"macadamia"}}
    },
    {
      "id": "beekeeping",
      "kind": "row",
      "ja": "養蜂",
      "en": "Beekeeping",
      "status": "placeholder",
      "summary": "TANJAの農園活動のひとつ。規模・生産量は未確認。",
      "design": {
        "parent": "farm",
        "order": 3,
        "mock": "crop",
        "h": 230,
        "htmlId": "beekeeping",
        "component": ".crop",
        "slot": "10",
        "slotField": "photo",
        "placeholders": ["beekeeping-details"]
      },
      "concept": {"domain":"company","order":8},
      "er": {"rowOf":"farm","values":{"key":"beekeeping"}}
    },
    {
      "id": "project",
      "kind": "entity",
      "ja": "サステナビリティ",
      "en": "Sustainability",
      "status": "built",
      "summary": "2026-09-25に「Project」から改称。Carbon Credit・Lunch・Cattleが最初の3件で、閉じた分類ではない。成果・提携先・受益者数は書かない。写真主体で、枠線のカードにしない。htmlId／CSSコンポーネント名は互換のため project のまま。",
      "design": {
        "parent": "what-we-do",
        "order": 1,
        "layout": "grid",
        "cols": 3,
        "htmlId": "project",
        "component": ".project-grid",
        "inset": [28,12,12,12],
        "note": "3列（≥1024px）／2列（≥768px）／1列。<li> を足すと次の空きに入る。CSS変更不要（4件目以降も同じ）"
      },
      "concept": {"domain":"company","order":3},
      "er": {
        "table": "Project",
        "col": 2,
        "fields": [
          {"name":"slug","type":"text","pk":true},
          {"name":"title","type":"text","i18n":true},
          {"name":"text","type":"text","i18n":true},
          {"name":"details","type":"text","i18n":true,"placeholder":true},
          {"name":"photo","type":"image"},
          {"name":"detail_article","type":"ref","nullable":true,"note":"将来：詳細記事へ"},
          {"name":"sort_order","type":"int"}
        ]
      }
    },
    {
      "id": "carbon",
      "kind": "row",
      "ja": "カーボンクレジット",
      "en": "Carbon Credit",
      "status": "placeholder",
      "summary": "2026-09-25に表示名を「Carbon」から「Carbon Credit」へ変更（id／slotは同一プロジェクトのため据え置き）。credit取得・発行・成果は断定しない。",
      "design": {
        "parent": "project",
        "order": 0,
        "mock": "project-card",
        "h": 210,
        "htmlId": "carbon",
        "component": ".project",
        "slot": "07",
        "slotField": "photo",
        "placeholders": ["carbon-details"]
      },
      "concept": {"domain":"company","order":9},
      "er": {"rowOf":"project","values":{"slug":"carbon"}}
    },
    {
      "id": "school",
      "kind": "row",
      "ja": "ランチ",
      "en": "Lunch",
      "status": "placeholder",
      "summary": "2026-09-25に表示名を「School」から「Lunch」へ変更（ホワイトボード写真の直接表記に一致。id／slotは同一プロジェクトのため据え置き — docs/CONTENT_SOURCE_MAP.md D11の学校食支援活動に基づく）。「Lunch」単体は一般的すぎる語のため、正式名称・対象は未確定（VERIFY）。",
      "design": {
        "parent": "project",
        "order": 1,
        "mock": "project-card",
        "h": 210,
        "htmlId": "school",
        "component": ".project",
        "slot": "08",
        "slotField": "photo",
        "placeholders": ["school-details"]
      },
      "concept": {"domain":"company","order":10},
      "er": {"rowOf":"project","values":{"slug":"school"}}
    },
    {
      "id": "cattle",
      "kind": "row",
      "ja": "牛",
      "en": "Cattle",
      "status": "placeholder",
      "summary": "2026-09-25に新規追加。TANJAの牛の存在と、サステナビリティ・プロジェクトとしての取り組みは別物として扱う（区別が未確認の間は牛の飼育事実だけを述べる）。",
      "design": {
        "parent": "project",
        "order": 2,
        "mock": "project-card",
        "h": 210,
        "htmlId": "cattle",
        "component": ".project",
        "slot": "11",
        "slotField": "photo",
        "placeholders": ["cattle-details"]
      },
      "concept": {"domain":"company","order":11},
      "er": {"rowOf":"project","values":{"slug":"cattle"}}
    },
    {
      "id": "project-more",
      "kind": "element",
      "ja": "＋将来のプロジェクト",
      "en": "More projects (future)",
      "status": "planned",
      "summary": "4件目・5件目は <li> を複製するだけで追加できる。",
      "design": {"parent":"project","order":9,"mock":"ghost","h":210,"ghost":true}
    },
    {
      "id": "cafe",
      "kind": "entity",
      "ja": "カフェ",
      "en": "Cafe",
      "status": "placeholder",
      "summary": "2026-09-25に新規追加。What We Do の第3の系統（FarmでもSustainabilityでもない）。公開できる説明が存在しないため、見出しとplaceholderのみ。社内のクラウドファンディング計画・開店予定・予算は承認なく公開しない。",
      "design": {
        "parent": "what-we-do",
        "order": 2,
        "mock": "career",
        "h": 190,
        "htmlId": "cafe",
        "component": ".wrap.group.cafe（写真｜文の対、career と同じ形）",
        "slot": "12",
        "slotField": "photo",
        "placeholders": ["cafe-details"],
        "note": "Farm・Sustainabilityと並ぶ3本目のgroup。≥1024pxで写真（右の窓の端まで）｜文。"
      },
      "concept": {"domain":"company","order":12},
      "er": {
        "table": "Cafe",
        "col": 1,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"text","type":"text","i18n":true,"placeholder":true},
          {"name":"photo","type":"image"}
        ]
      }
    },
    {
      "id": "news",
      "kind": "element",
      "ja": "News / Updates（将来）",
      "en": "News / Updates",
      "status": "planned",
      "summary": "今回は表示しない。What We Do と Career の間に、セクションとヘッダーのナビの2か所を編集するだけで追加できる（背景色の交互はCSSが自動、フッターのナビは script.js がヘッダーを写す）。",
      "design": {
        "parent": "site",
        "order": 3.5,
        "mock": "ghost-section",
        "h": 84,
        "htmlId": "news",
        "ghost": true,
        "note": "背景の交互は main > .section:nth-of-type(odd) で自動。クラスの付け替え不要"
      },
      "concept": {"domain":"site","order":3}
    },
    {
      "id": "article",
      "kind": "entity",
      "ja": "記事",
      "en": "Article",
      "status": "planned",
      "summary": "News の記事。カテゴリで各セクションに最新記事を出す構想。",
      "concept": {"domain":"site","order":4},
      "er": {
        "table": "Article",
        "col": 3,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"title","type":"text","req":true,"i18n":true},
          {"name":"published_on","type":"date"},
          {"name":"category","type":"enum"},
          {"name":"body","type":"text","i18n":true},
          {"name":"photo","type":"image"}
        ]
      }
    },
    {
      "id": "career",
      "kind": "entity",
      "ja": "キャリア",
      "en": "Career",
      "status": "placeholder",
      "summary": "現在募集しているとは言わない。応募ボタンなし。募集の有無と経路が確定するまで、静かな注記で「確認中」（赤い帯・枠は使わない）。",
      "design": {
        "parent": "site",
        "order": 4,
        "mock": "career",
        "h": 190,
        "htmlId": "career",
        "component": ".career（文｜写真の窓の端まで）＋ .status（注記）",
        "slot": "09",
        "slotField": "photo",
        "placeholders": ["career-status"],
        "note": "≥1024pxで文（5列）｜写真（右の窓の端まで）。<1024pxは写真が先、本文が後"
      },
      "concept": {"domain":"people","order":1},
      "er": {
        "table": "CareerNote",
        "col": 1,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"text","type":"text","i18n":true},
          {"name":"status_line","type":"text","i18n":true,"placeholder":true},
          {"name":"recruiting","type":"bool","req":true,"note":"既定 false"},
          {"name":"apply_url","type":"url","nullable":true,"note":"recruiting=true のときだけ表示。今は空"},
          {"name":"photo","type":"image"}
        ]
      }
    },
    {
      "id": "contact",
      "kind": "entity",
      "ja": "お問い合わせ",
      "en": "Contact",
      "status": "placeholder",
      "summary": "メール・電話・SNSのみ。フォームなし。値はすべて仮（example.com）。濃い緑の面に大きい文字で、フッターへ続く。",
      "design": {
        "parent": "site",
        "order": 5,
        "layout": "stack",
        "mock": "contact",
        "inset": [96,12,12,12],
        "htmlId": "contact",
        "component": ".contact",
        "placeholders": ["email","phone"],
        "note": "≥1024pxで見出し（5列）｜連絡先（右6列）。SNSは押せない行（disabled）"
      },
      "concept": {"domain":"site","order":7},
      "er": {
        "table": "ContactDetails",
        "col": 1,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"email","type":"email","placeholder":true},
          {"name":"phone","type":"text","placeholder":true,"note":"＋255 XX XXX XXXX"},
          {"name":"note","type":"text","i18n":true}
        ]
      }
    },
    {
      "id": "social",
      "kind": "entity",
      "ja": "SNSリンク",
      "en": "Social link",
      "status": "placeholder",
      "summary": "Instagram と Facebook。公式URLが未確認のため、押せない <button disabled>＋「リンクは確認中」の文（href=\"#\" は使わない）。URLが決まれば <a> に置き換える。",
      "design": {
        "parent": "contact",
        "order": 0,
        "mock": "chips",
        "h": 46,
        "repeat": {"shown":2,"min":2,"max":4},
        "component": ".social__link",
        "alsoIn": ["footer"],
        "placeholders": ["instagram-url","facebook-url"]
      },
      "concept": {"domain":"site","order":8},
      "er": {
        "table": "SocialLink",
        "col": 1,
        "fields": [
          {"name":"network","type":"enum","pk":true},
          {"name":"url","type":"url","placeholder":true},
          {"name":"sort_order","type":"int"}
        ]
      }
    },
    {
      "id": "footer",
      "kind": "element",
      "ja": "フッター",
      "en": "Footer",
      "status": "built",
      "summary": "ブランド、ナビ（script.js がヘッダーを写す）、言語切替、SNSアイコン（押せない）、著作権表記。",
      "design": {
        "parent": "site",
        "order": 6,
        "mock": "footer",
        "h": 104,
        "component": ".site-footer",
        "placeholders": ["copyright"],
        "tokens": ["--c-inverse","--c-on-inverse"]
      }
    },
    {
      "id": "tanja",
      "kind": "concept",
      "ja": "TANJA",
      "en": "TANJA Corporation Limited",
      "status": "built",
      "summary": "タンザニアで農園を運営する会社（正式名称の表記は要確認）。2023年に始動（要確認）。このサイトはこの会社を説明する。",
      "concept": {"domain":"company","order":4}
    },
    {
      "id": "photo-slot",
      "kind": "entity",
      "ja": "写真枠",
      "en": "Photo slot",
      "status": "built",
      "summary": "写真を差し込む場所。比率・焦点・最小解像度・派生ファイル名を持つ。写真そのものは別（Photo）。",
      "concept": {"domain":"content","order":0},
      "er": {
        "table": "PhotoSlot",
        "col": 3,
        "fields": [
          {"name":"slot_no","type":"text","pk":true},
          {"name":"location","type":"text"},
          {"name":"ratio_desktop","type":"text"},
          {"name":"ratio_mobile","type":"text"},
          {"name":"focal_point","type":"text"},
          {"name":"min_resolution","type":"text"},
          {"name":"derivative","type":"text","note":"NN-slot-name.webp/.jpg"}
        ]
      }
    },
    {
      "id": "slot-01",
      "kind": "row",
      "ja": "スロット01：Hero",
      "en": "Slot 01",
      "status": "provisional",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "01",
          "location": "Hero",
          "ratio_desktop": "full-bleed",
          "ratio_mobile": "縦切り出し 660×1166",
          "focal_point": "30% 55%",
          "min_resolution": "2400×1600 / 1080×1920",
          "derivative": "01-hero-{desktop,mobile}"
        }
      }
    },
    {
      "id": "slot-02",
      "kind": "row",
      "ja": "スロット02：Our Company",
      "en": "Slot 02",
      "status": "provisional",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "02",
          "location": "Our Company",
          "ratio_desktop": "行いっぱいに伸びる（1440pxで約1.2:1）。窓の右端まで",
          "ratio_mobile": "4:3（幅いっぱい）",
          "focal_point": "中央",
          "min_resolution": "1600×1200",
          "derivative": "02-company{,-800}"
        }
      }
    },
    {
      "id": "slot-03",
      "kind": "row",
      "ja": "スロット03：Our Staff",
      "en": "Slot 03",
      "status": "placeholder",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "03",
          "location": "Our Staff",
          "ratio_desktop": "3:4",
          "ratio_mobile": "3:4（2列）",
          "focal_point": "顔35%",
          "min_resolution": "900×1200",
          "derivative": "—"
        }
      }
    },
    {
      "id": "slot-04",
      "kind": "row",
      "ja": "スロット04：Coffee",
      "en": "Slot 04",
      "status": "provisional",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "04",
          "location": "Coffee",
          "ratio_desktop": "5:4→3:2（≥1200px）。窓の左端まで",
          "ratio_mobile": "5:4（幅いっぱい）",
          "focal_point": "中央",
          "min_resolution": "1280×1024",
          "derivative": "04-coffee{,-800}"
        }
      }
    },
    {
      "id": "slot-05",
      "kind": "row",
      "ja": "スロット05：Macadamia",
      "en": "Slot 05",
      "status": "placeholder",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "05",
          "location": "Macadamia",
          "ratio_desktop": "3:2",
          "ratio_mobile": "3:2",
          "focal_point": "中央",
          "min_resolution": "1200×800",
          "derivative": "—"
        }
      }
    },
    {
      "id": "slot-06",
      "kind": "row",
      "ja": "スロット06：Avocado",
      "en": "Slot 06",
      "status": "placeholder",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "06",
          "location": "Avocado",
          "ratio_desktop": "3:2",
          "ratio_mobile": "3:2",
          "focal_point": "中央",
          "min_resolution": "1200×800",
          "derivative": "—"
        }
      }
    },
    {
      "id": "slot-07",
      "kind": "row",
      "ja": "スロット07：Carbon",
      "en": "Slot 07",
      "status": "placeholder",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "07",
          "location": "Carbon",
          "ratio_desktop": "3:2",
          "ratio_mobile": "3:2",
          "focal_point": "中央",
          "min_resolution": "1200×800",
          "derivative": "—"
        }
      }
    },
    {
      "id": "slot-08",
      "kind": "row",
      "ja": "スロット08：School",
      "en": "Slot 08",
      "status": "placeholder",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "08",
          "location": "School",
          "ratio_desktop": "3:2",
          "ratio_mobile": "3:2",
          "focal_point": "中央",
          "min_resolution": "1200×800",
          "derivative": "—"
        }
      }
    },
    {
      "id": "slot-09",
      "kind": "row",
      "ja": "スロット09：Career",
      "en": "Slot 09",
      "status": "provisional",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "09",
          "location": "Career",
          "ratio_desktop": "4:3（右の窓の端まで）",
          "ratio_mobile": "4:3（幅いっぱい）",
          "focal_point": "50% 58%",
          "min_resolution": "1280×960",
          "derivative": "09-career{,-800}"
        }
      }
    },
    {
      "id": "slot-10",
      "kind": "row",
      "ja": "スロット10：Beekeeping",
      "en": "Slot 10",
      "status": "placeholder",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "10",
          "location": "Beekeeping",
          "ratio_desktop": "3:2",
          "ratio_mobile": "3:2",
          "focal_point": "中央",
          "min_resolution": "1200×800",
          "derivative": "—"
        }
      }
    },
    {
      "id": "slot-11",
      "kind": "row",
      "ja": "スロット11：Cattle",
      "en": "Slot 11",
      "status": "placeholder",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "11",
          "location": "Cattle",
          "ratio_desktop": "3:2",
          "ratio_mobile": "3:2",
          "focal_point": "中央",
          "min_resolution": "1200×800",
          "derivative": "—"
        }
      }
    },
    {
      "id": "slot-12",
      "kind": "row",
      "ja": "スロット12：Cafe",
      "en": "Slot 12",
      "status": "placeholder",
      "er": {
        "rowOf": "photo-slot",
        "values": {
          "slot_no": "12",
          "location": "Cafe",
          "ratio_desktop": "4:3（右の窓の端まで）",
          "ratio_mobile": "4:3（幅いっぱい）",
          "focal_point": "中央",
          "min_resolution": "1280×960",
          "derivative": "—"
        }
      }
    },
    {
      "id": "photo",
      "kind": "entity",
      "ja": "写真",
      "en": "Photo",
      "status": "provisional",
      "summary": "実際の写真ファイル。出所と承認状態、3言語の代替テキストを持つ。人物・場所・日付は見た目から推測しない。",
      "concept": {"domain":"content","order":1},
      "er": {
        "table": "Photo",
        "col": 3,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"file","type":"text","req":true},
          {"name":"alt","type":"text","req":true,"i18n":true},
          {"name":"caption","type":"text","i18n":true,"nullable":true},
          {"name":"source","type":"ref","req":true},
          {"name":"approval_state","type":"enum","req":true,"note":"PROVISIONAL／PLACEHOLDER／APPROVED"},
          {"name":"approver","type":"text","nullable":true},
          {"name":"width","type":"int"},
          {"name":"height","type":"int"}
        ]
      }
    },
    {
      "id": "translation",
      "kind": "entity",
      "ja": "翻訳",
      "en": "Translation",
      "status": "planned",
      "summary": "文言の言語別の版と確認状態。今のサイトでは SW／JP の各 span（と title・description・画像alt）が data-review=\"draft｜reviewed\" を持つ。言語全体の「下書き」旗は持たない。",
      "concept": {"domain":"content","order":3},
      "er": {
        "table": "Translation",
        "col": 0,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"subject","type":"text","req":true,"note":"テーブル.フィールド"},
          {"name":"language","type":"ref","req":true},
          {"name":"text","type":"text"},
          {"name":"review_state","type":"enum","req":true,"note":"draft（既定）／reviewed。HTML の data-review に対応。check.js が言語ごとに数える。ENは社内英語担当の確認が前提で状態を持たない"}
        ]
      }
    },
    {
      "id": "source",
      "kind": "entity",
      "ja": "出典",
      "en": "Source",
      "status": "planned",
      "summary": "主張や写真の出どころ（Drive／OSTI公開／社内資料／会議）。",
      "concept": {"domain":"governance","order":0},
      "er": {
        "table": "Source",
        "col": 3,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"kind","type":"enum","note":"drive／ostiglobal／internal／meeting"},
          {"name":"ref","type":"text","note":"URL・ファイルID"},
          {"name":"note","type":"text","nullable":true}
        ]
      }
    },
    {
      "id": "claim",
      "kind": "entity",
      "ja": "公開する主張",
      "en": "Claim",
      "status": "planned",
      "summary": "「2023年に始動」のような、サイトが言い切る一文。出典と承認者が揃うまで VERIFY。",
      "concept": {"domain":"governance","order":1},
      "er": {
        "table": "Claim",
        "col": 3,
        "fields": [
          {"name":"id","type":"id","pk":true},
          {"name":"statement","type":"text","req":true,"i18n":true},
          {"name":"source","type":"ref","req":true},
          {"name":"approval_state","type":"enum","req":true,"note":"VERIFY／APPROVED"},
          {"name":"approver","type":"text","nullable":true},
          {"name":"approved_on","type":"date","nullable":true},
          {"name":"subject","type":"text","note":"対象（会社紹介・作物…）"}
        ]
      }
    }
  ],
  "links": [
    {
      "id": "l1",
      "from": "site",
      "to": "nav-item",
      "card": "1:N",
      "verb": {"ja":"ナビ項目を持つ","en":"has nav items"},
      "noFk": true
    },
    {
      "id": "l2",
      "from": "site",
      "to": "language",
      "card": "1:N",
      "verb": {"ja":"言語を提供する","en":"offers"},
      "noFk": true
    },
    {
      "id": "l3",
      "from": "site",
      "to": "photo-slot",
      "card": "1:N",
      "verb": {"ja":"写真枠を持つ","en":"has slots"},
      "noFk": true,
      "views": ["concept"]
    },
    {
      "id": "l4",
      "from": "tanja",
      "to": "farm",
      "card": "1:1",
      "verb": {"ja":"運営する","en":"operates"},
      "views": ["concept"]
    },
    {
      "id": "l5",
      "from": "tanja",
      "to": "project",
      "card": "1:1",
      "verb": {"ja":"実施する","en":"runs"},
      "views": ["concept"]
    },
    {
      "id": "l6",
      "from": "farm",
      "to": "coffee",
      "card": "1:N",
      "verb": {"ja":"栽培する","en":"grows"},
      "views": ["concept"]
    },
    {
      "id": "l7",
      "from": "farm",
      "to": "macadamia",
      "card": "1:N",
      "verb": {"ja":"栽培する","en":"grows"},
      "views": ["concept"]
    },
    {
      "id": "l8",
      "from": "farm",
      "to": "avocado",
      "card": "1:N",
      "verb": {"ja":"栽培する","en":"grows"},
      "views": ["concept"]
    },
    {
      "id": "l9",
      "from": "project",
      "to": "carbon",
      "card": "1:N",
      "verb": {"ja":"取り組む","en":"includes"},
      "views": ["concept"]
    },
    {
      "id": "l10",
      "from": "project",
      "to": "school",
      "card": "1:N",
      "verb": {"ja":"取り組む","en":"includes"},
      "views": ["concept"]
    },
    {
      "id": "l28",
      "from": "farm",
      "to": "beekeeping",
      "card": "1:N",
      "verb": {"ja":"営む","en":"keeps"},
      "views": ["concept"]
    },
    {
      "id": "l29",
      "from": "project",
      "to": "cattle",
      "card": "1:N",
      "verb": {"ja":"取り組む","en":"includes"},
      "views": ["concept"]
    },
    {
      "id": "l30",
      "from": "tanja",
      "to": "cafe",
      "card": "1:1",
      "verb": {"ja":"経営する","en":"runs"},
      "views": ["concept"]
    },
    {
      "id": "l11",
      "from": "our-company",
      "to": "tanja",
      "card": "1:1",
      "verb": {"ja":"紹介する","en":"describes"},
      "views": ["concept"]
    },
    {
      "id": "l12",
      "from": "tanja",
      "to": "vision-mission",
      "card": "1:1",
      "verb": {"ja":"掲げる","en":"states"},
      "views": ["concept"]
    },
    {
      "id": "l13",
      "from": "staff",
      "to": "tanja",
      "card": "N:1",
      "verb": {"ja":"所属する","en":"works at"},
      "views": ["concept"]
    },
    {
      "id": "l14",
      "from": "career",
      "to": "tanja",
      "card": "1:1",
      "verb": {"ja":"働き方を伝える","en":"describes work at"},
      "views": ["concept"]
    },
    {
      "id": "l15",
      "from": "nav-item",
      "to": "about",
      "card": "N:1",
      "verb": {"ja":"移動先","en":"links to"},
      "views": ["design"]
    },
    {
      "id": "l31",
      "from": "nav-item",
      "to": "staff",
      "card": "N:1",
      "verb": {"ja":"移動先","en":"links to"},
      "views": ["design"]
    },
    {
      "id": "l16",
      "from": "nav-item",
      "to": "what-we-do",
      "card": "N:1",
      "verb": {"ja":"移動先","en":"links to"},
      "views": ["design"]
    },
    {
      "id": "l17",
      "from": "nav-item",
      "to": "career",
      "card": "N:1",
      "verb": {"ja":"移動先","en":"links to"},
      "views": ["design"]
    },
    {
      "id": "l18",
      "from": "nav-item",
      "to": "contact",
      "card": "N:1",
      "verb": {"ja":"移動先","en":"links to"},
      "views": ["design"]
    },
    {"id":"l19","from":"photo-slot","to":"photo","card":"1:N","verb":{"ja":"写真を差し込む","en":"holds"}},
    {
      "id": "l20",
      "from": "photo",
      "to": "source",
      "card": "N:1",
      "verb": {"ja":"出所","en":"sourced from"},
      "field": "source"
    },
    {
      "id": "l21",
      "from": "claim",
      "to": "source",
      "card": "N:1",
      "verb": {"ja":"出典","en":"cites"},
      "field": "source"
    },
    {
      "id": "l22",
      "from": "claim",
      "to": "our-company",
      "card": "N:1",
      "verb": {"ja":"根拠づける","en":"backs"},
      "noFk": true
    },
    {"id":"l23","from":"claim","to":"farm","card":"N:1","verb":{"ja":"根拠づける","en":"backs"},"noFk":true},
    {
      "id": "l24",
      "from": "claim",
      "to": "project",
      "card": "N:1",
      "verb": {"ja":"根拠づける","en":"backs"},
      "noFk": true
    },
    {
      "id": "l25",
      "from": "translation",
      "to": "language",
      "card": "N:1",
      "verb": {"ja":"言語","en":"in"},
      "field": "language"
    },
    {
      "id": "l26",
      "from": "project",
      "to": "article",
      "card": "N:1",
      "verb": {"ja":"詳細記事","en":"detail page"},
      "field": "detail_article",
      "optional": true,
      "views": ["er"]
    },
    {
      "id": "l27",
      "from": "news",
      "to": "article",
      "card": "1:N",
      "verb": {"ja":"一覧する","en":"lists"},
      "views": ["concept"]
    }
  ]
};
