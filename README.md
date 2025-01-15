# Inkling

A simple stand-alone webapp to showcase all the beautiful letters of a font (specifically the glyphs of any letter, mark, punctuation, symbol or number). Just a hint of the various letterforms that typeface designers and script engineers have built together (see the [definition of inkling](https://en.wiktionary.org/wiki/inkling)). It uses `opentype.js` along with `unicode-name|script|block.js` and does not require an active connection. Any fonts will stay local and not be uploaded to a server. You might like to try some [fonts featured on this showcase](https://openfontlicense.org/ofl-fonts).

## How to use Inkling

Just open the [Inkling main HTML page](https://n7s.github.io/inkling/http_root) in a browser like [Firefox](https://firefox.com) then drag-and-drop a font file on it. It will read TTF, OTF and WOFF file formats.

You can adjust the speed of animation, the size and the position of the glyph.
By default, the font metadata is displayed on the right-hand side, and on the right-hand side, there is more info about each glyph and its underlying Unicode character: name, full unicode name/script/block, hex notation, various links to external services to get more information on the character, a form to find the corresponding Unicode chart, along with the number out of the total amount of glyphs. By default a new glyph is shown every 2 seconds.

Bringing your mouse towards the lower portion of the screen will reveal the config panel where you can tweak the defaults and learn the shortcuts.

Made by Nicolas Spalinger, based on [HyperFlipBX90000Dominator](https://github.com/clauseggers/BX90000FontPresenterSuperSuite), from the BX90000FontPresenterSuperSuite by [Claus Egger Sørensen](https://www.forthehearts.net/about/).

## Copyright and License

Copyright (c) 2024 Claus Eggers Sørensen
Copyright (c) 2024, Nicolas Spalinger
This software is licensed under the [MIT license](LICENSE), like `opentype.js` `unicode-name.js`, `unicode-script.js` and `unicode-block.js`.
