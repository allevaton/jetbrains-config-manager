# JetBrains Configuration Manager
I don't know about you, but I like my editors *consistent*.

I also really like JetBrains IDEs. I work on multiple machines (laptops, desktops, work, home), and I would really
like the ability to have a global configuration for each editor I use. I use GitHub for my dotfiles, but that isn't enough.

JetBrains editors don't really talk to each other to save settings, so I made my own way of doing it in a nice, managed
interface.

## Screenshot
![Screenshot](screenshots/main.png)

## Install
Simply `git clone` this repository, then:
```
   npm install
   node server.js
```
Your preferred browser should open immediately and be directed to `http://localhost:15678/`. Ease of use, I suppose.

## Usage
The interface is quite simple and is very self-explanatory.

Upon entering the main screen, you will be presented with a few options on the left side which are representative of
the IDEs you have currently installed. Once you click on one, it will then load the next set of options, which are
the options you want to have configured. So if you want to configure PyCharm's colors, you'll click on PyCharm, then
"Colors," After this, you'll be presented with a big editor and some buttons on the top.

The buttons are pretty self-explanatory, except "Copy to...". The "Copy to" button will open a dialog and will show you
a list of all the *other* installed JetBrains IDEs you can copy this current setting to. If I want PhpStorm's key
configurations in WebStorm, I'll click on PhpStorm, then "Keybinds", then "Copy To...", and select "WebStorm".

**Note** that all changes you make are ***PERMANENT*** unless you have a remote server-like setup where you can revert
your changes.

## Editing for Future JetBrains Editors
JetBrains is always making new great stuff, so how could we enable this to work for those future ones?

Well let's take a look at `lib/jbcm_api.js`; the API host file which processes our file-level commands.

There's a few lines in the beginning of this file that looks as such:

    exports.configs = {
        ...
    }

These are the *supported IDEs.* It is an object relating the *editor's name* to the *configuration directory.* If you
make a change or addition to these, there is also an image which corresponds directly to the *editor's name*,
located in the `root/images/` directory. For example, if we want to add WebStorm15, we would add to the object:

    WebStorm15: ".WebStorm15",

and create an image in the `images` directory named `images/WebStorm15.png` (png for transparency; we should look at
doing SVGs instead). As long as they keep their awesome configuration file structure, this program should last a
long time.
