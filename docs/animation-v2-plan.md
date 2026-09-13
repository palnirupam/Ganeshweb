# AARAMBH: advanced animation plan

Research date: 14 September 2026. Nicher proposal-ti original design reference. Implementation delivery: refined SVG volumes/masks, Canvas hero filaments and organic particles, 12.5-second master clock, mandala unfolding, supplied MP3, pause/replay/fullscreen, portrait mode and deterministic MP4 export.

Implementation choice: existing Canvas/SVG renderer retained. A single explicit clock coordinates artwork and particles and supports complete DOM/SVG/canvas capture; Three.js/GSAP and multi-pass GPU bloom were not needed for this delivery. Desktop/mobile viewport browser checks cover playback, controls and reduced motion; real Android/iOS GPU performance is not claimed. The 18-second Instagram clip contains the first 18 seconds of the supplied track with a soft ending fade.

## Direction

Ganesh er abirbhav ke ekta alor sculpture er moto dekhano: ondhokarer moddhe alo ghure ashbe, rekha khuje pabe, rup er moddhe jome uthbe, tarpor shanto antique-gold finish e settle korbe. Ekta continuous, carefully timed reveal hobe main attraction.

User er accepted warm-black/gold identity aar code diye toiri artwork thakbe foundation. Photo, downloaded deity illustration, smoke PNG, sparkle sprite ba pre-rendered reveal video ei proposal er input noy. Surface, particle, smoke aar glow code thekei generate kora jabe.

## Current version e ja peyechhi

- Ganesh er original SVG contour ache; main stroke width motamuti uniform. Variable stroke width, jewelry detail aar cleaner overlaps diye illustration aro expressive kora jabe.
- Particle ra precomputed quadratic curve dhore SVG path e pouchhay. Organic flow, depth ba light-er dynamic shading ekhono nei.
- Mandala-r geometry ache, kintu reveal muloto opacity diye hoy. Petal-by-petal unfolding ekhono nei.
- Canvas aar SVG pointer e eki offset e sore; alada layer er depth response nei.
- Final figure er opacity breathe kore. Figure stable rekhe alor reflection aste cholale material er feel beshi ashte pare.
- Replay, skip, fullscreen, optional audio, reduced-motion preference aar hidden-tab pause already ache. Egulo next renderer eo maintain korte hobe.

## Design tokens aar composition

| Token | Value | Kothay use hobe |
| --- | --- | --- |
| Deep warm black | `#100D0B` | Background aar negative space |
| Shadow bronze | `#302116` | Khub halka inner volume |
| Antique gold | `#D8AE66` | Main contour aar settled light |
| Pale gold | `#F1D7A2` | Chhoto moving reflections |
| Warm ivory | `#F3E8D4` | Readable text |
| Sindoor | `#C65C35` | Tilak aar koyekta petal accent |

Cormorant display typography aar Inter controls thakbe. User existing look pochhondo korechhen, tai animation upgrade er sathe unnecessary brand redesign jorbo na. Chhoto ornamental label komiye controls readable korte hobe.

Opening e existing left-aligned introduction aar right-side spark composition. Reveal er somoy introduction aste visual priority chhere debe; artwork er frame e controlled push-in hobe. Mobile e centered portrait stage, scroll gesture free, replay stage er niche.

```text
Desktop opening                Reveal / portrait focus
┌──────────────────────────┐   ┌──────────────────────┐
│ Brand          Controls  │   │ Quiet outer halo     │
│                          │   │     Back mandala     │
│ Introduction    Spark    │   │        GANESH        │
│ Begin button    Orbit    │   │   Foreground light   │
│                          │   │       Blessing       │
└──────────────────────────┘   │ Pause  Replay  View  │
                               └──────────────────────┘
```

## Proposed 12.5-second choreography

Timing gulo initial creative target. Motion review e tune hobe.

| Somoy | Ki dekhbe | Keno eta kaj korbe |
| --- | --- | --- |
| 0–0.6 s | Click er sathe bindu ekbar compress kore, tarpor narrow warm ripple chhare | Input er immediate response; long empty wait nei |
| 0.6–2.4 s | Dui diker alor stream ghure center er dike ashe; koyekta foreground mote frame cross kore | Direction aar depth establish kore |
| 2.4–4.4 s | Tin main filament mukut, kan aar shurer initial curve dhore | Ei phase ei Ganesh ke chena jawa uchit |
| 4.4–7.3 s | Filament er pichhone fine dust settle kore; trunk, body aar ashirbader haat complete hoy | Rup ta alor moddhe ghonibhuto howar impression |
| 7.3–9.6 s | Padmasan er petal aste khole; back mandala-r duita ring offset timing e unfold kore | Main figure ke surround kore, attention support kore |
| 9.6–11.2 s | Ekta narrow highlight mukut theke curve dhore niche name; tilak aar palm e restrained accent | Surface aar craft er detail chokhe pore |
| 11.2–12.5 s | Warm halo ekbar expand kore settle hoy; blessing text ashe | Clear emotional landing, tarpor stillness |

## Core upgrades

### 1. Original artwork refinement

Mukut e purposeful jewelry pattern, kaner inner fold, shurer outer/inner line er width difference, clean hand overlap aar layered lotus. Primary outline aar ornament er visual weight alada hobe. Prothome glow chara monochrome artwork review korte hobe: animation er age rup ta sundor ebong instantly recognizable hote hobe.

Closed body regions aar hand masks prepare korte hobe, jate later fill particles ba back mandala unwanted jaygay dekha na jay. Current open contour theke direct volume assume kora jabe na.

### 2. Organic light flow

Tin hero filament er sathe finer particles thakbe. Movement e low-frequency procedural noise thakbe, jate shob particle identical arc dhore na chole. Arrival er final segment e noise aste zero-r dike jabe; shape e pouchhanor por jitter korbe na.

Bright core, thin tail aar short-lived afterglow alada brightness e render hobe. First prototype e deterministic shader motion use kora jabe; full fluid simulation ba stateful GPU particle simulation initial requirement noy.

### 3. Alo theke surface

Particle shudhu outline e noy, selected closed region er moddheo sparse bhabe settle korbe. Center/shadow side comparatively dark; selected edges e reflection. Ete shallow relief er feel ashbe, face er negative space clear thakbe.

Initial bright formation aste antique-gold e settle korbe. Eta stylized 2.5D material treatment; physically accurate full 3D statue er claim noy.

### 4. Selective glow aar moving reflection

Line art sharp thakbe. Bloom primarily brightest incoming particle, leading filament aar chhoto jewelry highlight e apply hobe. Ekta highlight sweep form er curvature follow korbe. Shob object ke same blur dile detail noshto hobe.

Three.js selective bloom example technique support kore, kintu tar multi-pass rendering er cost measure korte hobe. Low-quality mode e simplified glow use kora jabe.

### 5. Depth aar mandala unfolding

Background atmosphere, back mandala, main Ganesh, foreground sparks alada depth e thakbe. Pointer response layer-vittik hobe; main figure comparatively stable. Foreground particle boro aar soft, distant particle chhoto aar dim.

Mandala petal gulo group kore unfold hobe. Duita ring very slow opposite direction e cholte pare, kintu movement ta secondary. Face/body region e back ornament-er opacity/mask control korte hobe.

Main reveal e subtle camera push-in; large orbiting camera, sudden shake ba constant full-scene tilt proposed sequence er part noy.

### 6. Interaction aar sound

Mouse kachhe ele outer dust locally attract hobe, tarpor gently return korbe. Deity er facial geometry pointer follow korbe na. Mobile e tap e ekta contained wave; page scroll er sathe drag conflict hobe na. Basic reveal single click/tap-e start hobe.

Optional audio te quiet drone, restrained bell-like attack aar longer decay. Reveal er main moments e sound cue align hobe. Sound-off mode e-o shob visual cue self-sufficient. User-enabled audio aar global pause er state fullscreen eo accessible thakbe.

### 7. Quiet ending aar replay

Final figure steady thakbe; crown reflection, halo aar very few ambient motes scene ke alive rakhbe. Current whole-figure opacity breathing replace kore light-intensity variation prefer korbo.

Replay te short dissolve kore seed e return, tarpor same sequence. Independent random seed variations outer dust e possible; silhouette aar timing deterministic thakbe. Pause, skip, replay, hidden-tab resume shob ekta master clock follow korbe.

## Recommended technical approach

Existing static site structure thakbe. Animation renderer hisebe Three.js/WebGL2 prototype, choreography-r jonno GSAP timeline, artwork source hisebe current refined SVG. Dependencies install korar phase e exact stable version pin korte hobe.

- SVG theke contour points, fill regions aar overlap masks ekbar prepare/cache kora hobe.
- GPU particle buffer e source, target, size, start time, travel duration aar seed store hobe. Frame e uniforms update kore simulation er major work GPU te jabe.
- Particle shape procedural fragment shader diye; example e thaka PNG sprite copy korar dorkar nei.
- Main art, mandala aar luminous highlights shared scene coordinates follow korbe. Ek layer e double-bright duplicate outline ba SVG/WebGL alignment mismatch avoid korte hobe.
- GSAP master timeline phase labels, reveal progress, material intensity aar camera movement coordinate korbe. Render loop shudhu oi timeline state consume korbe.
- WebGL2 unavailable/context initialization fail hole existing SVG/Canvas-based reveal use korar fallback thakbe. Context loss, resize aar replay resource lifecycle handle korte hobe.

Pure Canvas/SVG diyeo onek visual improvement possible. Recommended GPU path-er justification holo richer particle flow, controllable depth aar selective bloom. First prototype e benefit clear na hole dependency/cost baranor age simpler renderer maintain kora uchit.

## Mobile aar performance targets

Egulo target, current measured result noy.

- Desktop e 60 fps target; modest phone e stable 30 fps fallback.
- Starting particle budget: desktop 4,000–8,000, mobile 1,500–3,000. Actual frame-time measurement e number adjust hobe.
- Bloom lower resolution e; particle draw calls batch kora; shader complexity cap kora.
- Screen width diyei device strength assume kora jabe na. Sustained frame time kharap hole particle density, bloom resolution aar pixel ratio stepwise kombe; rapidly quality toggle korbe na.
- Hidden/offscreen scene pause. Replay e geometry/material duplicate create kore memory barano jabe na.
- Reduced-motion mode e short fade diye completed artwork, camera travel/swirl chhara. Pause control ambient motion-o stop korbe.
- Chrome desktop, mobile viewport, real Android aar iOS Safari te practical verification target. Viewport emulation diye real phone GPU performance proven bola jabe na.

## Instagram-er jonno next phase

9:16 portrait composition high value: Ganesh boro, full silhouette visible, minimal title, controls optionally hidden. Story/reel UI overlay mathay rekhe preview frame tune hobe.

Downloadable clip separate phase. Canvas captureStream canvas er content capture kore; existing separate SVG/HTML automatically capture hoy na. Tai export er jonno artwork, particles aar text ek shared export surface e compose korte hobe. Optional sound stream mix korte hobe.

MP4/WebM capability MediaRecorder.isTypeSupported diye detect korte hobe. Supported format-o resource limit e fail korte pare. MP4 export ba exact 60-fps recording shob browser e guaranteed dhora jabe na. 720×1280 prototype diye encoding test, tarpor 1080×1920 evaluate kora uchit.

## Build order aar review

1. Monochrome refined Ganesh aar mobile proportions review.
2. Three hero filament, sparse fill particles aar selective glow er short prototype. Ei sample e improvement judge kora.
3. Full 12.5-second timeline, depth layers aar mandala unfolding.
4. Interaction, optional sound, pause/replay/skip aar graceful fallback.
5. Performance tuning, real-device review, then portrait mode.
6. Video export capability research/prototype after core visual direction stable.

Review frames: idle, 2.4 s, 4.4 s, 7.3 s, 10 s, final. Protita frame e face clear, glow unclipped, hand/ear overlap clean aar primary attention Ganesh er upor kina dekha hobe. Repeated replay, resize mid-reveal, sound toggle, hidden-tab resume, fullscreen transition, reduced-motion switch aar renderer failure verify korte hobe.

## Skill review against this brief

Public frontend-design skill-er subject-specific design, deliberate palette, single orchestrated motion aar restraint principles use kora hoyechhe. User existing identity pochhondo korechhen bole palette/type retain korar recommendation. Decorative UI baranor bodole craft budget figure, light choreography aar material response e dewa hoyechhe. Camera, particles, sound aar text shob ek sathe competing climax korbe na.

Skill global bhabe install kora hoyni; public SKILL.md research-er jonno read kora hoyechhe. Image-generation skill ei proposal e use kora hoyni, karon requested artwork procedural vector/code diye hobe.

## Sources aar kon finding support kore

Ei sources technical capability aar design principles support kore. Proposed visual direction, timing aar particle budget ei project-er design judgment; kono benchmark result ba verified Instagram trend ranking noy.

1. [Anthropic frontend-design SKILL.md](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) — subject-specific visual identity, motion restraint, plan/review process.
2. [GSAP Timeline](https://gsap.com/docs/v3/GSAP/Timeline/) — labels, overlapping sequences, pause/restart/reverse aar controlled timeline progress.
3. [Three.js selective bloom example](https://threejs.org/examples/webgl_postprocessing_unreal_bloom_selective.html), [source](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_postprocessing_unreal_bloom_selective.html) — separate bloom rendering aar controlled composition.
4. [Three.js custom particle attributes](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_buffergeometry_custom_attributes_particles.html) — BufferGeometry, Points, custom shader attributes. Example-er particle count performance guarantee noy; sprite image amader design e use hobe na.
5. [The Book of Shaders: fBM](https://thebookofshaders.com/13/) — layered noise, organic detail aar turbulence/domain-warping er foundation.
6. [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) — draw-call batching, buffer resolution, memory budgeting aar device-pixel-ratio considerations.
7. [web.dev animation guide](https://web.dev/articles/animations-guide) — transform/opacity, paint cost, blur cost aar frame-drop profiling.
8. [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — user preference onujayi movement reduce/replace kora.
9. [MDN canvas captureStream](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream) — canvas-only capture aar stream behavior.
10. [MDN MediaRecorder.isTypeSupported](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static) — codec capability detection aar recording resource limitations.
