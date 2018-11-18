| **directory** | **comment** |
|---|---|
|assets|Statics assets (images, svg, fonts, css)|
|&nbsp;&nbsp;&nbsp;&nbsp;fonts|Icon fonts|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;activities|Camptocamp activity icons font|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;quality|Camptocamp documents' quality (draft, medium...) icons font|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;waypoint_types|Waypoint type icons font|
|&nbsp;&nbsp;&nbsp;&nbsp;img|Static images in PNG, SVG or JPEG|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;app| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;backgrounds|The images in this directory are used as backgrounds in the homepage.|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;documents|SVG files for each document types (outing, route, profile...)|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;activities|SVG files for each activity|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;waypoints|SVG files for each waypoint types|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;social| |
|&nbsp;&nbsp;&nbsp;&nbsp;sass|CSS global files|
|components|This folder contains all Vue components.|
|&nbsp;&nbsp;&nbsp;&nbsp;cards|Document's cards. Simply use them with `<document-card :document="myOuting" />`.|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils| |
|&nbsp;&nbsp;&nbsp;&nbsp;datatable|A table that display a list of document. |
|&nbsp;&nbsp;&nbsp;&nbsp;feed-widget| |
|&nbsp;&nbsp;&nbsp;&nbsp;generics|Generic components. Any component present in this folder is available everywhere. |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;buttons| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;icons|Components in this folder are simple icon, without any behavior|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;document|Icons by document type (outing, route...)|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;inputs|All input must be wrapped into a `.control` container|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;links| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;markdown| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;markers|A `marker` is an icon, with some feature, like a tooltip, inside logic, or anything else.|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;modals|Generic modal windows|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;pretty-links| |
|&nbsp;&nbsp;&nbsp;&nbsp;helper|Global helper window. Call it with a simple `this.$helper.show(helperId)`.|
|&nbsp;&nbsp;&nbsp;&nbsp;images-uploader|Image uploader component. It's included in all document views.|
|&nbsp;&nbsp;&nbsp;&nbsp;map|THE map component, it's a wrapper around [OpenLayers](https://openlayers.org/)|
|&nbsp;&nbsp;&nbsp;&nbsp;markdown-editor|A textarea-based component that edit a markdown value. Comes with helpers and preview.|
|js|Pure Javascript files.|
|&nbsp;&nbsp;&nbsp;&nbsp;apis|API tools (c2c API, discourse API, biodiv API).|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;c2c|c2c API service|
|&nbsp;&nbsp;&nbsp;&nbsp;constants| |
|&nbsp;&nbsp;&nbsp;&nbsp;libs|Wrappers, with small functionalities, around existing libraries |
|&nbsp;&nbsp;&nbsp;&nbsp;vue-plugins|All files here are Vue plugins. They are included in `@/main.js` with `Vue.use(plugin)`.|
|translations| |
|&nbsp;&nbsp;&nbsp;&nbsp;dist|Do not edit these files, thee are generated from .po files|
|&nbsp;&nbsp;&nbsp;&nbsp;po| |
|views|Main views called by vue-router.|
|&nbsp;&nbsp;&nbsp;&nbsp;document|Views for each document type. Maybe the most important folder!|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;boxes| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;field-viewers| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;windows| |
|&nbsp;&nbsp;&nbsp;&nbsp;documents|Document list view.|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils| |
|&nbsp;&nbsp;&nbsp;&nbsp;portals|Dynamics views, that display a specific content (dashboard, feed)|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils| |
|&nbsp;&nbsp;&nbsp;&nbsp;static-views|Static views that display a specific content (Serac, intro...)|
|&nbsp;&nbsp;&nbsp;&nbsp;user|Profile related views|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils| |
|&nbsp;&nbsp;&nbsp;&nbsp;wiki| |
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;edition|Edition views, one per document's type|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils|Utilities for edition views.|
|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;utils| |