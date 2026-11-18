# Атрибуція / Attribution

## 1. Власні 3D-рендери (`3d/`)
Створені для «Сніжка» офлайн-конвеєром `tools/render3d/` (three.js r170, процедурні моделі, однакове студійне
світло). Сторонніх моделей не використано. Ліцензія — та сама, що й у проєкту.

| Файл | Що це |
|---|---|
| 3d/squirrel_run.png (6 кадрів), squirrel_jump.png (2), squirrel_sit.png (4) | руда білка: хутро (shell fur), пухнастий хвіст, кисточки на вухах; біг, стрибок, сидить-гризе горішок |
| 3d/tangerine.png (3 варіанти), 3d/tangerine_peeled.png | мандарин зі шкіркою з порами (bump/roughness), плодоніжкою і листочком; очищений з часточками |
| 3d/nut.png | лісовий горіх |
| 3d/gift.png (3 варіанти) | подарунки зі стрічкою і бантом |
| 3d/snowmobile_0.png (з плугом), _1, _2 (по 4 кадри руху) | снігохід з водієм у шоломі |
| 3d/sleigh.png | сани Санти з тулубом Санти й мішком |
| 3d/bulbs.png (5 кольорів × увімк./притушені) | глянцеві лампочки гірлянди |

Використані бібліотеки інструмента (лише під час рендеру, у рушій не потрапляють): three.js — MIT,
© 2010–2024 three.js authors; Playwright — Apache-2.0, © Microsoft.

## 2. Microsoft Fluent Emoji 3D (MIT)
Джерело: https://github.com/microsoft/fluentui-emoji (папки `assets/<Name>/3D/`, PNG 256×256).

| Файл | Джерело | Зміни |
|---|---|---|
| snowman.png | Snowman / 3D | — |
| snowman_body.png, snowman_nohat.png, snowman_arm_l.png, snowman_arm_r.png, snowman_hat.png, snowman_carrot.png | Snowman without snow / 3D | розрізано на шари (руки, капелюх, морква; «без капелюха» — домальовано маківку) |
| penguin.png | Penguin / 3D | — |
| deer.png | Deer / 3D | — |
| santa.png | Santa claus / Default / 3D | — (голова Санти в санях) |

```
MIT License

Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE
```

## 3. Процедурне в коді рушія
М'які сніжинки, сніжки, тіні, бульбашки, салют — малюються кодом `snezhok-engine.js`; звуки синтезуються WebAudio.
