| **directory** | **comment** |
|---|---|
|apis|API tools (c2c API, discourse API, biodiv API).|
|&nbsp;&nbsp;&nbsp;&nbsp;c2c|c2c API service|
|assets|Statics assets (images, svg, fonts, css)|
|&nbsp;&nbsp;&nbsp;&nbsp;fonts|Icon fonts|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;activities|Camptocamp activity icons fonts|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;quality| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;waypoint_types|Waypoint type icons font|
|&nbsp;&nbsp;&nbsp;&nbsp;img|Static images in PNG, SVG or JPEG|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;app| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;documents| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;activities| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;waypoints| |
|&nbsp;&nbsp;&nbsp;&nbsp;sass|CSS global files|
|components|This folder contains all Vue components.|
|&nbsp;&nbsp;&nbsp;&nbsp;cards|Document's cards. Simply use them with `<document-card :document="myOuting" />`.|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils| |
|&nbsp;&nbsp;&nbsp;&nbsp;datatable|A table that display a list of document. |
|&nbsp;&nbsp;&nbsp;&nbsp;helper|Global helper window. Call it with a simple `this.$helper.show(helperId)`.|
|&nbsp;&nbsp;&nbsp;&nbsp;imagesUploader|Image uploader component. It's included in all document views.|
|&nbsp;&nbsp;&nbsp;&nbsp;map|THE map component, it's a wrapper around [OpenLayers](https://openlayers.org/)|
|&nbsp;&nbsp;&nbsp;&nbsp;markdownEditor| |
|&nbsp;&nbsp;&nbsp;&nbsp;utils|Generic components. Any component present in this folder is available everywhere. |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;buttons| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;icons|Components in this folder are simple icon, without any behavior|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;inputs|All input must be wrapped into a `.control` container|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;links| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;markers|A `marker` is an icon, with some feature, like a tooltip, inside logic, or anything else.|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;modals|Generic modal windows|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;prettyLinks| |
|&nbsp;&nbsp;&nbsp;&nbsp;views|Router views.|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;document| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;boxes| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fieldViewers| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;windows| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;documents| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;edition|What is the logic behind field distribution in edition views ?|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils|Utilities for edition views.|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;portals| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;search| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;staticViews|This views does not depend on API content. |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;user| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wiki| |
|js|Generic Javascript files.|
|libs|Wrappers, with small functionalities, around existing libraries |
|tools|All files here are Vue plugins. They are included in `@/main.js` with `Vue.use(plugin)`.|
|translations| |
|&nbsp;&nbsp;&nbsp;&nbsp;dist|Do not edit these files, thee are generated from .po files|
|&nbsp;&nbsp;&nbsp;&nbsp;po| |