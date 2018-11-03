import ViewContainer from './ViewContainer'

import AssociatedDocuments from './boxes/AssociatedDocuments'
import CommentsBox from './boxes/CommentsBox'
import LangSwitcherBox from './boxes/LangSwitcherBox'
import LicenseBox from './boxes/LicenseBox'
import MapBox from './boxes/MapBox'
import RecentOutingsBox from './boxes/RecentOutingsBox'
import ToolBox from './boxes/ToolBox'
import AllRoutesBox from './boxes/AllRoutesBox'

import FieldView from './fieldViewers/FieldView'
import LabelValue from './fieldViewers/LabelValue'
import DoubleNumericField from './fieldViewers/DoubleNumericField'
import MarkdownSection from './fieldViewers/MarkdownSection'
import ProfilesLinks from './fieldViewers/ProfilesLinks'

export default {

    components: {
        ViewContainer,

        AssociatedDocuments,
        CommentsBox,
        DoubleNumericField,
        FieldView,
        LangSwitcherBox,
        LabelValue,
        LicenseBox,
        MapBox,
        MarkdownSection,
        ProfilesLinks,
        RecentOutingsBox,
        ToolBox,
        AllRoutesBox,
    },
}
