import { type IconDefinition, library } from '@fortawesome/fontawesome-svg-core';
// named imports from the packages' ES modules, which the bundler tree-shakes: the per-icon files are CommonJS, whose
// wrappers tripled the icons' size in the startup bundle (#4878)
import { faCreativeCommons, faFacebook, faGoogle, faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons';
import {
  faCircle as faCircleRegular,
  faClock as faClockRegular,
  faFaceFrown as faFaceFrownRegular,
  faHourglass as faHourglassRegular,
  faTrashAlt as faTrashAltRegular,
  faWindowMaximize as faWindowMaximizeRegular,
} from '@fortawesome/free-regular-svg-icons';
import {
  faAngleDown,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faArrowsAltV,
  faArrowUpFromBracket,
  faAt,
  faAtlas,
  faBan,
  faBars,
  faBold,
  faBolt,
  faBomb,
  faBookmark,
  faBookOpen,
  faBroom,
  faBug,
  faBullseye,
  faBus,
  faCalendar,
  faCamera,
  faChartBar,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircle,
  faCircleCheck,
  faCircleNotch,
  faClock,
  faCloud,
  faCode,
  faColumns,
  faComment,
  faComments,
  faCompass,
  faCompress,
  faDatabase,
  faDirections,
  faDownload,
  faEdit,
  faEllipsisVertical,
  faEnvelope,
  faExclamation,
  faExclamationCircle,
  faExpand,
  faExternalLinkAlt,
  faEye,
  faEyeSlash,
  faFileDownload,
  faFilter,
  faFlag,
  faFlagCheckered,
  faFolder,
  faGear,
  faGears,
  faGlobe,
  faGlobeAmericas,
  faGrin,
  faHashtag,
  faHeading,
  faHeart,
  faHistory,
  faHome,
  faImage,
  faInfo,
  faInfoCircle,
  faItalic,
  faKey,
  faLayerGroup,
  faLink,
  faList,
  faListOl,
  faListUl,
  faLocationCrosshairs,
  faLock,
  faMap,
  faMapMarkedAlt,
  faMapMarkerAlt,
  faMinus,
  faMobileScreen,
  faMoon,
  faMountain,
  faNewspaper,
  faObjectGroup,
  faPalette,
  faPen,
  faPlug,
  faPlus,
  faPlusCircle,
  faPlusMinus,
  faPrint,
  faQuestionCircle,
  faRedoAlt,
  faRobot,
  faRotate,
  faRoute,
  faRuler,
  faScissors,
  faSearch,
  faShareAlt,
  faSignInAlt,
  faSignOutAlt,
  faSortAmountDown,
  faSortAmountDownAlt,
  faSortAmountUp,
  faSpinner,
  faSquare,
  faSquarePlus,
  faStar,
  faSun,
  faTachometerAlt,
  faTag,
  faTh,
  faThLarge,
  faThList,
  faTrash,
  faTriangleExclamation,
  faUndoAlt,
  faUnlock,
  faUpload,
  faUser,
  faUserCheck,
  faUserLock,
  faUserPlus,
  faUserShield,
  faUsers,
  faWifi,
  faWrench,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon, FontAwesomeLayers } from '@fortawesome/vue-fontawesome';
import type { App } from 'vue';

import activityHiking from '@/assets/font-awesome-custom/js/activity/hiking';
import activityIce_climbing from '@/assets/font-awesome-custom/js/activity/ice_climbing';
import activityMountain_biking from '@/assets/font-awesome-custom/js/activity/mountain_biking';
import activityMountain_climbing from '@/assets/font-awesome-custom/js/activity/mountain_climbing';
import activityOther from '@/assets/font-awesome-custom/js/activity/other';
import activityParagliding from '@/assets/font-awesome-custom/js/activity/paragliding';
import activityRock_climbing from '@/assets/font-awesome-custom/js/activity/rock_climbing';
import activitySkitouring from '@/assets/font-awesome-custom/js/activity/skitouring';
import activitySlacklining from '@/assets/font-awesome-custom/js/activity/slacklining';
import activitySnow_ice_mixed from '@/assets/font-awesome-custom/js/activity/snow_ice_mixed';
import activitySnowshoeing from '@/assets/font-awesome-custom/js/activity/snowshoeing';
import activityVia_ferrata from '@/assets/font-awesome-custom/js/activity/via_ferrata';
import documentTypeOuting from '@/assets/font-awesome-custom/js/document-type/outing';
import drill from '@/assets/font-awesome-custom/js/miscs/drill';
import paragliding from '@/assets/font-awesome-custom/js/miscs/paragliding';
import sort from '@/assets/font-awesome-custom/js/miscs/sort';
import qualityDraft from '@/assets/font-awesome-custom/js/quality/draft';
import qualityEmpty from '@/assets/font-awesome-custom/js/quality/empty';
import qualityFine from '@/assets/font-awesome-custom/js/quality/fine';
import qualityGreat from '@/assets/font-awesome-custom/js/quality/great';
import qualityMedium from '@/assets/font-awesome-custom/js/quality/medium';
import waypointaccess from '@/assets/font-awesome-custom/js/waypoint/access';
import waypointbase_camp from '@/assets/font-awesome-custom/js/waypoint/base_camp';
import waypointbergschrund from '@/assets/font-awesome-custom/js/waypoint/bergschrund';
import waypointbisse from '@/assets/font-awesome-custom/js/waypoint/bisse';
import waypointbivouac from '@/assets/font-awesome-custom/js/waypoint/bivouac';
import waypointcamp_site from '@/assets/font-awesome-custom/js/waypoint/camp_site';
import waypointcanyon from '@/assets/font-awesome-custom/js/waypoint/canyon';
import waypointcave from '@/assets/font-awesome-custom/js/waypoint/cave';
import waypointcliff from '@/assets/font-awesome-custom/js/waypoint/cliff';
import waypointclimbing_indoor from '@/assets/font-awesome-custom/js/waypoint/climbing_indoor';
import waypointclimbing_outdoor from '@/assets/font-awesome-custom/js/waypoint/climbing_outdoor';
import waypointconfluence from '@/assets/font-awesome-custom/js/waypoint/confluence';
import waypointgite from '@/assets/font-awesome-custom/js/waypoint/gite';
import waypointglacier from '@/assets/font-awesome-custom/js/waypoint/glacier';
import waypointhut from '@/assets/font-awesome-custom/js/waypoint/hut';
import waypointlake from '@/assets/font-awesome-custom/js/waypoint/lake';
import waypointlocal_product from '@/assets/font-awesome-custom/js/waypoint/local_product';
import waypointlocality from '@/assets/font-awesome-custom/js/waypoint/locality';
import waypointmisc from '@/assets/font-awesome-custom/js/waypoint/misc';
import waypointparagliding_landing from '@/assets/font-awesome-custom/js/waypoint/paragliding_landing';
import waypointparagliding_takeoff from '@/assets/font-awesome-custom/js/waypoint/paragliding_takeoff';
import waypointpass from '@/assets/font-awesome-custom/js/waypoint/pass';
import waypointpit from '@/assets/font-awesome-custom/js/waypoint/pit';
import waypointshelter from '@/assets/font-awesome-custom/js/waypoint/shelter';
import waypointslackline_spot from '@/assets/font-awesome-custom/js/waypoint/slackline_spot';
import waypointsummit from '@/assets/font-awesome-custom/js/waypoint/summit';
import waypointvirtual from '@/assets/font-awesome-custom/js/waypoint/virtual';
import waypointwaterfall from '@/assets/font-awesome-custom/js/waypoint/waterfall';
import waypointwaterpoint from '@/assets/font-awesome-custom/js/waypoint/waterpoint';
import waypointwaypoints from '@/assets/font-awesome-custom/js/waypoint/waypoints';
import waypointweather_station from '@/assets/font-awesome-custom/js/waypoint/weather_station';
import waypointwebcam from '@/assets/font-awesome-custom/js/waypoint/webcam';

// registered globally
export default function install(app: App) {
  // generated by tools/generate-icons.ts
  const customIcons = [
    drill,
    paragliding,
    sort,

    documentTypeOuting,

    waypointaccess,
    waypointbase_camp,
    waypointbergschrund,
    waypointbisse,
    waypointbivouac,
    waypointcamp_site,
    waypointcanyon,
    waypointcave,
    waypointcliff,
    waypointclimbing_indoor,
    waypointclimbing_outdoor,
    waypointconfluence,
    waypointgite,
    waypointglacier,
    waypointhut,
    waypointlake,
    waypointlocality,
    waypointlocal_product,
    waypointmisc,
    waypointparagliding_landing,
    waypointparagliding_takeoff,
    waypointpass,
    waypointpit,
    waypointshelter,
    waypointslackline_spot,
    waypointsummit,
    waypointvirtual,
    waypointwaterfall,
    waypointwaterpoint,
    waypointwaypoints,
    waypointweather_station,
    waypointwebcam,

    activityHiking,
    activityIce_climbing,
    activityOther,
    activityMountain_biking,
    activityMountain_climbing,
    activityParagliding,
    activityRock_climbing,
    activitySkitouring,
    activitySlacklining,
    activitySnowshoeing,
    activitySnow_ice_mixed,
    activityVia_ferrata,

    qualityEmpty,
    qualityDraft,
    qualityMedium,
    qualityFine,
    qualityGreat,
  ] satisfies IconDefinition[];

  library.add(
    ...customIcons,

    // solid icons
    faAngleDown,
    faArrowsAltV,
    faArrowLeft,
    faArrowRight,
    faArrowUp,
    faAt,
    faAtlas,
    faBan,
    faBars,
    faBold,
    faBolt,
    faBomb,
    faBroom,
    faBug,
    faBus,
    faBullseye,
    faCalendar,
    faCamera,
    faChartBar,
    faCheck,
    faCheckCircle,
    faChevronLeft,
    faChevronRight,
    faChevronUp,
    faChevronDown,
    faCircle,
    faCircleNotch,
    faCloud,
    faCode,
    faColumns,
    faComment,
    faComments,
    faCompass,
    faCompress,
    faDatabase,
    faDirections,
    faDownload,
    faEdit,
    faEllipsisVertical,
    faExclamation,
    faExclamationCircle,
    faExpand,
    faExternalLinkAlt,
    faEye,
    faEyeSlash,
    faFileDownload,
    faFilter,
    faFlag,
    faFlagCheckered,
    faGear,
    faGears,
    faGlobe,
    faGlobeAmericas,
    faGrin,
    faHashtag,
    faHeading,
    faHeart,
    faHistory,
    faHome,
    faImage,
    faInfo,
    faInfoCircle,
    faItalic,
    faKey,
    faLayerGroup,
    faLink,
    faList,
    faListOl,
    faListUl,
    faLock,
    faLocationCrosshairs,
    faMap,
    faMapMarkedAlt,
    faMapMarkerAlt,
    faMinus,
    faNewspaper,
    faObjectGroup,
    faPen,
    faPlug,
    faPlus,
    faPlusCircle,
    faPlusMinus,
    faPrint,
    faQuestionCircle,
    faRedoAlt,
    faRobot,
    faRotate,
    faRoute,
    faRuler,
    faScissors,
    faSearch,
    faShareAlt,
    faSignInAlt,
    faSignOutAlt,
    faSortAmountDown,
    faSortAmountDownAlt,
    faSortAmountUp,
    faSquare,
    faStar,
    faSun,
    faTachometerAlt,
    faTag,
    faTh,
    faThLarge,
    faThList,
    faTrash,
    faUndoAlt,
    faUnlock,
    faUpload,
    faUser,
    faUserCheck,
    faUserLock,
    faUserPlus,
    faUsers,
    faUserShield,
    faWrench,
    faArrowUpFromBracket,
    faBookOpen,
    faEnvelope,
    faMobileScreen,
    faMoon,
    faMountain,
    faPalette,
    faSquarePlus,
    faXmark,
    faClock,
    faBookmark,
    faCircleCheck,
    faFolder,
    faSpinner,
    faTriangleExclamation,
    faWifi,
    faArrowDown,

    // regular icons
    faCircleRegular,
    faClockRegular,
    faFaceFrownRegular,
    faHourglassRegular,
    faTrashAltRegular,
    faWindowMaximizeRegular,

    // brands icons
    faCreativeCommons,
    faFacebook,
    faGoogle,
    faInstagram,
    faYoutube
  );

  app.component('FaIcon', FontAwesomeIcon);
  app.component('FaLayers', FontAwesomeLayers);
}
