# Rebuilding menu navigation for [protoLayers](https://github.com/Inventsable/protoLayers)

I assume coding is like animation -- for best results you should start with the structure instead of hastily throwing functionality and design together and wrestling with a complicated mess.

Initially I was traversing menus based on current nesting group, PIN, depth, and index -- my first attempt (current protoLayers build) ended up being a complicated mess with many more problems ahead. At this point I may as well rebuild from scratch the right way instead of continuing with a rickety bridge made of impromptu bandages.

This is going to be a simplified version of an infinitely nestable menu with a custom selection/focus mechanic based on a more efficient setup and traversing the results of `document.querySelectorAll()` to handle custom selection, focus and key navigation events. Once done with the logic here, I'll be porting this mechanic to protoLayers and future projects (including protoFiles, a full rebuild of [mightyFolders](https://github.com/Inventsable/mightyFolders) for tree menu navigation of files and folders in AI, AE, PS and all other compatible Adobe apps).