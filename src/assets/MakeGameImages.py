# -*- coding: utf-8 -*-
"""
Read the game specific files (like those that can be "Save SVG"d from the gameslib playground) and put them in GameImages.js.
Overwrites GameImages.js

@author: pvanwamelen
"""
from os import listdir
from os.path import isfile, join

h = open("GameImages.js", "w")
h.write("const gameImages = {\n")
mypath = ".";
files = [f for f in listdir(mypath) if isfile(join(mypath, f))]
first = True
for f in files:
    if f[-4:] == '.txt':
        h2 = open(f)
        s = h2.read()
        h2.close()
        if first:
            first = False
        else:
            h.write(',\n')
        h.write('  "' + f[0:-4] + '": \'' + s + '\'')
h.write('\n}\n\nmodule.exports = gameImages;\n')
h.close()
